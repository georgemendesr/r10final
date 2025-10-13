const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arquivo.db');

db.get(`SELECT imagem FROM noticias WHERE imagem LIKE '%cloudinary%' LIMIT 1`, [], (err, row) => {
  if (err) {
    console.error('Erro:', err.message);
  } else if (row) {
    console.log('✅ URLs do Cloudinary encontradas no banco!');
    console.log('Exemplo:', row.imagem);
  } else {
    console.log('❌ Nenhuma URL do Cloudinary encontrada');
  }
  db.close();
});
