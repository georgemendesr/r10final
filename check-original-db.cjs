const Database = require('better-sqlite3');

const db = new Database('arquivo/backup/r10.db', { readonly: true });

console.log('=== VERIFICANDO BANCO ORIGINAL (commit efb9d74) ===\n');

// Notícia 75923 - Prefeita
const noticia = db.prepare('SELECT id, titulo, imagem, imagem_cloudinary FROM noticias WHERE id = 75923').get();

console.log('Notícia:', noticia.id);
console.log('Título:', noticia.titulo);
console.log('Campo imagem:', noticia.imagem);
console.log('Campo imagem_cloudinary:', noticia.imagem_cloudinary);

// Verificar mais algumas aleatórias
console.log('\n=== 5 NOTÍCIAS ALEATÓRIAS ===\n');
const random = db.prepare('SELECT id, titulo, imagem FROM noticias ORDER BY RANDOM() LIMIT 5').all();

random.forEach(n => {
  console.log(`ID: ${n.id}`);
  console.log(`Título: ${n.titulo}`);
  console.log(`Imagem: ${n.imagem}`);
  console.log('---');
});

db.close();
