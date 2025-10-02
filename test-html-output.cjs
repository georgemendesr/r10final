const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

db.get('SELECT conteudo FROM noticias WHERE id = 22', (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  console.log('📄 HTML BRUTO DO BANCO:\n');
  console.log(row.conteudo);
  console.log('\n\n');
  
  // Dividir em parágrafos como o ArticlePage faz
  const tempDiv = { innerHTML: row.conteudo };
  const paragraphs = row.conteudo.split(/<\/div>|<br\s*\/?>/i).filter(p => p.trim());
  
  console.log('📊 TOTAL DE PARÁGRAFOS:', paragraphs.length);
  console.log('\n');
  
  paragraphs.forEach((p, i) => {
    if (p.includes('blockquote')) {
      console.log(`\n🔍 PARÁGRAFO ${i} (com blockquote):`);
      console.log(p);
      console.log('\n');
    }
  });
  
  db.close();
});
