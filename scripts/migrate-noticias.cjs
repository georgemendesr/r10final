#!/usr/bin/env node
/**
 * Migração idempotente para tabela 'noticias'.
 * - Garante colunas timestamps (created_at, updated_at, published_at)
 * - Garante coluna views, status
 * - Cria índice em (posicao, published_at DESC) se possível
 * - Preenche valores faltantes
 */

const path = require('path');
const fs = require('fs');
let sqlite3; try { sqlite3 = require('sqlite3').verbose(); } catch(e){ console.error('sqlite3 não instalado:', e.message); process.exit(1); }

// Determinar caminho do DB similar ao servidor
const DATA_DIR = process.env.RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'data');
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'r10piaui.db');

if (!fs.existsSync(DB_PATH)) {
  console.error('Banco não encontrado em', DB_PATH);
  process.exit(2);
}

console.log('🔧 Iniciando migração em', DB_PATH);
const db = new sqlite3.Database(DB_PATH);

function run(sql){
  return new Promise(res=>{
    db.run(sql, err=>{
      if (err) {
        if (/duplicate column|already exists/i.test(err.message)) {
          console.log('➡️  Já existe:', sql.split('\n')[0]);
        } else {
          console.log('⚠️  Erro:', err.message, 'SQL=', sql);
        }
      } else {
        console.log('✅ OK:', sql.split('\n')[0]);
      }
      res();
    });
  });
}

function all(sql){
  return new Promise(res=>{ db.all(sql, (e,r)=>res(r||[])); });
}

(async () => {
  const cols = await all('PRAGMA table_info(noticias)');
  const existing = new Set(cols.map(c=>c.name));
  const steps = [];

  if (!existing.has('published_at')) steps.push("ALTER TABLE noticias ADD COLUMN published_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  if (!existing.has('created_at'))   steps.push("ALTER TABLE noticias ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  if (!existing.has('updated_at'))   steps.push("ALTER TABLE noticias ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  if (!existing.has('views'))        steps.push("ALTER TABLE noticias ADD COLUMN views INTEGER DEFAULT 0");
  if (!existing.has('status'))       steps.push("ALTER TABLE noticias ADD COLUMN status VARCHAR(20) DEFAULT 'ativo'");

  for (const s of steps) await run(s);

  // Preencher lacunas de timestamps
  await run(`UPDATE noticias SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)`);
  await run(`UPDATE noticias SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)`);
  await run(`UPDATE noticias SET published_at = COALESCE(published_at, created_at, CURRENT_TIMESTAMP)`);
  await run(`UPDATE noticias SET views = COALESCE(views,0)`);
  await run(`UPDATE noticias SET status = COALESCE(status,'ativo')`);

  // Índice composto (ignorar erro se já existir)
  await run(`CREATE INDEX IF NOT EXISTS idx_noticias_posicao_published ON noticias(posicao, published_at)`);

  console.log('🎉 Migração concluída.');
  db.close();
})();
