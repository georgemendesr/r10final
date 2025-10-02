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
  console.log('\n📝 HTML COMPLETO:\n');
  console.log(row.conteudo);
  
  // Encontrar blockquotes
  const blockquoteMatches = row.conteudo.match(/<blockquote[^>]*>.*?<\/blockquote>/gs);
  if (blockquoteMatches) {
    console.log('\n\n🔍 BLOCKQUOTES ENCONTRADOS:');
    blockquoteMatches.forEach((bq, i) => {
      console.log(`\n--- Blockquote ${i + 1} ---`);
      console.log(bq);
    });
  }
  
  db.close();
});
