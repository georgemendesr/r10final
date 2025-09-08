const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco SQLite
const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar SQLite:', err.message);
    console.error('❌ Path do banco:', dbPath);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco SQLite:', dbPath);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'sqlite', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Listar posts
app.get('/api/posts', (req, res) => {
  const { limit = 10 } = req.query;
  
  const query = 'SELECT * FROM noticias ORDER BY data DESC LIMIT ?';
  
  db.all(query, [parseInt(limit)], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar posts:', err.message);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    
    const posts = rows.map(row => ({
      id: row.id,
      titulo: row.titulo,
      subtitulo: row.subtitulo,
      conteudo: row.conteudo,
      data: row.data,
      editoria: row.editoria,
      posicao: row.posicao,
      imagem: row.imagem || 'https://via.placeholder.com/400x200'
    }));
    
    console.log(`📰 Retornando ${posts.length} posts`);
    res.json(posts);
  });
});

// Home endpoint
app.get('/api/home', (req, res) => {
  const query = 'SELECT * FROM noticias ORDER BY posicao ASC, data DESC LIMIT 20';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar dados home:', err.message);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
    
    const posts = rows.map(row => ({
      id: row.id,
      title: row.titulo,
      subtitle: row.subtitulo,
      content: row.conteudo,
      date: row.data,
      category: row.editoria,
      position: row.posicao,
      image: row.imagem || 'https://via.placeholder.com/400x200',
      slug: `post-${row.id}`
    }));
    
    console.log(`🏠 Retornando ${posts.length} posts para home`);
    res.json(posts);
  });
});

// Iniciar servidor
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API rodando em http://127.0.0.1:${PORT}`);
  console.log(`📍 Health: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📰 Posts: http://127.0.0.1:${PORT}/api/posts`);
  console.log(`🏠 Home: http://127.0.0.1:${PORT}/api/home`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Fechando servidor...');
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar banco:', err.message);
    } else {
      console.log('✅ Banco SQLite fechado');
    }
    process.exit(0);
  });
});
