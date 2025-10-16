const Database = require('better-sqlite3');
const db = new Database('arquivo.db', { readonly: true });

console.log('=== ANÁLISE COMPLETA DE IMAGENS ===\n');

const total = db.prepare('SELECT COUNT(*) as total FROM noticias').get();
const comImagem = db.prepare("SELECT COUNT(*) as total FROM noticias WHERE imagem IS NOT NULL AND imagem != ''").get();
const comR2 = db.prepare("SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%r2.dev%'").get();

console.log(`Total de notícias: ${total.total}`);
console.log(`Com imagem: ${comImagem.total}`);
console.log(`Com URL R2: ${comR2.total}`);
console.log(`Sem imagem: ${total.total - comImagem.total}`);

console.log('\n=== SAMPLE DE 10 NOTÍCIAS ALEATÓRIAS ===\n');

const sample = db.prepare(`
  SELECT id, titulo, imagem 
  FROM noticias 
  WHERE imagem IS NOT NULL AND imagem != ''
  ORDER BY RANDOM() 
  LIMIT 10
`).all();

sample.forEach((n, i) => {
  console.log(`${i+1}. ID ${n.id}: ${n.titulo.substring(0, 50)}...`);
  console.log(`   Imagem: ${n.imagem}`);
  console.log();
});

db.close();
