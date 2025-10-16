const Database = require('better-sqlite3');
const db = new Database('arquivo.db');

console.log('=== CORRIGINDO DOMÍNIO R2 ===\n');

const total = db.prepare("SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE '%pub-XXXXX%'").get();

console.log(`Total com pub-XXXXX: ${total.total}\n`);

if (total.total > 0) {
  console.log('Atualizando...\n');
  
  db.exec('BEGIN TRANSACTION');
  
  const result = db.prepare(`
    UPDATE noticias 
    SET imagem = REPLACE(imagem, 'pub-XXXXX', 'pub-9dd576330b004101943425aed2436078')
    WHERE imagem LIKE '%pub-XXXXX%'
  `).run();
  
  db.exec('COMMIT');
  db.exec('PRAGMA synchronous=FULL');
  db.exec('VACUUM');
  
  console.log(`✓ ${result.changes} registros atualizados!`);
} else {
  console.log('✓ Nenhum registro com pub-XXXXX encontrado!');
}

db.close();

console.log('\n✅ CONCLUÍDO!');
