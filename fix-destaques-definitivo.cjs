const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔧 CORREÇÃO DEFINITIVA DOS DESTAQUES...\n');

// Garantir que sempre temos 5 destaques
db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao = "destaque" ORDER BY id DESC', (err, destaques) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  console.log(`📊 Destaques atuais: ${destaques.length}/5`);
  
  if (destaques.length < 5) {
    const needed = 5 - destaques.length;
    console.log(`🔄 Promovendo ${needed} posts de GERAL para DESTAQUE...`);
    
    db.all('SELECT id, titulo FROM noticias WHERE posicao = "geral" ORDER BY id DESC LIMIT ?', [needed], (err2, gerais) => {
      if (err2) {
        console.error('❌ Erro ao buscar gerais:', err2);
        return;
      }
      
      if (gerais.length === 0) {
        console.log('⚠️ Não há posts em GERAL para promover');
        db.close();
        return;
      }
      
      gerais.forEach((g, index) => {
        db.run('UPDATE noticias SET posicao = ? WHERE id = ?', ['destaque', g.id], (updateErr) => {
          if (updateErr) {
            console.error(`❌ Erro ao promover ID ${g.id}:`, updateErr);
          } else {
            console.log(`✅ ID ${g.id} promovido para DESTAQUE: ${g.titulo.substring(0, 50)}...`);
          }
          
          // Se foi o último update, fechar o banco
          if (index === gerais.length - 1) {
            console.log('\n🎉 DESTAQUES CORRIGIDOS! Agora sempre terá 5 notícias.');
            db.close();
          }
        });
      });
    });
  } else if (destaques.length > 5) {
    const excess = destaques.length - 5;
    console.log(`⬇️ Rebaixando ${excess} destaques mais antigos para GERAL...`);
    
    const toDowngrade = destaques.slice(-excess); // Pegar os mais antigos
    toDowngrade.forEach((d, index) => {
      db.run('UPDATE noticias SET posicao = ? WHERE id = ?', ['geral', d.id], (updateErr) => {
        if (updateErr) {
          console.error(`❌ Erro ao rebaixar ID ${d.id}:`, updateErr);
        } else {
          console.log(`⬇️ ID ${d.id} rebaixado para GERAL: ${d.titulo.substring(0, 50)}...`);
        }
        
        if (index === toDowngrade.length - 1) {
          console.log('\n🎉 DESTAQUES CORRIGIDOS! Agora tem exatamente 5 notícias.');
          db.close();
        }
      });
    });
  } else {
    console.log('✅ Destaques já estão corretos (5 notícias)');
    db.close();
  }
});