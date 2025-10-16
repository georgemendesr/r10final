/**
 * ATUALIZAÇÃO FINAL: URL R2 Pública Correta
 * 
 * URL Pública: https://pub-9dd576330b004101943425aed2436078.r2.dev
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';

console.log('======================================================================');
console.log('🔄 ATUALIZAÇÃO: URL R2 Pública Correta');
console.log('======================================================================\n');
console.log('✅ URL Pública R2:', R2_PUBLIC_URL);
console.log();

const db = new sqlite3.Database(DB_PATH);

// Atualizar todas as URLs
db.run(
  `UPDATE noticias 
   SET imagem = REPLACE(
     REPLACE(imagem, 
       'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens', 
       ?
     ),
     '/uploads/', '/'
   )
   WHERE imagem LIKE '%r2.cloudflarestorage.com%'`,
  [R2_PUBLIC_URL],
  function (err) {
    if (err) {
      console.error('❌ Erro:', err.message);
      db.close();
      return;
    }

    console.log('✅ Atualizadas:', this.changes, 'notícias\n');

    // Verificar resultado
    db.all('SELECT id, titulo, imagem FROM noticias LIMIT 5', [], (err, rows) => {
      if (!err) {
        console.log('📸 Exemplos de URLs atualizadas:\n');
        rows.forEach(r => {
          console.log(`ID: ${r.id}`);
          console.log(`Título: ${r.titulo.substring(0, 50)}...`);
          console.log(`URL: ${r.imagem}`);
          console.log('---\n');
        });
      }

      console.log('🎉 Processo concluído!\n');
      console.log('🌐 Teste agora: https://r10piaui.onrender.com/arquivo\n');
      
      db.close();
    });
  }
);
