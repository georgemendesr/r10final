const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🗄️ Conectado ao banco SQLite:', dbPath);

// Normalizador de posição (simplificado)
function normalizePos(value = '') {
  const v = String(value).toLowerCase().trim();
  const map = {
    'super': 'supermanchete',
    'super-manchete': 'supermanchete', 
    'supermanchete': 'supermanchete',
    'manchete': 'destaque',
    'manchete-principal': 'destaque',
    'destaques': 'destaque',
    'destaque': 'destaque',
    'geral': 'geral',
    'noticia': 'geral',
    'noticias': 'geral',
    'noticia-comum': 'geral',
    'comum': 'geral',
    '': 'geral'
  };
  return map[v] || v;
}

app.get('/api/posts', (req, res) => {
  const posicaoParam = req.query.posicao;
  const limit = parseInt(req.query.limit) || 50;
  
  console.log('🔍 Busca solicitada:', { posicao: posicaoParam, limit });
  
  let query = 'SELECT * FROM noticias';
  let params = [];
  
  if (posicaoParam) {
    const p = normalizePos(posicaoParam);
    console.log(`🎯 Posição normalizada: "${posicaoParam}" -> "${p}"`);
    
    if (p === 'geral') {
      query += ' WHERE (LOWER(COALESCE(posicao, "")) = ? OR posicao IS NULL OR TRIM(posicao) = "")';
      params.push('geral');
    } else {
      query += ' WHERE LOWER(posicao) = ?';
      params.push(p);
    }
  }
  
  query += ' ORDER BY id DESC LIMIT ?';
  params.push(limit);
  
  console.log('🔗 Query final:', query);
  console.log('📝 Parâmetros:', params);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('❌ Erro na consulta:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    console.log(`✅ Encontradas ${rows.length} notícias`);
    
    const items = rows.map(row => ({
      id: row.id,
      titulo: row.titulo,
      subtitulo: row.subtitulo,
      chapeu: row.chapeu,
      conteudo: row.conteudo,
      categoria: row.categoria,
      posicao: row.posicao,
      imagemUrl: row.imagemUrl || row.imagem,
      publishedAt: row.published_at || row.created_at,
      createdAt: row.created_at,
      autor: row.autor
    }));
    
    res.json(items);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📍 Health: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📰 Posts: http://127.0.0.1:${PORT}/api/posts`);
  console.log(`🎯 Destaques: http://127.0.0.1:${PORT}/api/posts?posicao=destaque`);
});
