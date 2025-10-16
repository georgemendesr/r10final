const Database = require('better-sqlite3');
const db = new Database('arquivo.db', { readonly: true });

console.log('=== RESUMO DAS ATUALIZAÇÕES ===\n');

// Contar quantas imagens contêm R2 vs outras
const r2Count = db.prepare(`SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%r2.dev%'`).get();
const fgsCount = db.prepare(`SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%fgs-1759604780.png%'`).get();
const total = db.prepare(`SELECT COUNT(*) as total FROM noticias`).get();

console.log(`Total de notícias: ${total.total}`);
console.log(`Com URL R2: ${r2Count.total}`);
console.log(`Com arquivo fgs-1759604780.png: ${fgsCount.total}`);

console.log(`\n=== PROCURANDO NOTÍCIA DA KARYNE ===\n`);

// Buscar por várias palavras-chave
const keywords = ['Karyne', 'premiada', 'Saúde Digital', 'Rodrigão'];

for (const keyword of keywords) {
  const result = db.prepare(`
    SELECT id, titulo, imagem 
    FROM noticias 
    WHERE titulo LIKE ? OR corpo LIKE ?
    LIMIT 3
  `).all(`%${keyword}%`, `%${keyword}%`);
  
  if (result.length > 0) {
    console.log(`Palavra-chave "${keyword}" - ${result.length} resultados:`);
    result.forEach(r => {
      const filename = r.imagem ? r.imagem.split('/').pop() : 'sem imagem';
      console.log(`  ID ${r.id}: ${r.titulo.substring(0, 60)}...`);
      console.log(`    Arquivo: ${filename}`);
    });
    console.log();
  }
}

db.close();
