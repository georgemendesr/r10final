const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Corrigindo dados da matéria ID 21...');

const db = new sqlite3.Database('c:/Users/George Mendes/Desktop/r10final/server/noticias.db');

// Atualizar a matéria com os dados corretos
const updateQuery = `
UPDATE noticias SET 
  imagemUrl = ?, 
  imagem_destaque = ?,
  published_at = datetime('now'),
  updated_at = datetime('now')
WHERE id = 21
`;

// Usar uma imagem de placeholder ou uma imagem existente
const imagemUrl = '/uploads/imagens/selo11anos.png'; // Usando o selo como placeholder
const imagemDestaque = '/uploads/imagens/selo11anos.png';

db.run(updateQuery, [imagemUrl, imagemDestaque], function(err) {
  if (err) {
    console.error('❌ Erro ao atualizar:', err);
  } else {
    console.log('✅ Matéria atualizada com sucesso!');
    console.log('🖼️ Nova ImagemUrl:', imagemUrl);
    console.log('🎯 Nova ImagemDestaque:', imagemDestaque);
    console.log('📅 Data atualizada para agora');
    
    // Verificar se a atualização foi bem-sucedida
    db.get('SELECT imagemUrl, imagem_destaque, published_at, updated_at FROM noticias WHERE id = 21', (err, row) => {
      if (err) {
        console.error('❌ Erro ao verificar:', err);
      } else {
        console.log('🔍 Verificação pós-atualização:');
        console.log('ImagemUrl:', row.imagemUrl);
        console.log('Imagem_destaque:', row.imagem_destaque);
        console.log('Published_at:', row.published_at);
        console.log('Updated_at:', row.updated_at);
      }
      db.close();
    });
  }
});
