const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

// Primeiro vamos ver o que tem
db.get('SELECT conteudo FROM noticias WHERE id = 22', (err, row) => {
  if (err) {
    console.error('❌ Erro ao ler:', err);
    db.close();
    return;
  }
  
  console.log('📄 CONTEÚDO ANTES:\n');
  const match = row.conteudo.match(/blockquote.*?<\/div>/s);
  if (match) {
    console.log(match[0]);
  }
  
  // Fazer a correção: separar blockquote do texto seguinte
  const novoConteudo = row.conteudo.replace(
    '</blockquote>, afirmou Antonio Luiz, secretário Estadual de Saúde.</div>',
    '</blockquote></div><div style="text-align:justify">, afirmou Antonio Luiz, secretário Estadual de Saúde.</div>'
  );
  
  db.run('UPDATE noticias SET conteudo = ? WHERE id = 22', [novoConteudo], (err) => {
    if (err) {
      console.error('❌ Erro ao atualizar:', err);
    } else {
      console.log('\n✅ CONTEÚDO CORRIGIDO!\n');
      
      // Verificar
      db.get('SELECT conteudo FROM noticias WHERE id = 22', (err, row2) => {
        if (!err) {
          console.log('📄 CONTEÚDO DEPOIS:\n');
          const match2 = row2.conteudo.match(/blockquote.*?<\/div><div.*?<\/div>/s);
          if (match2) {
            console.log(match2[0]);
          }
        }
        db.close();
      });
    }
  });
});
