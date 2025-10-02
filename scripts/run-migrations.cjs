#!/usr/bin/env node
// Runner manual de migrations. Usa mesma lógica simplificada do auto-run (server-api-simple) mas permite execução stand-alone.
// Uso: node scripts/run-migrations.cjs [--dir=./migrations]

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const args = process.argv.slice(2);
function getArg(name, def) {
  const pref = `--${name}=`;
  const direct = args.find(a => a.startsWith(pref));
  if (direct) return direct.slice(pref.length);
  const flagIdx = args.indexOf(`--${name}`);
  if (flagIdx > -1) return true;
  return def;
}

const dbPath = process.env.SQLITE_DB_PATH || getArg('db', 'server/noticias.db');
const dir = getArg('dir', 'migrations');

if (!fs.existsSync(dir)) {
  console.error('[migrations] diretório não encontrado:', dir);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){
      if (err) reject(err); else resolve(this);
    });
  });
}
function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows){
      if (err) reject(err); else resolve(rows);
    });
  });
}

(async () => {
  await run(`CREATE TABLE IF NOT EXISTS migrations_applied (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL
  )`);
  const appliedRows = await all('SELECT name FROM migrations_applied');
  const applied = new Set(appliedRows.map(r=>r.name));
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort();
  if (!files.length) { console.log('[migrations] nenhuma migration encontrada'); process.exit(0); }
  for (const file of files) {
    if (applied.has(file)) { console.log('[skip]', file); continue; }
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full,'utf8');
    const statements = raw.split(/;\s*\n|;\r?\n/g).map(s=>s.trim()).filter(s=>s && !s.startsWith('--'));
    console.log('[apply]', file, `(${statements.length} statements)`);
    try {
      await run('BEGIN');
      for (const st of statements) {
        await run(st);
      }
      await run('INSERT INTO migrations_applied (name, applied_at) VALUES (?, ?)', [file, new Date().toISOString()]);
      await run('COMMIT');
      console.log('[ok]', file);
    } catch (e) {
      console.error('[erro]', file, e.message || e);
      await run('ROLLBACK').catch(()=>{});
      process.exit(1);
    }
  }
  db.close();
})();
