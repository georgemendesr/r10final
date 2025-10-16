const Database = require('better-sqlite3');
const fs = require('fs');

console.log('=== CORREÇÃO TOTAL - MATCHING MELHORADO ===\n');

// Ler dump MySQL
const dumpContent = fs.readFileSync('backup/r10.db', 'utf8');

// Parsear TODAS as notícias do MySQL com ID, título e imagem
console.log('Parseando dump MySQL...\n');
const mysqlNoticias = [];
const lines = dumpContent.split('\n');

for (const line of lines) {
  if (line.trim().startsWith('(') && line.includes('/uploads/imagens/')) {
    // Regex mais robusta para extrair dados
    const match = line.match(/\((\d+),.*?'([^']{15,}?)',.*?'(\/uploads\/imagens\/[^']+)'/);
    if (match) {
      mysqlNoticias.push({
        mysqlId: parseInt(match[1]),
        titulo: match[2].trim(),
        imagem: match[3]
      });
    }
  }
}

console.log(`✓ ${mysqlNoticias.length} notícias parseadas do MySQL\n`);

// Abrir SQLite
const db = new Database('arquivo.db');
const sqliteNoticias = db.prepare('SELECT id, titulo, imagem FROM noticias').all();

console.log(`✓ ${sqliteNoticias.length} notícias no SQLite\n`);

// Função para normalizar título
function normalize(str) {
  return str.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèê]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/ç/g, 'c')
    .trim();
}

console.log('Iniciando matching...\n');

db.exec('BEGIN TRANSACTION');

let matched = 0;
let updated = 0;
let notMatched = 0;

for (const sqlite of sqliteNoticias) {
  const sqliteNorm = normalize(sqlite.titulo);
  
  // Tentar match exato primeiro
  let mysql = mysqlNoticias.find(m => normalize(m.titulo) === sqliteNorm);
  
  // Se não encontrou, tentar match parcial (primeiras 50 letras)
  if (!mysql) {
    const sqliteShort = sqliteNorm.substring(0, 50);
    mysql = mysqlNoticias.find(m => normalize(m.titulo).substring(0, 50) === sqliteShort);
  }
  
  if (mysql) {
    matched++;
    
    // Extrair nome do arquivo
    const mysqlImg = mysql.imagem.split('/').pop();
    const sqliteImg = (sqlite.imagem || '').split('/').pop().split('?')[0];
    
    if (mysqlImg !== sqliteImg) {
      // Construir URL R2 correta
      const r2Url = `https://pub-9dd576330b004101943425aed2436078.r2.dev/arquivo/uploads/imagens/${mysqlImg}`;
      
      db.prepare('UPDATE noticias SET imagem = ? WHERE id = ?').run(r2Url, sqlite.id);
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Atualizadas: ${updated}`);
      }
    }
  } else {
    notMatched++;
    if (notMatched <= 10) {
      console.log(`⚠️  Não encontrado: "${sqlite.titulo.substring(0, 60)}..."`);
    }
  }
}

db.exec('COMMIT');
db.exec('PRAGMA synchronous=FULL');
db.exec('VACUUM');
db.close();

console.log(`\n=== RESUMO FINAL ===`);
console.log(`Total SQLite: ${sqliteNoticias.length}`);
console.log(`Matched com MySQL: ${matched}`);
console.log(`Atualizados: ${updated}`);
console.log(`Não encontrados: ${notMatched}`);
