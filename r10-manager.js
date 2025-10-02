#!/usr/bin/env node
/**
 * R10 Manager
 * Objetivo: subir backend (porta 3002), frontend (porta 5175) e instagram (porta 8080)
 * de forma estável com auto-restart simples quando algum processo cair inesperadamente.
 * Comandos: start | stop | status | restart
 * Por padrão INICIA TODOS OS 3 SERVIÇOS. Use --no-instagram para desabilitar Instagram.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FRONT_DIR = path.join(ROOT, 'r10-front_full_07ago');
const PID_FILE = path.join(ROOT, '.r10-pids.json');
const STATE_FILE = path.join(ROOT, '.r10-state.json');

const args = process.argv.slice(2);
const cmd = (args[0] || 'start').toLowerCase();
const flags = new Set(args.slice(1));

const WANT_INSTAGRAM = !flags.has('--no-instagram'); // INVERTIDO: Instagram por padrão
const ONLY_BACKEND = flags.has('--backend-only');
const ONLY_FRONTEND = flags.has('--frontend-only');

// Serviços que vamos gerenciar
const SERVICES = [];

if (!ONLY_FRONTEND) {
  SERVICES.push({
    name: 'backend',
    cwd: ROOT,
    cmd: process.execPath, // node
    args: ['server/server-api-simple.cjs'],
    env: { ...process.env, PORT: process.env.PORT || '3002' }
  });
}
if (!ONLY_BACKEND) {
  SERVICES.push({
    name: 'frontend',
    cwd: FRONT_DIR,
    // Vamos chamar `npm run dev` para aproveitar config do package.json do front
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    env: { ...process.env },
    useShell: process.platform === 'win32'
  });
}
if (WANT_INSTAGRAM && !ONLY_BACKEND && !ONLY_FRONTEND) {
  SERVICES.push({
    name: 'instagram',
    cwd: ROOT,
    cmd: process.execPath,
    args: ['server.js'],
    env: { ...process.env, PORT: process.env.INSTAGRAM_PORT || '8080' }
  });
}

function loadPidFile() {
  try { return JSON.parse(fs.readFileSync(PID_FILE, 'utf8')); } catch { return {}; }
}
function savePidFile(data) {
  try { fs.writeFileSync(PID_FILE, JSON.stringify(data, null, 2)); } catch {}
}
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function saveState(data) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2)); } catch {}
}

function isPidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function color(code, str) { return `\u001b[${code}m${str}\u001b[0m`; }
const c = {
  green: s => color('32', s),
  red: s => color('31', s),
  yellow: s => color('33', s),
  cyan: s => color('36', s)
};

// Instala dependências do front se faltar node_modules
function ensureFrontendDeps() {
  if (!fs.existsSync(FRONT_DIR)) {
    console.warn(c.yellow('[manager] Diretório do frontend não encontrado, pulando.'));
    return;
  }
  const nm = path.join(FRONT_DIR, 'node_modules');
  if (!fs.existsSync(nm) || !fs.existsSync(path.join(nm, 'react'))) {
    console.log(c.cyan('[manager] Instalando dependências do frontend... (uma vez)'));
    const install = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], {
      cwd: FRONT_DIR,
      stdio: 'inherit'
    });
    return new Promise((resolve) => install.on('exit', (code) => {
      if (code !== 0) console.warn(c.yellow('[manager] npm install retornou código ' + code));
      resolve();
    }));
  }
  return Promise.resolve();
}

async function start() {
  console.log(c.green('=== R10 Manager: start ==='));
  if (!ONLY_BACKEND) await ensureFrontendDeps();

  const pidData = loadPidFile();
  const state = loadState();
  state.restartCounts = state.restartCounts || {}; // {serviceName: n}

  SERVICES.forEach(svc => {
    const tag = `[${svc.name}]`;
    function launch() {
      const child = spawn(svc.cmd, svc.args, {
        cwd: svc.cwd,
        env: svc.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: !!svc.useShell
      });
      pidData[svc.name] = child.pid;
      savePidFile(pidData);
      console.log(c.cyan(`${tag} iniciado (pid=${child.pid}) -> ${svc.cmd} ${svc.args.join(' ')}`));

      child.stdout.on('data', d => process.stdout.write(c.green(`${tag} `) + d.toString()));
      child.stderr.on('data', d => process.stderr.write(c.red(`${tag} `) + d.toString()));

      child.on('exit', (code, signal) => {
        const expectedStop = state.stopping;
        if (expectedStop) return; // stop manual
        console.warn(c.yellow(`${tag} saiu code=${code} signal=${signal}`));
        // Auto-restart com limite
        const count = (state.restartCounts[svc.name] || 0) + 1;
        state.restartCounts[svc.name] = count;
        saveState(state);
        const max = 20;
        if (count > max) {
          console.error(c.red(`${tag} excedeu ${max} reinícios. Abortando auto-restart.`));
          return;
        }
        const delay = Math.min(30000, 1000 * Math.pow(1.3, count));
        console.log(c.yellow(`${tag} tentando restart #${count} em ${(delay/1000).toFixed(1)}s...`));
        setTimeout(launch, delay);
      });
    }
    launch();
  });

  // Mantém processo vivo
  process.on('SIGINT', () => { console.log('\n[manager] SIGINT'); stop().then(()=>process.exit(0)); });
  process.on('SIGTERM', () => { console.log('\n[manager] SIGTERM'); stop().then(()=>process.exit(0)); });
}

async function stop() {
  console.log(c.green('=== R10 Manager: stop ==='));
  const pidData = loadPidFile();
  const state = loadState();
  state.stopping = true; saveState(state);
  for (const name of Object.keys(pidData)) {
    const pid = pidData[name];
    if (pid && isPidAlive(pid)) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/PID', String(pid), '/T', '/F']);
        } else {
          process.kill(pid, 'SIGTERM');
        }
        console.log(c.yellow(`[manager] Enviado stop -> ${name} (pid=${pid})`));
      } catch (e) {
        console.warn(c.red(`[manager] Falha ao matar ${name}: ${e.message}`));
      }
    }
  }
  // Limpar arquivos
  savePidFile({});
  const s = loadState(); delete s.stopping; saveState(s);
}

function status() {
  const pidData = loadPidFile();
  console.log(c.green('=== R10 Manager: status ==='));
  SERVICES.forEach(svc => {
    const pid = pidData[svc.name];
    if (pid && isPidAlive(pid)) {
      console.log(c.cyan(`${svc.name}: RUNNING (pid=${pid})`));
    } else {
      console.log(c.red(`${svc.name}: STOPPED`));
    }
  });
}

async function main() {
  if (cmd === 'start') return start();
  if (cmd === 'stop') return stop();
  if (cmd === 'status') return status();
  if (cmd === 'restart') { await stop(); setTimeout(start, 1000); return; }
  console.log('Uso: node r10-manager.js <start|stop|status|restart> [--backend-only|--frontend-only|--with-instagram]');
}

main();
