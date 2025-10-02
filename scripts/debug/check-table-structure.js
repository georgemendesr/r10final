const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Verificando estrutura da tabela noticias...');

const db = new sqlite3.Database('c:/Users/George Mendes/Desktop/r10final/server/noticias.db');

db.all('PRAGMA table_info(noticias)', (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log('📋 Colunas da tabela noticias:');
    rows.forEach(row => {
      console.log(`  ${row.name}: ${row.type} ${row.notnull ? '(NOT NULL)' : ''}`);
    });
  }
  db.close();
});
