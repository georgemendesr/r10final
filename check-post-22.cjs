const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

db.get('SELECT id, titulo, conteudo FROM noticias WHERE id = 22', (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
  
  if (!row) {
    console.log('❌ Matéria 22 não encontrada');
    process.exit(1);
  }
  
  console.log('📰 Matéria 22:', row.titulo);
  console.log('\n📝 Conteúdo HTML (primeiros 2000 chars):');
  console.log(row.conteudo.substring(0, 2000));
  
  // Verificar se tem blockquote
  const hasBlockquote = row.conteudo.includes('<blockquote');
  console.log('\n🔍 Tem blockquote?', hasBlockquote);
  
  // Verificar se tem highlight animado
  const hasHighlight = row.conteudo.includes('data-highlight="animated"');
  console.log('🔍 Tem highlight animado?', hasHighlight);
  
  db.close();
});
