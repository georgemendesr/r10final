const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/noticias.db');

db.get('SELECT conteudo FROM noticias WHERE id = 21', (err, row) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  
  console.log('=== CONTEÚDO DA MATÉRIA 21 ===');
  console.log(row.conteudo);
  
  // Verificar destaques
  const highlights = row.conteudo.match(/highlight-animated[^>]*>/g);
  console.log('\n=== DESTAQUES ENCONTRADOS ===');
  console.log('Quantidade de spans com highlight-animated:', highlights ? highlights.length : 0);
  
  if (highlights) {
    highlights.forEach((h, i) => {
      console.log(`Destaque ${i + 1}: ${h}`);
    });
  }
  
  // Verificar texto dentro dos destaques
  const highlightContent = row.conteudo.match(/<span[^>]*highlight-animated[^>]*>([^<]*)</g);
  console.log('\n=== CONTEÚDO DOS DESTAQUES ===');
  if (highlightContent) {
    highlightContent.forEach((content, i) => {
      console.log(`Conteúdo ${i + 1}: ${content}`);
    });
  }
  
  db.close();
});