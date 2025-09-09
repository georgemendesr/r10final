const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 VERIFICANDO BANCO DE DADOS');
console.log('============================');

// Verificar a tabela noticias diretamente
console.log('🔍 Estrutura da tabela noticias:');
db.all("PRAGMA table_info(noticias)", (err, columns) => {
  if (err) {
    console.error('❌ Erro ao verificar estrutura:', err);
    return;
  }
  
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  console.log('📊 Todas as notícias no banco:');
  db.all("SELECT id, titulo, categoria FROM noticias ORDER BY id", (err, rows) => {
    if (err) {
      console.error('❌ Erro ao consultar notícias:', err);
      return;
    }
    
    rows.forEach(row => {
      console.log(`ID ${row.id}: ${row.titulo?.substring(0, 50) || 'Sem título'}... [CATEGORIA: ${row.categoria}]`);
    });
    
    // Verificar resumo por categoria
    console.log('📈 Resumo por categoria:');
    db.all("SELECT categoria, COUNT(*) as total FROM noticias GROUP BY categoria", (err, categorias) => {
      if (err) {
        console.error('❌ Erro ao contar categorias:', err);
        return;
      }
      
      categorias.forEach(cat => {
        console.log(`${cat.categoria}: ${cat.total} posts`);
      });
      
      db.close();
    });
  });
});
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Erro ao listar tabelas:', err);
    return;
  }
  
  console.log('� Tabelas encontradas no banco:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Se há tabelas, vamos ver a estrutura da primeira
  if (tables.length > 0) {
    const tableName = tables[0].name;
    console.log(`\n🔍 Estrutura da tabela '${tableName}':`);
    
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
        return;
      }
      
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      // Agora verificar o conteúdo
      console.log(`\n📊 Conteúdo da tabela '${tableName}':`);
      db.all(`SELECT * FROM ${tableName} LIMIT 5`, (err, rows) => {
        if (err) {
          console.error('❌ Erro ao consultar dados:', err);
          return;
        }
        
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${JSON.stringify(row)}`);
        });
        
        db.close();
      });
    });
  } else {
    console.log('❌ Nenhuma tabela encontrada no banco!');
    db.close();
  }
});
