const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 Verificando estrutura do banco...');

// Verificar tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Erro ao verificar tabelas:', err);
    return;
  }
  
  console.log('📄 Tabelas encontradas:');
  tables.forEach(table => {
    console.log('  -', table.name);
  });
  
  // Se há tabela noticias
  if (tables.some(t => t.name === 'noticias')) {
    console.log('\n📊 Verificando dados na tabela noticias...');
    
    db.all("SELECT DISTINCT categoria FROM noticias ORDER BY categoria", (err, categorias) => {
      if (err) {
        console.error('❌ Erro ao verificar categorias:', err);
      } else {
        console.log('📂 Categorias na tabela noticias:');
        categorias.forEach(cat => {
          console.log('  -', cat.categoria);
        });
      }
      
      // Contar posts por categoria
      db.all("SELECT categoria, COUNT(*) as count FROM noticias GROUP BY categoria ORDER BY count DESC", (err, counts) => {
        if (err) {
          console.error('❌ Erro ao contar posts:', err);
        } else {
          console.log('\n📊 Posts por categoria:');
          counts.forEach(c => {
            console.log(`  ${c.categoria}: ${c.count} posts`);
          });
        }
        
        db.close();
      });
    });
  } else {
    console.log('❌ Tabela noticias não encontrada');
    db.close();
  }
});
