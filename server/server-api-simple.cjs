const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
// Carregar variáveis de ambiente de um arquivo .env na raiz (se existir)
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const PORT = 3002;

// Util: slugify seguro para PT-BR
function slugify(texto = '') {
  return String(texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Normalizador de posição (aceita variações e sinônimos)
function normalizePos(value = '') {
  const v = String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '-');
  const map = {
    'super':'supermanchete', 'super-manchete':'supermanchete', 'supermanchete':'supermanchete',
    'manchete':'destaque', 'manchete-principal':'destaque', 'destaques':'destaque', 'destaque':'destaque',
    'geral':'geral','noticia':'geral','noticias':'geral','noticia-comum':'geral','comum':'geral','':'geral',
    'municipios':'municipios','municipio':'municipios'
  };
  return map[v] || v;
}

// Normalizador de categoria (mantém apenas subcategorias públicas; divisões internas viram 'geral')
function normalizeCategoria(categoria = '') {
  const toKey = (s) => String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '');
  const INTERNAL = new Set(['editoriais','editorial','especiais','especial']);
  const ALLOWED = new Set([
    'policia','politica','esporte','entretenimento','geral',
    // Municípios permitidos
    'piripiri','pedro-ii','piracuruca','brasileira','lagoa-de-sao-francisco',
    'campo-maior','barras','esperantina','batalha','cocal','buriti-dos-lopes',
    'morro-do-chapeu','caxingo','sao-jose-do-divino'
  ]);
  const c = toKey(categoria);
  if (ALLOWED.has(c)) return c;
  if (INTERNAL.has(c)) return 'geral';
  return 'geral';
}

// Util: mapeia linha SQLite -> contrato do frontend
function mapPost(row) {
  const pos = normalizePos(row.posicao || row.position || '');
  const cat = normalizeCategoria(row.categoria || row.category);
  // Log opcional (habilite com LOG_MISSING_CHAPEU=1) quando o post não tem chapéu no DB
  try {
    if (process.env.LOG_MISSING_CHAPEU === '1') {
      const ch = row.chapeu == null ? '' : String(row.chapeu).trim();
      if (!ch) {
        console.warn(`[CHAPEU] Post sem chapéu: id=${row.id} titulo="${(row.titulo||row.title||'').toString().slice(0,80)}"`);
      }
    }
  } catch(_) {}
  return {
    id: row.id,
    title: row.titulo || row.title,
    titulo: row.titulo || row.title,
    subtitle: row.subtitulo || row.subtitle,
    subtitulo: row.subtitulo || row.subtitle,
    content: row.conteudo || row.content,
    conteudo: row.conteudo || row.content,
    // Considerar variações de colunas: imagem, imagemUrl, imagem_destaque
    imagemUrl: (row.imagem && String(row.imagem).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || '/placeholder.svg',
    imagemDestaque: (row.imagem && String(row.imagem).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || (row.imagemDestaque && String(row.imagemDestaque).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || '/placeholder.svg',
    categoria: cat,
    chapeu: row.chapeu || '',
    posicao: pos,
    autor: row.autor || row.author || 'R10 Piauí',
    createdAt: row.created_at || row.createdAt || row.data || null,
    publishedAt: row.published_at || row.publishedAt || row.data || null,
    views: row.views || 0,
    slug: row.slug || slugify(row.titulo || row.title || String(row.id))
  };
}

// Função para reorganizar hierarquia de posições
function reorganizePositionHierarchy(db, updatedPostId, newPosition, callback) {
  console.log(`🔄 [BACKEND] Reorganizando hierarquia: Post ${updatedPostId} -> ${newPosition}`);
  
  const normalizedNewPosition = normalizePos(String(newPosition));
  
  // Buscar todos os posts atuais (exceto o que está sendo atualizado)
  db.all('SELECT * FROM noticias WHERE id != ?', [updatedPostId], (err, allPosts) => {
    if (err) {
      console.error('Erro ao buscar posts para reorganização:', err);
      return callback(err);
    }
    
    // Filtrar por posições
    const superManchetes = allPosts.filter(post => normalizePos(post.posicao) === 'supermanchete');
    const destaques = allPosts.filter(post => normalizePos(post.posicao) === 'destaque');
    
    console.log(`📊 [BACKEND] Estado atual: ${superManchetes.length} super manchetes, ${destaques.length} destaques`);
    
    const updates = [];
    
    if (normalizedNewPosition === 'supermanchete') {
      // Se está inserindo uma nova SUPER MANCHETE
      
      // 1. Super manchete anterior vira DESTAQUE
      if (superManchetes.length > 0) {
        const currentSuperManchete = superManchetes[0];
        updates.push({ id: currentSuperManchete.id, posicao: 'destaque' });
        console.log(`📰 [BACKEND] Super manchete anterior (ID: ${currentSuperManchete.id}) vira DESTAQUE`);
      }
      
      // 2. Se já temos 5+ destaques, o mais antigo vira GERAL
      if (destaques.length >= 5) {
        // Ordenar destaques por data (mais antigo primeiro)
        const sortedDestaques = destaques.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.published_at || a.data || 0).getTime();
          const dateB = new Date(b.publishedAt || b.published_at || b.data || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestDestaque = sortedDestaques[0];
        updates.push({ id: oldestDestaque.id, posicao: 'geral' });
        console.log(`📄 [BACKEND] Destaque mais antigo (ID: ${oldestDestaque.id}) vira GERAL`);
      }
      
    } else if (normalizedNewPosition === 'destaque') {
      // Se está inserindo um novo DESTAQUE
      
      // Se já temos 5+ destaques, o mais antigo vira GERAL
      if (destaques.length >= 5) {
        const sortedDestaques = destaques.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.published_at || a.data || 0).getTime();
          const dateB = new Date(b.publishedAt || b.published_at || b.data || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestDestaque = sortedDestaques[0];
        updates.push({ id: oldestDestaque.id, posicao: 'geral' });
        console.log(`📄 [BACKEND] Destaque mais antigo (ID: ${oldestDestaque.id}) vira GERAL`);
      }
    }
    
    // Aplicar todas as atualizações
    if (updates.length === 0) {
      console.log(`✅ [BACKEND] Nenhuma reorganização necessária`);
      return callback(null);
    }
    
    console.log(`🔄 [BACKEND] Aplicando ${updates.length} atualizações de posição`);
    
    let completed = 0;
    let hasError = false;
    
    updates.forEach(update => {
      db.run('UPDATE noticias SET posicao = ? WHERE id = ?', [update.posicao, update.id], function(err) {
        if (err && !hasError) {
          hasError = true;
          console.error(`❌ [BACKEND] Erro ao atualizar posição do post ${update.id}:`, err);
          return callback(err);
        }
        
        completed++;
        console.log(`✅ [BACKEND] Post ${update.id} atualizado para posição: ${update.posicao}`);
        
        if (completed === updates.length && !hasError) {
          console.log(`🎉 [BACKEND] Hierarquia reorganizada com sucesso!`);
          callback(null);
        }
      });
    });
  });
}

// Factory para montar o app e conectar no SQLite no caminho informado
function createApp({ dbPath }) {
  const app = express();
  
  // CURTO-CIRCUITO: Health check no topo (diagnóstico)
  app.get('/api/health', (_req,res)=> res.type('text/plain').send('ok'));
  
  // Configuração CORS específica para o frontend
  const corsOptions = {
    origin: [
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5176', 
      'http://localhost:5177',
      'http://127.0.0.1:5177',
      'http://localhost:3000', // fallback para outros ambientes
      'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
  };
  
  app.use(cors(corsOptions));
  
  // Configurar limites de payload para suportar imagens base64
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  
  // LOGGER TEMPORÁRIO: Detectar middleware pendurado
  app.use((req,res,next)=>{
    const t = Date.now();
    console.log('[REQ]', req.method, req.url);
    res.on('finish', ()=> console.log('[RES]', req.method, req.url, res.statusCode, (Date.now()-t)+'ms'));
    next();
  });
  
  // ETag forte
  app.set('etag', 'strong');

  // Cache leve em memória para /api/home
  app.locals.homeCache = { body: null, expiresAt: 0, lastModified: null };
  function invalidateHomeCache() {
    app.locals.homeCache = { body: null, expiresAt: 0, lastModified: null };
  }

  // Gera ETag forte (hash do corpo, entre aspas, sem prefixo W/)
  function strongEtagFor(body) {
    try {
      const b = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      const hash = crypto.createHash('sha1').update(b).digest('hex');
      return '"' + hash + '"';
    } catch (_) {
      return undefined;
    }
  }

  const resolvedDbPath = dbPath || process.env.SQLITE_DB_PATH || path.join(__dirname, 'noticias.db');
  const db = new sqlite3.Database(resolvedDbPath);
  app.locals.db = db; // expor conexão para testes/cleanup
  console.log('🗄️ Conectado ao banco SQLite:', resolvedDbPath);

  // Util interno: obter colunas existentes da tabela (para updates dinâmicos)
  function getTableColumns(table, cb) {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) return cb(err);
      const cols = Array.isArray(rows) ? rows.map(r => r.name) : [];
      cb(null, cols);
    });
  }

  // --- AI Proxy (Groq) ---
  // Health de IA: informa se há chave configurada no servidor (sem expor o valor)
  app.get('/api/ai/health', (req, res) => {
    res.json({ groq: { hasKey: !!(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY) } });
  });

  // Proxy seguro para Groq (mantém a chave no backend)
  app.post('/api/ai/completions', async (req, res) => {
    try {
      const API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (!API_KEY) {
        return res.status(501).json({ error: 'GROQ API key não configurada no servidor' });
      }

      const { model = 'llama3-8b-8192', messages = [], max_tokens = 300, temperature = 0.7 } = req.body || {};
      const url = 'https://api.groq.com/openai/v1/chat/completions';

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, max_tokens, temperature })
      });

      const text = await r.text();
      if (!r.ok) {
        console.error('Erro Groq proxy:', r.status, text);
        return res.status(r.status).send(text);
      }
      // Repassa JSON bruto da Groq
      res.type('application/json').send(text);
    } catch (e) {
      console.error('Falha no proxy Groq:', e);
      res.status(500).json({ error: 'Erro no proxy Groq' });
    }
  });

  // Listar posts (com filtros básicos)
  app.get('/api/posts', (req, res) => {
    const limitParam = req.query.limit ?? 50;
    const pageParam = req.query.page ?? 1;
    const posicaoParam = req.query.posicao || req.query.position || undefined;
    const categoriaParam = req.query.categoria || req.query.category || undefined;
    const q = req.query.q;
    const admin = req.query.admin; // ignorado, mas habilita resposta paginada

    const limit = Math.min(100, Math.max(1, parseInt(limitParam)));
    const page = Math.max(1, parseInt(pageParam));
    const offset = (page - 1) * limit;

    let base = 'FROM noticias';
    const where = [];
    const params = [];
    if (posicaoParam) {
      const p = normalizePos(String(posicaoParam));
      if (p === 'geral') {
        // geral inclui nulos/vazios
        where.push('(LOWER(COALESCE(posicao, "")) = ? OR posicao IS NULL OR TRIM(posicao) = "")');
        params.push('geral');
      } else {
        where.push('LOWER(posicao) = ?');
        params.push(p.toLowerCase());
      }
    }
    if (categoriaParam) {
      // Filtro por categoria - busca exata na categoria original do banco
      where.push('LOWER(categoria) = ?');
      params.push(String(categoriaParam).toLowerCase());
    }
    if (q) {
      where.push('(titulo LIKE ? OR subtitulo LIKE ? OR conteudo LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (where.length) base += ' WHERE ' + where.join(' AND ');

    const query = `SELECT * ${base} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total ${base}`;

    const doPaged = req.query.page !== undefined || admin !== undefined;

  db.all(query, [...params, limit, offset], (err, rows) => {
      if (err) {
        console.error('Erro na consulta /api/posts:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      const items = rows.map(mapPost);
      console.log(`📊 /api/posts => ${items.length} itens (posicao=${posicaoParam || 'todas'} categoria=${categoriaParam || 'todas'} q=${q || '-'})`);

      // Cache-Control e Last-Modified (60s)
      let lastMod = undefined;
      try {
        const dates = items
          .map(p => p.publishedAt || p.createdAt)
          .filter(Boolean)
          .map(d => new Date(d).getTime())
          .filter(n => Number.isFinite(n));
        lastMod = (dates.length ? new Date(Math.max(...dates)) : new Date()).toUTCString();
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('Last-Modified', lastMod);
      } catch (_) {}

      if (!doPaged) {
        const body = JSON.stringify(items);
        const etag = strongEtagFor(body);
        if (etag) res.setHeader('ETag', etag);
        return res.type('application/json').send(body);
      }

      // Paginado: calcular total
      db.get(countQuery, params, (cerr, crow) => {
        const total = cerr ? items.length : (crow?.total ?? items.length);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const payload = {
          posts: items,
          currentPage: page,
          totalPages,
          totalPosts: total,
          postsPerPage: limit
        };
        const body = JSON.stringify(payload);
        const etag = strongEtagFor(body);
        if (etag) res.setHeader('ETag', etag);
        if (lastMod) res.setHeader('Last-Modified', lastMod);
        if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=60');
        return res.type('application/json').send(body);
      });
    });
  });

  // Busca textual simples (registrada ANTES de /api/posts/:id para evitar colisão)
  app.get('/api/posts/search', (req, res) => {
    const { q = '' } = req.query;
    const term = String(q).trim();
    if (!term) return res.json([]);
    const like = `%${term}%`;
    db.all(
      'SELECT * FROM noticias WHERE titulo LIKE ? OR subtitulo LIKE ? OR conteudo LIKE ? ORDER BY id DESC LIMIT 50',
      [like, like, like],
      (err, rows) => {
        if (err) {
          console.error('Erro em /api/posts/search:', err);
          res.status(500).json({ error: 'Erro interno do servidor' });
          return;
        }
        res.json(rows.map(mapPost));
      }
    );
  });

  // Post por ID
  app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM noticias WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erro na consulta:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: 'Post não encontrado' });
        return;
      }
      
      res.json(mapPost(row));
    });
  });

  // Atualizar conteúdo de um post (edição pelo dashboard)
  app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    
    // Log para debug do tamanho do payload
    const payloadSize = JSON.stringify(req.body).length / 1024 / 1024;
    console.log(`📊 Tamanho do body recebido: ${payloadSize.toFixed(2)} MB`);

    // Campos que aceitaremos do front
    const desired = {
      titulo: body.titulo ?? body.title,
      subtitulo: body.subtitulo ?? body.subtitle,
      conteudo: body.conteudo ?? body.content,
      categoria: body.categoria ?? body.category,
      chapeu: body.chapeu,
      posicao: body.posicao ?? body.position,
      slug: body.slug,
    };

    // imagem: priorizar uma coluna existente
    const incomingImage = body.imagemUrl || body.imagemDestaque || body.imagem || body.image;

    // Normalizar posicao se enviada e NÃO vazia; se vier vazia, não atualiza
    if (desired.posicao !== undefined && desired.posicao !== null) {
      const raw = String(desired.posicao).trim();
      if (raw === '') {
        delete desired.posicao;
      } else {
        try { desired.posicao = normalizePos(raw); } catch (_) {}
      }
    }

    // Não sobrescrever chapeu com vazio
    if (desired.chapeu !== undefined && desired.chapeu !== null) {
      const rawCh = String(desired.chapeu).trim();
      if (rawCh === '') {
        delete desired.chapeu;
      }
    }

    getTableColumns('noticias', (cerr, cols) => {
      if (cerr) {
        console.error('Erro PRAGMA table_info:', cerr);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      const sets = [];
      const params = [];

      // Mapear campos simples se a coluna existir
      Object.entries(desired).forEach(([k, v]) => {
        if (v !== undefined && cols.includes(k)) {
          sets.push(`${k} = ?`);
          params.push(v);
        }
      });

      // Resolver coluna de imagem de acordo com o schema real
      if (incomingImage) {
        const imgCol = cols.includes('imagem')
          ? 'imagem'
          : cols.includes('imagemUrl')
            ? 'imagemUrl'
            : cols.includes('imagem_destaque')
              ? 'imagem_destaque'
              : null;
        if (imgCol) {
          sets.push(`${imgCol} = ?`);
          params.push(String(incomingImage));
        }
      }

      if (sets.length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar (colunas inexistentes ou corpo vazio)' });
      }

      const sql = `UPDATE noticias SET ${sets.join(', ')} WHERE id = ?`;
      db.run(sql, [...params, id], function (uerr) {
        if (uerr) {
          console.error('Erro ao atualizar post:', uerr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Post não encontrado' });
        }
        
        // Invalida cache home
        try { if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); } catch(_) {}
        
        // Se a posição foi alterada, reorganizar hierarquia
        const positionChanged = desired.posicao && (desired.posicao === 'supermanchete' || desired.posicao === 'destaque');
        
        console.log(`🔍 [DEBUG] desired.posicao: ${desired.posicao}, positionChanged: ${positionChanged}`);
        
        if (positionChanged) {
          console.log(`🔄 [DEBUG] Chamando reorganizePositionHierarchy para post ${id} com posição ${desired.posicao}`);
          reorganizePositionHierarchy(db, id, desired.posicao, (hierarchyErr) => {
            if (hierarchyErr) {
              console.error('Erro na reorganização hierárquica:', hierarchyErr);
              // Não falha a requisição, mas loga o erro
            }
            
            // Retornar objeto atualizado
            db.get('SELECT * FROM noticias WHERE id = ?', [id], (gerr, row) => {
              if (gerr || !row) {
                return res.json({ ok: true, id });
              }
              res.json(mapPost(row));
            });
          });
        } else {
          // Retornar objeto atualizado sem reorganização
          db.get('SELECT * FROM noticias WHERE id = ?', [id], (gerr, row) => {
            if (gerr || !row) {
              return res.json({ ok: true, id });
            }
            res.json(mapPost(row));
          });
        }
      });
    });
  });

  // Atualizar posição de um post (usado pelo dashboard)
  app.put('/api/posts/:id/position', (req, res) => {
    const { id } = req.params;
    const { posicao } = req.body || {};
    if (!posicao) return res.status(400).json({ error: 'posicao é obrigatória' });
    const norm = normalizePos(posicao);
    db.run('UPDATE noticias SET posicao = ? WHERE id = ?', [norm, id], function (err) {
      if (err) {
        console.error('Erro ao atualizar posicao:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
  if (this.changes === 0) return res.status(404).json({ error: 'Post não encontrado' });
  try { if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); } catch(_) {}
  res.json({ ok: true, id, posicao: norm });
    });
  });

  // Atualizar apenas o chapéu de um post
  app.put('/api/posts/:id/chapeu', (req, res) => {
    const { id } = req.params;
    let { chapeu } = req.body || {};

    if (chapeu === undefined || chapeu === null) {
      return res.status(400).json({ error: 'chapeu é obrigatório' });
    }

    chapeu = String(chapeu).trim();

    // Não sobrescrever com vazio: retornar objeto atual sem alterações
    if (!chapeu) {
      return db.get('SELECT * FROM noticias WHERE id = ?', [id], (gerr, row) => {
        if (gerr) {
          console.error('Erro ao obter post (unchanged chapeu):', gerr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        if (!row) return res.status(404).json({ error: 'Post não encontrado' });
        return res.json(mapPost(row));
      });
    }

    // Verificar se a coluna existe para evitar falhas em bancos antigos
    getTableColumns('noticias', (cerr, cols) => {
      if (cerr) {
        console.error('Erro PRAGMA table_info para chapeu:', cerr);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      if (!cols.includes('chapeu')) {
        return res.status(400).json({ error: "Coluna 'chapeu' não existe. Execute a migração: npm run db:migrate:chapeu" });
      }
      db.run('UPDATE noticias SET chapeu = ? WHERE id = ?', [chapeu, id], function (uerr) {
        if (uerr) {
          console.error('Erro ao atualizar chapeu:', uerr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
  if (this.changes === 0) return res.status(404).json({ error: 'Post não encontrado' });
  try { if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); } catch(_) {}
        db.get('SELECT * FROM noticias WHERE id = ?', [id], (gerr, row) => {
          if (gerr || !row) return res.json({ ok: true, id, chapeu });
          res.json(mapPost(row));
        });
      });
    });
  });

  // Deletar post
  app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    console.log('🗑️ Tentando deletar post:', id);

    // Verificar se o post existe antes de deletar
    db.get('SELECT * FROM noticias WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erro ao verificar post:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Post não encontrado' });
      }

      // Deletar o post
      db.run('DELETE FROM noticias WHERE id = ?', [id], function (deleteErr) {
        if (deleteErr) {
          console.error('Erro ao deletar post:', deleteErr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Post não encontrado ou já deletado' });
        }

        console.log('✅ Post deletado com sucesso:', id);
        
        // Invalidar cache se a função existir
        try { 
          if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); 
        } catch(_) {}

        res.json({ 
          success: true, 
          message: 'Post deletado com sucesso',
          id: id 
        });
      });
    });
  });

  // Criar novo post
  app.post('/api/posts', (req, res) => {
    const body = req.body || {};
    
    // Campos obrigatórios
    const titulo = body.titulo || body.title;
    const categoria = body.categoria || body.category || 'geral';
    
    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    // Campos opcionais
    const subtitulo = body.subtitulo || body.subtitle || '';
    const conteudo = body.conteudo || body.content || '';
    const autor = body.autor || body.author || 'Redação R10 Piauí';
    const chapeu = body.chapeu || '';
    const posicao = body.posicao || body.position || 'geral';
    let imagemDestaque = body.imagem_destaque || body.imagemDestaque || body.imagemUrl || body.imagem || body.image || '';
    
    // Normalizar posição
    const normalizedPosition = normalizePos(posicao);
    
    // Data atual
    const now = new Date().toISOString();
    
    // PRIMEIRO: Inserir no banco para obter o ID
    const sql = `
      INSERT INTO noticias (titulo, subtitulo, conteudo, categoria, autor, chapeu, posicao, imagem_destaque, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [titulo, subtitulo, conteudo, categoria, autor, chapeu, normalizedPosition, imagemDestaque, now], function(err) {
      if (err) {
        console.error('Erro ao criar post:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      const newId = this.lastID;
      console.log(`✅ Novo post criado com ID: ${newId} (posição: ${normalizedPosition})`);
      
      // Invalida cache home
      try { if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); } catch(_) {}
      
      // Se a posição for supermanchete ou destaque, reorganizar hierarquia
      const positionChanged = normalizedPosition === 'supermanchete' || normalizedPosition === 'destaque';
      
      if (positionChanged) {
        console.log(`🔄 Reorganizando hierarquia para novo post ${newId} com posição ${normalizedPosition}`);
        reorganizePositionHierarchy(db, newId, normalizedPosition, (hierarchyErr) => {
          if (hierarchyErr) {
            console.error('Erro na reorganização hierárquica:', hierarchyErr);
          }
          
          // Retornar o post criado
          db.get('SELECT * FROM noticias WHERE id = ?', [newId], (gerr, row) => {
            if (gerr || !row) {
              return res.json({ ok: true, id: newId });
            }
            res.status(201).json(mapPost(row));
          });
        });
      } else {
        // Retornar o post criado sem reorganização
        db.get('SELECT * FROM noticias WHERE id = ?', [newId], (gerr, row) => {
          if (gerr || !row) {
            return res.json({ ok: true, id: newId });
          }
          res.status(201).json(mapPost(row));
        });
      }
    });
  });

  // Buscar por slug (quando não há coluna slug, calculamos em memória)
  app.get('/api/posts/slug/:slug', (req, res) => {
    const { slug } = req.params;
    // Buscamos um conjunto razoável e filtramos por slug calculado
    db.all('SELECT * FROM noticias ORDER BY id DESC LIMIT 500', [], (err, rows) => {
      if (err) {
        console.error('Erro em /api/posts/slug:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      const found = rows.map(mapPost).find(p => p.slug === slug);
      if (!found) return res.status(404).json({ error: 'Post não encontrado' });
      res.json(found);
    });
  });

  // Home endpoint (com cache leve 60s)
  app.get('/api/home', (req, res) => {
    const now = Date.now();
    const cache = app.locals.homeCache;
    if (cache?.body && cache.expiresAt > now) {
      res.setHeader('Cache-Control', 'public, max-age=60');
      if (cache.lastModified) res.setHeader('Last-Modified', cache.lastModified);
      res.setHeader('X-Cache', 'HIT');
      const etag = strongEtagFor(cache.body);
      if (etag) res.setHeader('ETag', etag);
      return res.type('application/json').send(cache.body);
    }
    // Estratégia robusta: buscar recentes e particionar em memória com normalizePos
    db.all('SELECT * FROM noticias ORDER BY id DESC LIMIT 200', [], (err, rows) => {
      if (err || !rows) {
        if (err) console.error('Erro /api/home:', err);
        res.set('Cache-Control', 'public, max-age=60');
        res.set('X-Cache', 'MISS');
        return res.json({ hero: [], destaques: [], geral: [] });
      }

      const items = rows.map(mapPost);
      const withNorm = items.map(p => ({ ...p, _normPos: normalizePos(p.posicao || '') }));

      const heroItem = withNorm.find(p => p._normPos === 'supermanchete');
      const destaques = withNorm.filter(p => p._normPos === 'destaque' && (!heroItem || p.id !== heroItem.id)).slice(0, 6);
      const usados = new Set([heroItem?.id, ...destaques.map(d => d.id)].filter(Boolean));
      const geral = withNorm.filter(p => p._normPos === 'geral' && !usados.has(p.id)).slice(0, 20);

      let out = { hero: [], destaques: [], geral: [] };

      if (heroItem) out.hero = [heroItem];
      out.destaques = destaques;
      out.geral = geral;

      // Fallbacks: se não houver hero, promover o primeiro item restante
      if (out.hero.length === 0) {
        const candidato = withNorm.find(p => !usados.has(p.id));
        if (candidato) {
          out.hero = [candidato];
          if (candidato._normPos === 'geral') {
            // garantir que não duplique no geral
            out.geral = out.geral.filter(g => g.id !== candidato.id);
          }
        }
      }

      // Remover campo interno
      out = {
        hero: out.hero.map(({ _normPos, ...rest }) => rest),
        destaques: out.destaques.map(({ _normPos, ...rest }) => rest),
        geral: out.geral.map(({ _normPos, ...rest }) => rest)
      };

      console.log(`🏠 /api/home => hero=${out.hero.length} destaques=${out.destaques.length} geral=${out.geral.length}`);
      // Last-Modified baseado no mais recente do payload; cache TTL 60s
      try {
        const all = [...out.hero, ...out.destaques, ...out.geral];
        const dates = all
          .map(p => p.publishedAt || p.createdAt)
          .filter(Boolean)
          .map(d => new Date(d).getTime())
          .filter(n => Number.isFinite(n));
        const lm = dates.length ? new Date(Math.max(...dates)).toUTCString() : new Date().toUTCString();
        const body = JSON.stringify(out);
        // Cabeçalhos
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('Last-Modified', lm);
        res.setHeader('X-Cache', 'MISS');
        const etag = strongEtagFor(body);
        if (etag) res.setHeader('ETag', etag);
        // Atualiza cache
        app.locals.homeCache = { body, expiresAt: Date.now() + 60_000, lastModified: lm };
        return res.type('application/json').send(body);
      } catch (_) {
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('X-Cache', 'MISS');
        const body = JSON.stringify(out);
        const etag = strongEtagFor(body);
        if (etag) res.setHeader('ETag', etag);
        return res.type('application/json').send(body);
      }
    });
  });

  // Categorias com contagem (suporte ao dashboard)
  app.get('/api/categorias', (req, res) => {
    // Contabiliza com base na categoria normalizada (subcategorias públicas apenas)
    db.all('SELECT id, categoria FROM noticias', [], (err, rows) => {
      if (err || !rows) {
        if (err) console.error('Erro em /api/categorias:', err);
        return res.status(500).json([]);
      }
      const counts = new Map();
      for (const r of rows) {
        const key = normalizeCategoria(r.categoria); // policia, politica, esporte, entretenimento, geral
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      const out = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ categoria: k.toUpperCase(), total: v }));
      res.json(out);
    });
  });

  // Estatísticas simples
  app.get('/api/stats', (req, res) => {
    const out = { total: 0, supermanchete: 0, destaque: 0, geral: 0, missingChapeu: 0 };
    const qTotal = 'SELECT COUNT(*) as c FROM noticias';
    const qSup = "SELECT COUNT(*) as c FROM noticias WHERE LOWER(posicao) = 'supermanchete'";
    const qDes = "SELECT COUNT(*) as c FROM noticias WHERE LOWER(posicao) = 'destaque'";
    const qGer = "SELECT COUNT(*) as c FROM noticias WHERE LOWER(COALESCE(posicao, '')) IN ('geral', '') OR posicao IS NULL";
    const qMiss = "SELECT COUNT(*) as c FROM noticias WHERE chapeu IS NULL OR TRIM(chapeu) = ''";

    db.get(qTotal, [], (e1, r1) => {
      out.total = r1?.c || 0;
      db.get(qSup, [], (e2, r2) => {
        out.supermanchete = r2?.c || 0;
        db.get(qDes, [], (e3, r3) => {
          out.destaque = r3?.c || 0;
          db.get(qGer, [], (e4, r4) => {
            out.geral = r4?.c || 0;
            // missingChapeu pode falhar se a coluna não existir; nesse caso, assumir 0
            db.get(qMiss, [], (e5, r5) => {
              if (e5) {
                out.missingChapeu = 0;
              } else {
                out.missingChapeu = r5?.c || 0;
              }
              res.json(out);
            });
          });
        });
      });
    });
  });

  return app;
}

// Iniciar servidor somente quando este arquivo é o entrypoint principal
if (require.main === module) {
  const app = createApp({ dbPath: process.env.SQLITE_DB_PATH || path.join(__dirname, 'noticias.db') });

  // Porta principal (default 3002). Porta extra opcional via ADDITIONAL_PORT (não usa 8080 por padrão para evitar conflito com Instagram/TTS)
  const primary = Number(process.env.PORT || PORT) || 3002;
  const extra = process.env.ADDITIONAL_PORT ? Number(process.env.ADDITIONAL_PORT) : null;
  const ports = extra && extra !== primary ? [primary, extra] : [primary];

  ports.forEach((p) => {
    try {
      const server = app.listen(p, '127.0.0.1', () => {
        console.log(`🚀 API SQLite rodando na porta ${p} (apenas localhost)`);
        console.log(`📍 Health: http://127.0.0.1:${p}/api/health`);
        console.log(`📍 Health: http://localhost:${p}/api/health`);
      });
      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`⚠️  Porta ${p} já está em uso — ignorando.`);
        } else {
          console.error(`Erro ao iniciar na porta ${p}:`, err);
        }
      });
    } catch (e) {
      console.error(`Falha ao iniciar na porta ${p}:`, e);
    }
  });

  // Dicas de rotas (mostra usando a porta primária)
  console.log(`📰 Posts: http://127.0.0.1:${primary}/api/posts?limit=5`);
  console.log(`🏠 Home: http://127.0.0.1:${primary}/api/home`);
}

// Exportar para testes
module.exports = { createApp, slugify, normalizePos, normalizeCategoria };
