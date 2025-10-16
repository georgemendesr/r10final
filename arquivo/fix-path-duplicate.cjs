const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');

console.log('🔧 Removendo duplicação /arquivo/ do caminho...\n');

const db = new sqlite3.Database(DB_PATH);

db.run(
  `UPDATE noticias 
   SET imagem = REPLACE(imagem, '/arquivo-r10-imagens/arquivo/uploads/', '/arquivo-r10-imagens/uploads/')
   WHERE imagem LIKE '%/arquivo-r10-imagens/arquivo/uploads/%'`,
  function (err) {
    if (err) {
      console.error('❌ Erro:', err.message);
    } else {
      console.log('✅ Corrigido:', this.changes, 'registros\n');
      
      // Mostrar exemplo
      db.get('SELECT imagem FROM noticias LIMIT 1', [], (err, row) => {
        if (!err) {
          console.log('📸 URL corrigida:');
          console.log(row.imagem);
        }
        db.close();
      });
    }
  }
);
