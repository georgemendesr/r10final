#!/usr/bin/env node
/**
 * Script: rotate-logs.cjs
 * Objetivo: Rotacionar e comprimir arquivos .log grandes para evitar crescimento infinito.
 * Estratégia:
 *  - Alvo: diretório raiz + diretório logs/ (se existir)
 *  - Seleciona *.log maiores que LIMIT_MB (default 5MB)
 *  - Move para logs/archive/ criando nome: <basename>-YYYYMMDD-HHmmss.log.gz
 *  - Mantém no máximo KEEP (default 10) por arquivo base (remove mais antigos)
 * Exclusões: já arquivados (*.gz) não são reprocessados.
 * Return codes: 0 sucesso, 1 erro.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LIMIT_MB = parseInt(process.env.LOG_ROTATE_LIMIT_MB || '5', 10); // 5MB
const KEEP = parseInt(process.env.LOG_ROTATE_KEEP || '10', 10);
const ROOT = process.cwd();

const targets = [ROOT];
if (fs.existsSync(path.join(ROOT, 'logs'))) targets.push(path.join(ROOT, 'logs'));

const archiveDir = path.join(ROOT, 'logs', 'archive');
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

function human(size) { return (size / (1024*1024)).toFixed(2) + 'MB'; }

function rotateFile(filePath) {
  return new Promise((resolve, reject) => {
    const base = path.basename(filePath, '.log');
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\..+/, '').replace('T','-');
    const dest = path.join(archiveDir, `${base}-${stamp}.log.gz`);
    const read = fs.createReadStream(filePath);
    const write = fs.createWriteStream(dest);
    const gzip = zlib.createGzip();
    read.pipe(gzip).pipe(write).on('finish', () => {
      fs.truncate(filePath, 0, (err) => {
        if (err) return reject(err);
        resolve(dest);
      });
    }).on('error', reject);
  });
}

async function pruneOldArchives() {
  const files = fs.readdirSync(archiveDir).filter(f => f.endsWith('.log.gz'));
  const byBase = {};
  files.forEach(f => {
    const base = f.split('-')[0]; // antes do timestamp
    byBase[base] = byBase[base] || [];
    byBase[base].push(f);
  });
  Object.values(byBase).forEach(list => list.sort()); // sort asc (velhos primeiro)
  const removals = [];
  for (const base in byBase) {
    const list = byBase[base];
    if (list.length > KEEP) {
      const extra = list.slice(0, list.length - KEEP);
      extra.forEach(f => removals.push(path.join(archiveDir, f)));
    }
  }
  removals.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
  return removals.length;
}

async function main() {
  const rotated = [];
  for (const dir of targets) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.log'));
    for (const f of files) {
      const fp = path.join(dir, f);
      try {
        const stat = fs.statSync(fp);
        if (stat.size >= LIMIT_MB * 1024 * 1024) {
          const dest = await rotateFile(fp);
          rotated.push({ file: fp, archived: dest, originalSize: stat.size });
        }
      } catch (e) {
        console.error('Erro lendo', fp, e.message);
      }
    }
  }
  const pruned = await pruneOldArchives();
  const result = { rotated: rotated.length, pruned, limitMB: LIMIT_MB, keep: KEEP, details: rotated, timestamp: new Date().toISOString() };
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => { console.error(JSON.stringify({ ok:false, error: err.message })); process.exit(1); });
