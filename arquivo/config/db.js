const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados (isolado deste módulo)
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'arquivo.db');

// Criar conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco SQLite do arquivo de notícias');
  }
});

// Criar tabela se não existir (síncrono para garantir que existe antes de usar)
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    imagem TEXT,
    data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    autor TEXT,
    categoria TEXT,
    views INTEGER DEFAULT 0
  )
`;

// Executar criação da tabela de forma síncrona
db.serialize(() => {
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela:', err.message);
    } else {
      console.log('✅ Tabela "noticias" pronta');
    }
  });
});

module.exports = db;
