const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

console.log('📝 Verificando posts com resumo...\n');

db.all(`
  SELECT id, titulo, LENGTH(resumo) as resumo_length, resumo
  FROM noticias 
  WHERE resumo IS NOT NULL AND resumo != '' 
  ORDER BY id DESC LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }
  
  if (rows.length === 0) {
    console.log('❌ Nenhum post tem resumo salvo');
  } else {
    console.log(`✅ Encontrados ${rows.length} posts com resumo:\n`);
    rows.forEach(row => {
      console.log(`📄 ID ${row.id}: ${row.titulo}`);
      console.log(`   📏 Tamanho: ${row.resumo_length} caracteres`);
      console.log(`   📝 Resumo: ${row.resumo.substring(0, 200)}${row.resumo.length > 200 ? '...' : ''}`);
      console.log('   ' + '-'.repeat(50));
    });
  }
  
  db.close();
});