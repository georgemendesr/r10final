const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'arquivo', 'arquivo.db'));

db.all(`SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != '' LIMIT 15`, (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  rows.forEach(r => console.log(r.id + ' | ' + r.imagem));
  db.close();
});
