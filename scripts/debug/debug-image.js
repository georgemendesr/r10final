const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando dados originais da matéria ID 21...');

db.get('SELECT * FROM noticias WHERE id = 21', (err, row) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    return;
  }
  
  if (row) {
    console.log('\n📊 DADOS COMPLETOS DA MATÉRIA:');
    console.log('ID:', row.id);
    console.log('Título:', row.titulo);
    console.log('Imagem (campo imagem):', row.imagem);
    console.log('ImagemUrl (campo imagemUrl):', row.imagemUrl);
    console.log('Imagem Destaque:', row.imagem_destaque);
    console.log('Data criação:', row.created_at);
    console.log('Posição:', row.posicao);
    
    console.log('\n🔍 ANÁLISE:');
    if (!row.imagemUrl || row.imagemUrl === 'null' || row.imagemUrl === '/placeholder.svg') {
      console.log('❌ PROBLEMA: ImagemUrl está vazia, null ou é placeholder');
    } else {
      console.log('✅ ImagemUrl existe:', row.imagemUrl);
    }
    
    if (!row.imagem_destaque || row.imagem_destaque === 'null' || row.imagem_destaque === '/placeholder.svg') {
      console.log('❌ PROBLEMA: Imagem Destaque está vazia, null ou é placeholder');
    } else {
      console.log('✅ Imagem Destaque existe:', row.imagem_destaque);
    }
  } else {
    console.log('❌ Matéria não encontrada');
  }
  
  db.close();
});
