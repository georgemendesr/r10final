const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

console.log('📊 Verificando posições atuais...\n');

db.all(`
  SELECT posicao, COUNT(*) as count 
  FROM noticias 
  GROUP BY posicao 
  ORDER BY count DESC
`, (err, counts) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  console.log('📈 Contagem por posição:');
  counts.forEach(c => {
    console.log(`  ${c.posicao}: ${c.count} posts`);
  });
  
  console.log('\n📋 Posts em DESTAQUE:');
  db.all(`
    SELECT id, titulo, posicao 
    FROM noticias 
    WHERE posicao = 'destaque' 
    ORDER BY id DESC
  `, (err2, destaques) => {
    if (err2) {
      console.error('❌ Erro nos destaques:', err2);
    } else {
      destaques.forEach(d => {
        console.log(`  ID ${d.id}: ${d.titulo.substring(0, 50)}...`);
      });
      
      console.log(`\n🔍 Total destaques: ${destaques.length}/5`);
      
      if (destaques.length < 5) {
        console.log('\n⚠️ PROBLEMA: Menos de 5 destaques! Corrigindo...');
        
        // Buscar posts em 'geral' para promover
        db.all(`
          SELECT id, titulo 
          FROM noticias 
          WHERE posicao = 'geral' 
          ORDER BY id DESC 
          LIMIT ${5 - destaques.length}
        `, (err3, gerais) => {
          if (err3) {
            console.error('❌ Erro ao buscar gerais:', err3);
          } else {
            console.log(`\n🔄 Promovendo ${gerais.length} posts de GERAL para DESTAQUE:`);
            
            gerais.forEach(g => {
              console.log(`  Promovendo ID ${g.id}: ${g.titulo.substring(0, 40)}...`);
              db.run('UPDATE noticias SET posicao = ? WHERE id = ?', ['destaque', g.id], (updateErr) => {
                if (updateErr) {
                  console.error(`❌ Erro ao promover ${g.id}:`, updateErr);
                } else {
                  console.log(`✅ ID ${g.id} promovido para DESTAQUE`);
                }
              });
            });
          }
          
          db.close();
        });
      } else {
        db.close();
      }
    }
  });
});