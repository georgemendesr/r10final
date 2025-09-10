const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Verificando dados da matéria ID 21...');

const db = new sqlite3.Database('c:/Users/George Mendes/Desktop/r10final/server/noticias.db');

db.get('SELECT * FROM noticias WHERE id = 21', (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  if (row) {
    console.log('✅ Matéria encontrada:');
    console.log('📰 Título:', row.titulo);
    console.log('📝 Subtítulo:', row.subtitulo);
    console.log('🖼️ ImagemUrl:', row.imagemUrl);
    console.log('🎯 ImagemDestaque:', row.imagemDestaque);
    console.log('📍 Posição:', row.posicao);
    console.log('📅 Data:', row.data);
    console.log('📄 Conteúdo (200 chars):');
    console.log(row.conteudo?.substring(0, 200) + '...');
    
    // Verificar se há problemas com a imagem
    if (!row.imagemUrl || row.imagemUrl === '/placeholder.svg') {
      console.log('⚠️ PROBLEMA: Imagem não definida ou é placeholder');
    }
    
    if (!row.subtitulo) {
      console.log('⚠️ PROBLEMA: Subtítulo não definido');
    }
  } else {
    console.log('❌ Matéria não encontrada');
  }
  
  db.close();
});
