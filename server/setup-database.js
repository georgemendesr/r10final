const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Caminho do banco no disco persistente do Render
const DATA_DIR = process.env.RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'r10piaui.db');

console.log('🔧 [SETUP] Configurando banco de dados...');
console.log('📁 [SETUP] Diretório:', DATA_DIR);
console.log('💾 [SETUP] Banco:', DB_PATH);

// Criar diretório se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('✅ [SETUP] Diretório de dados criado:', DATA_DIR);
} else {
  console.log('✅ [SETUP] Diretório de dados já existe:', DATA_DIR);
}

// Criar/abrir banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ [SETUP] Erro ao abrir banco:', err);
    process.exit(1);
  }
  console.log('✅ [SETUP] Conectado ao banco de dados');
});

// Criar tabela com TODAS as colunas necessárias
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    slug TEXT,
    imagem TEXT,
    imagem_destaque TEXT,
    imagem_url TEXT,
    autor TEXT DEFAULT 'Redação R10 Piauí',
    posicao TEXT DEFAULT 'geral',
    categoria TEXT DEFAULT 'geral',
    chapeu TEXT,
    views INTEGER DEFAULT 0,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ativo'
  )
`;

db.serialize(() => {
  // Criar tabela
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ [SETUP] Erro ao criar tabela:', err);
    } else {
      console.log('✅ [SETUP] Tabela noticias verificada/criada');
    }
  });
  
  // Criar índices para performance
  db.run('CREATE INDEX IF NOT EXISTS idx_published_at ON noticias(published_at)', (err) => {
    if (!err) console.log('✅ [SETUP] Índice idx_published_at criado');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_posicao ON noticias(posicao)', (err) => {
    if (!err) console.log('✅ [SETUP] Índice idx_posicao criado');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_status ON noticias(status)', (err) => {
    if (!err) console.log('✅ [SETUP] Índice idx_status criado');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_categoria ON noticias(categoria)', (err) => {
    if (!err) console.log('✅ [SETUP] Índice idx_categoria criado');
  });
  
  // Verificar estrutura da tabela
  db.all("PRAGMA table_info(noticias)", (err, columns) => {
    if (!err) {
      console.log('📋 [SETUP] Colunas da tabela noticias:');
      columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
    }
  });
  
  // Contar registros
  db.get('SELECT COUNT(*) as total FROM noticias', (err, row) => {
    if (!err) {
      console.log(`📊 [SETUP] Total de posts no banco: ${row.total}`);
    }
    
    // Fechar conexão
    db.close((err) => {
      if (err) {
        console.error('❌ [SETUP] Erro ao fechar banco:', err);
      } else {
        console.log('✅ [SETUP] Setup concluído com sucesso!');
      }
    });
  });
});

module.exports = { DB_PATH, DATA_DIR };
