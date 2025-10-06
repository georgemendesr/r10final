const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'noticias.db');
const db = new sqlite3.Database(dbPath);

// URL de imagem válida sobre educação/universidade
const newImageUrl = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop';

console.log('🔧 Corrigindo imagem do post 4...');

db.run(`UPDATE noticias SET imagemUrl = ?, imagem = ?, imagem_url = ? WHERE id = 4`, 
  [newImageUrl, newImageUrl, newImageUrl], 
  function(err) {
    if (err) {
      console.error('❌ Erro:', err);
      process.exit(1);
    }
    
    console.log(`✅ Post 4 atualizado com nova imagem!`);
    console.log(`📸 Nova URL: ${newImageUrl}`);
    console.log(`📊 Linhas afetadas: ${this.changes}`);
    
    // Verificar
    db.get('SELECT id, titulo, imagemUrl FROM noticias WHERE id = 4', (err, row) => {
      if (err) {
        console.error('❌ Erro na verificação:', err);
      } else {
        console.log('\n✅ Verificação:');
        console.log(row);
      }
      db.close();
    });
  }
);
