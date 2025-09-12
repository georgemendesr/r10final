const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'server', 'noticias.db');

console.log('🔍 Verificando blockquotes na matéria ID 21...');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
});

const query = `SELECT id, titulo, conteudo FROM noticias WHERE id = 21`;

db.get(query, (err, row) => {
  if (err) {
    console.error('❌ Erro na consulta:', err.message);
    db.close();
    return;
  }

  if (!row) {
    console.log('❌ Matéria ID 21 não encontrada');
    db.close();
    return;
  }

  console.log('✅ Matéria encontrada:');
  console.log('📰 ID:', row.id);
  console.log('📰 Título:', row.titulo);
  console.log('');
  
  // Buscar por blockquotes no conteúdo
  const content = row.conteudo;
  
  if (content.includes('<blockquote')) {
    console.log('🎯 BLOCKQUOTES ENCONTRADAS:');
    console.log('');
    
    // Extrair todas as blockquotes
    const blockquoteRegex = /<blockquote[^>]*>(.*?)<\/blockquote>/gs;
    const matches = [...content.matchAll(blockquoteRegex)];
    
    matches.forEach((match, index) => {
      console.log(`📌 Blockquote ${index + 1}:`);
      console.log('🏷️ Tag completa:', match[0]);
      console.log('📝 Conteúdo:', match[1]);
      console.log('');
    });
    
    console.log(`📊 Total de blockquotes encontradas: ${matches.length}`);
    
    // Verificar o contexto ao redor das blockquotes
    console.log('');
    console.log('🔍 CONTEXTO COMPLETO:');
    console.log(content);
    
  } else {
    console.log('❌ Nenhuma blockquote encontrada no conteúdo');
    console.log('');
    console.log('📄 Conteúdo completo:');
    console.log(content);
  }

  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar banco:', err.message);
    }
  });
});