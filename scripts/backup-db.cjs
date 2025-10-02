#!/usr/bin/env node
/**
 * Backup simples do banco SQLite.
 * - Cria diretório backups/ se não existir
 * - Nome do arquivo: noticias-YYYYMMDD-HHmmss.db (ou custom prefix)
 * - Mantém somente N backups (DEFAULT 30) apagando os mais antigos
 * - Pode comprimir .gz se BACKUP_COMPRESS=1
 * Uso: node scripts/backup-db.cjs [--keep=45] [--prefix=noticias] [--db=server/noticias.db]
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function parseArgs(){
  const out = {}; process.argv.slice(2).forEach(a=>{
    const m = a.match(/^--([^=]+)=(.+)$/); if (m) out[m[1]] = m[2];
  }); return out;
}
const args = parseArgs();
const DB_PATH = args.db || process.env.SQLITE_DB_PATH || path.join(__dirname,'..','server','noticias.db');
const KEEP = parseInt(args.keep || process.env.BACKUP_KEEP || '30',10);
const PREFIX = args.prefix || process.env.BACKUP_PREFIX || 'noticias';
const DEST_DIR = process.env.BACKUP_DIR || path.join(process.cwd(),'backups');
const COMPRESS = (process.env.BACKUP_COMPRESS === '1') || args.compress === '1';

if (!fs.existsSync(DB_PATH)) {
  console.error('[backup] banco não encontrado:', DB_PATH); process.exit(1);
}
fs.mkdirSync(DEST_DIR,{recursive:true});
const ts = new Date();
const stamp = ts.toISOString().replace(/[-:]/g,'').replace(/\..+/,''); // YYYYMMDDTHHmmss
const baseName = `${PREFIX}-${stamp}.db`;
const destFile = path.join(DEST_DIR, baseName + (COMPRESS?'.gz':''));

console.log('[backup] origem:', DB_PATH);
console.log('[backup] destino:', destFile);

try {
  if (COMPRESS) {
    const gz = zlib.createGzip({ level: 9 });
    fs.createReadStream(DB_PATH).pipe(gz).pipe(fs.createWriteStream(destFile)).on('finish', ()=>{
      console.log('[backup] concluído (comprimido)');
      rotate();
    });
  } else {
    fs.copyFileSync(DB_PATH, destFile);
    console.log('[backup] concluído');
    rotate();
  }
} catch(e){
  console.error('[backup] falha:', e.message); process.exit(2);
}

function rotate(){
  try {
    const files = fs.readdirSync(DEST_DIR)
      .filter(f=> f.startsWith(PREFIX+'-') && (f.endsWith('.db') || f.endsWith('.db.gz')) )
      .map(f=>({ f, full: path.join(DEST_DIR,f), m: fs.statSync(path.join(DEST_DIR,f)).mtimeMs }))
      .sort((a,b)=> b.m - a.m);
    if (files.length > KEEP) {
      const drop = files.slice(KEEP);
      drop.forEach(d=> { try { fs.unlinkSync(d.full); console.log('[backup] removido antigo', d.f); } catch(_){} });
    }
  } catch(e){ console.warn('[backup] rotate falhou:', e.message); }
}
