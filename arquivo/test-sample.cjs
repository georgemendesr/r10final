const Database = require('better-sqlite3');
const fs = require('fs');

console.log('=== TESTE DE AMOSTRAGEM - 20 NOTÍCIAS ALEATÓRIAS ===\n');

// Ler dump MySQL
const dumpContent = fs.readFileSync('backup/r10.db', 'utf8');
const mysqlMap = new Map(); // titulo -> imagem

const lines = dumpContent.split('\n');
for (const line of lines) {
  if (line.includes('/uploads/imagens/')) {
    const match = line.match(/'([^']{20,})',\s+'[^']*',\s+'(\/uploads\/imagens\/[^']+)'/);
    if (match) {
      const titulo = match[1].toLowerCase().trim();
      const imagem = match[2].split('/').pop();
      mysqlMap.set(titulo, imagem);
    }
  }
}

console.log(`✓ ${mysqlMap.size} títulos mapeados do MySQL\n`);

// Pegar amostra do SQLite
const db = new Database('arquivo.db', { readonly: true });
const sample = db.prepare(`
  SELECT id, titulo, imagem 
  FROM noticias 
  WHERE imagem IS NOT NULL 
  ORDER BY RANDOM() 
  LIMIT 20
`).all();

let corretas = 0;
let erradas = 0;
let naoEncontradas = 0;

console.log('ANÁLISE:\n');

for (const noticia of sample) {
  const sqliteTitulo = noticia.titulo.toLowerCase().trim();
  const sqliteImg = noticia.imagem.split('/').pop().split('?')[0];
  
  const mysqlImg = mysqlMap.get(sqliteTitulo);
  
  if (mysqlImg) {
    if (mysqlImg === sqliteImg) {
      corretas++;
      console.log(`✓ CORRETO - ID ${noticia.id}`);
      console.log(`  "${noticia.titulo.substring(0, 60)}..."`);
    } else {
      erradas++;
      console.log(`✗ ERRADO - ID ${noticia.id}`);
      console.log(`  "${noticia.titulo.substring(0, 60)}..."`);
      console.log(`  SQLite: ${sqliteImg}`);
      console.log(`  MySQL:  ${mysqlImg}`);
    }
  } else {
    naoEncontradas++;
    console.log(`? NÃO ENCONTRADO NO MySQL - ID ${noticia.id}`);
    console.log(`  "${noticia.titulo.substring(0, 60)}..."`);
  }
  console.log();
}

console.log('=== RESULTADO DA AMOSTRA ===');
console.log(`Corretas: ${corretas}/20 (${(corretas/20*100).toFixed(1)}%)`);
console.log(`Erradas: ${erradas}/20 (${(erradas/20*100).toFixed(1)}%)`);
console.log(`Não encontradas: ${naoEncontradas}/20`);

db.close();
