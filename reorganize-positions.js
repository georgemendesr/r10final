const sqlite3 = require('sqlite3').verbose();

console.log('🔄 Forçando reorganização das posições...');

const db = new sqlite3.Database('c:/Users/George Mendes/Desktop/r10final/server/noticias.db');

// Primeiro, vamos ver o estado atual
db.all('SELECT id, titulo, posicao, published_at FROM noticias WHERE posicao IN ("supermanchete", "destaque") ORDER BY published_at DESC', (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
    db.close();
    return;
  }
  
  console.log('📊 Estado atual das posições:');
  rows.forEach(row => {
    console.log(`  ID ${row.id}: ${row.titulo.substring(0, 50)}... - ${row.posicao}`);
  });
  
  // Verificar se há alguma supermanchete além da ID 21
  const superManchetes = rows.filter(r => r.posicao === 'supermanchete' && r.id !== 21);
  
  if (superManchetes.length > 0) {
    console.log('\n🔄 Movendo supermanchetes anteriores para destaque...');
    
    const updates = superManchetes.map(sm => {
      return new Promise((resolve, reject) => {
        db.run('UPDATE noticias SET posicao = ? WHERE id = ?', ['destaque', sm.id], (err) => {
          if (err) {
            console.error(`❌ Erro ao mover ID ${sm.id}:`, err);
            reject(err);
          } else {
            console.log(`✅ ID ${sm.id} movido para DESTAQUE`);
            resolve();
          }
        });
      });
    });
    
    Promise.all(updates).then(() => {
      console.log('\n✅ Reorganização concluída!');
      
      // Verificar resultado final
      db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao IN ("supermanchete", "destaque") ORDER BY published_at DESC', (err, finalRows) => {
        if (!err) {
          console.log('\n📊 Estado final:');
          finalRows.forEach(row => {
            console.log(`  ID ${row.id}: ${row.titulo.substring(0, 50)}... - ${row.posicao}`);
          });
        }
        db.close();
      });
    }).catch(err => {
      console.error('❌ Erro na reorganização:', err);
      db.close();
    });
  } else {
    console.log('\n✅ Apenas uma supermanchete (ID 21), nenhuma reorganização necessária');
    db.close();
  }
});
