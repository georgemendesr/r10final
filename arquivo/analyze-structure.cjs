const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arquivo.db');

console.log('='.repeat(80));
console.log('📊 ANÁLISE DA ESTRUTURA DO BANCO arquivo.db');
console.log('='.repeat(80));
console.log();

// 1. Estrutura da tabela
db.all('PRAGMA table_info(noticias)', (err, cols) => {
  if (err) {
    console.error('Erro ao ler estrutura:', err);
    db.close();
    return;
  }
  
  console.log('📋 ESTRUTURA DA TABELA "noticias":');
  console.log();
  cols.forEach(c => {
    const line = `${String(c.cid).padStart(2)}. ${c.name.padEnd(20)} ${c.type.padEnd(15)}`;
    const extra = [];
    if (c.notnull) extra.push('NOT NULL');
    if (c.dflt_value) extra.push(`DEFAULT ${c.dflt_value}`);
    if (c.pk) extra.push('PRIMARY KEY');
    console.log(`${line} ${extra.join(' ')}`);
  });
  
  console.log();
  console.log('='.repeat(80));
  console.log();
  
  // 2. Amostra de dados
  db.all('SELECT * FROM noticias LIMIT 3', (err, rows) => {
    if (err) {
      console.error('Erro ao ler dados:', err);
      db.close();
      return;
    }
    
    console.log('📰 AMOSTRA DE DADOS (3 registros):');
    console.log();
    
    rows.forEach((row, idx) => {
      console.log(`--- REGISTRO ${idx + 1} (ID: ${row.id}) ---`);
      Object.keys(row).forEach(key => {
        if (key === 'conteudo' && row[key] && row[key].length > 100) {
          console.log(`${key}: ${row[key].substring(0, 100)}...`);
        } else {
          console.log(`${key}: ${row[key]}`);
        }
      });
      console.log();
    });
    
    console.log('='.repeat(80));
    console.log();
    
    // 3. Estatísticas
    db.get('SELECT COUNT(*) as total FROM noticias', (err, row) => {
      console.log('📊 ESTATÍSTICAS:');
      console.log();
      console.log(`Total de notícias: ${row.total}`);
      
      db.get('SELECT COUNT(*) as com_imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', (err, row2) => {
        console.log(`Com imagem: ${row2.com_imagem}`);
        console.log(`Sem imagem: ${row.total - row2.com_imagem}`);
        
        db.all('SELECT categoria, COUNT(*) as total FROM noticias GROUP BY categoria ORDER BY total DESC LIMIT 10', (err, cats) => {
          console.log();
          console.log('Top 10 categorias:');
          cats.forEach(c => {
            console.log(`  - ${c.categoria}: ${c.total}`);
          });
          
          db.close();
          console.log();
          console.log('='.repeat(80));
        });
      });
    });
  });
});
