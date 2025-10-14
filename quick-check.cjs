const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'arquivo', 'arquivo.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
});

db.get(`SELECT COUNT(*) as total FROM noticias WHERE imagem_cloudinary IS NOT NULL`, (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log(`✅ ${row.total} notícias com URLs do Cloudinary`);
  }
  
  db.all(`SELECT id, titulo, imagem_cloudinary FROM noticias WHERE imagem_cloudinary IS NOT NULL LIMIT 3`, (err, rows) => {
    if (err) {
      console.error('❌ Erro:', err);
    } else {
      console.log('\nExemplos:');
      rows.forEach(r => {
        console.log(`- ID ${r.id}: ${r.imagem_cloudinary}`);
      });
    }
    db.close();
  });
});
