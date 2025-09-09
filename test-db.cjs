const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
console.log('🔍 Testando conexão com banco:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    return;
  }
  console.log('✅ Conectado ao banco');
  
  // Testar query simples
  db.all('SELECT COUNT(*) as total FROM noticias', (err, rows) => {
    if (err) {
      console.error('❌ Erro na query:', err);
    } else {
      console.log('📊 Total de notícias:', rows[0].total);
      
      // Testar query com posição
      db.all('SELECT COUNT(*) as total FROM noticias WHERE posicao = ?', ['destaque'], (err, rows) => {
        if (err) {
          console.error('❌ Erro na query de destaque:', err);
        } else {
          console.log('🎯 Total de destaques:', rows[0].total);
          
          // Mostrar todas as posições
          db.all('SELECT posicao, COUNT(*) as total FROM noticias GROUP BY posicao', (err, rows) => {
            if (err) {
              console.error('❌ Erro na query de posições:', err);
            } else {
              console.log('📋 Posições encontradas:');
              rows.forEach(row => {
                console.log(`  - ${row.posicao || '(vazio)'}: ${row.total}`);
              });
            }
            db.close();
          });
        }
      });
    }
  });
});
