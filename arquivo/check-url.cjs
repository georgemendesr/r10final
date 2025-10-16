const Database = require('better-sqlite3');
const db = new Database('arquivo.db', { readonly: true });

const noticia = db.prepare('SELECT imagem FROM noticias WHERE id = 67468').get();
console.log(noticia.imagem);

db.close();
