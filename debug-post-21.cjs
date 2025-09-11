const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 Investigando o Post 21...\n');

db.get('SELECT * FROM noticias WHERE id = ?', [21], (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  if (!row) {
    console.log('❌ Post 21 não encontrado');
    return;
  }
  
  console.log('📄 Dados completos do Post 21:');
  console.log('ID:', row.id);
  console.log('Título:', row.titulo);
  console.log('Posição:', row.posicao);
  console.log('Categoria:', row.categoria);
  console.log('Resumo atual:', row.resumo);
  console.log('Tamanho do resumo:', row.resumo ? row.resumo.length : 0);
  console.log('Data criação:', row.data_publicacao || row.dataPublicacao || row.created_at);
  console.log('Data atualização:', row.updated_at || row.data_atualizacao);
  
  console.log('\n🔍 Todos os campos do Post 21:');
  Object.keys(row).forEach(key => {
    console.log(`  ${key}: ${row[key]}`);
  });
  
  // Verificar se há outros posts com o mesmo título (possível duplicata)
  db.all('SELECT id, titulo, resumo FROM noticias WHERE titulo LIKE ?', [`%${row.titulo.substring(0, 20)}%`], (err2, similares) => {
    if (!err2) {
      console.log('\n📋 Posts com títulos similares:');
      similares.forEach(s => {
        console.log(`  ID ${s.id}: ${s.titulo} (resumo: ${s.resumo ? s.resumo.substring(0, 30) + '...' : 'VAZIO'})`);
      });
    }
    
    db.close();
  });
});