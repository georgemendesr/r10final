const Database = require('better-sqlite3');
const db = new Database('arquivo.db', { readonly: true });

const total = db.prepare("SELECT COUNT(*) as total FROM noticias WHERE imagem IS NOT NULL AND imagem != ''").get();

console.log(`Total de imagens: ${total.total}`);

db.close();
