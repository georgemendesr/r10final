#!/usr/bin/env node
/**
 * Stable single-process launcher
 * - Faz build do frontend se dist ausente ou flag --build
 * - Sobe API servindo dist (SPA) na mesma porta 3002
 * - Health interno /api/health (já existe) e raiz / serve index
 */
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const FRONT = path.join(ROOT, 'r10-front_full_07ago');
const DIST = path.join(FRONT, 'dist');

const args = new Set(process.argv.slice(2));
const needBuild = args.has('--build') || !fs.existsSync(DIST) || !fs.existsSync(path.join(DIST,'index.html'));

function run(cmd, a, cwd) {
  console.log('> ', cmd, a.join(' '));
  const r = spawnSync(cmd, a, { cwd, stdio: 'inherit', shell: process.platform==='win32' });
  if (r.status !== 0) {
    console.error('Falhou comando', cmd, a.join(' '));
    process.exit(r.status || 1);
  }
}

if (needBuild) {
  console.log('🏗  Build frontend (dist ausente ou --build)');
  run(process.platform==='win32' ? 'npm.cmd':'npm', ['install','--no-audit','--no-fund'], FRONT);
  run(process.platform==='win32' ? 'npm.cmd':'npm', ['run','build'], FRONT);
} else {
  console.log('✅ dist existente – pulando build');
}

console.log('🚀 Iniciando API + frontend estático na porta 3002');
const child = spawn(process.execPath, ['server/server-api-simple.cjs'], {
  env: { ...process.env, SERVE_STATIC_FRONT: '1', PORT: process.env.PORT || '3002', NODE_ENV: 'production' },
  stdio: 'inherit'
});
child.on('exit', c => { console.log('Processo finalizado código', c); process.exit(c || 0); });
