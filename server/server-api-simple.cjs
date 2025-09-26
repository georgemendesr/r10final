console.log('[[bootstrap]] Iniciando carregamento módulos principais...');
const express = require('express');
const cors = require('cors');
let sqlite3; try { sqlite3 = require('sqlite3').verbose(); console.log('[[bootstrap]] sqlite3 carregado'); } catch(e){ console.error('[[bootstrap]] ERRO ao carregar sqlite3:', e.message); process.exit(97); }
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configurar encoding para UTF-8
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.platform === 'win32') {
  process.stdout.setEncoding = process.stdout.setEncoding || (() => {});
  process.stderr.setEncoding = process.stderr.setEncoding || (() => {});
}

// Handlers globais para capturar falhas silenciosas
if (!global.__R10_DIAG__) {
  global.__R10_DIAG__ = true;
  const startedAt = Date.now();
  console.log('=== [R10 API] bootstrap', new Date().toISOString());
  process.on('uncaughtException', (err) => {
    console.error('💥 uncaughtException:', err && err.stack || err);
  });
  process.on('unhandledRejection', (reason, p) => {
    console.error('💥 unhandledRejection:', reason);
  });
  process.on('exit', (code) => {
    console.log(`=== [R10 API] exit code=${code} uptime=${((Date.now()-startedAt)/1000).toFixed(1)}s`);
  });
}
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
    resumo: row.resumo || '',
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
      let willHaveExtraDestaque = false;
      if (superManchetes.length > 0) {
        const currentSuperManchete = superManchetes[0];
        updates.push({ id: currentSuperManchete.id, posicao: 'destaque' });
        console.log(`📰 [BACKEND] Super manchete anterior (ID: ${currentSuperManchete.id}) vira DESTAQUE`);
        willHaveExtraDestaque = true;
      }
      
      // 2. Se teremos 6+ destaques após mover a supermanchete, o mais antigo vira GERAL
      const totalDestaques = destaques.length + (willHaveExtraDestaque ? 1 : 0);
      console.log(`🔢 [BACKEND] Cálculo: ${destaques.length} destaques + ${willHaveExtraDestaque ? 1 : 0} (supermanchete) = ${totalDestaques} total`);
      if (totalDestaques > 5) {
        // Ordenar destaques por data (mais antigo primeiro)
        const sortedDestaques = destaques.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.published_at || a.data || 0).getTime();
          const dateB = new Date(b.publishedAt || b.published_at || b.data || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestDestaque = sortedDestaques[0];
        updates.push({ id: oldestDestaque.id, posicao: 'geral' });
        console.log(`📄 [BACKEND] Destaque mais antigo (ID: ${oldestDestaque.id}) vira GERAL (mantendo 5 destaques)`);
      } else {
        console.log(`✅ [BACKEND] Total de ${totalDestaques} destaques está OK (≤5), nada a rebaixar`);
      }
      
    } else if (normalizedNewPosition === 'destaque') {
      // Se está inserindo um novo DESTAQUE
      
      // 🔒 PROTEÇÃO: SÓ rebaixar se REALMENTE temos MAIS que 5 destaques
      // (Considera que o post atual será atualizado, então +1 no total)
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
  
  // Configuração CORS específica para o frontend
  const corsOptions = {
    origin: (origin, callback) => {
      const staticAllowed = new Set([
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5176',
        'http://localhost:5177',
        'http://127.0.0.1:5177',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ]);
      const lanRegex = /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]{2,5}$/;
      if (!origin) return callback(null, true); // same-origin / tools
      if (staticAllowed.has(origin) || lanRegex.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
  };
  
  app.use(cors(corsOptions));

  // Servir frontend buildado (modo produção single-process) quando habilitado
  // Ative definindo SERVE_STATIC_FRONT=1 ao iniciar (ex: process.env.SERVE_STATIC_FRONT='1')
  if (process.env.SERVE_STATIC_FRONT === '1') {
    try {
      const distPath = path.join(__dirname, '../r10-front_full_07ago/dist');
      if (fs.existsSync(distPath)) {
        console.log('📦 Servindo frontend estático de', distPath);
        app.use(express.static(distPath, { maxAge: '5m', index: 'index.html' }));
        // Qualquer rota não /api/ volta index.html para permitir SPA router
        app.get(/^(?!\/api\/).+/, (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      } else {
        console.log('⚠️  SERVE_STATIC_FRONT=1 mas dist não encontrado em', distPath);
      }
    } catch (e) {
      console.warn('Falha ao configurar frontend estático:', e.message);
    }
  }
  
  // CURTO-CIRCUITO: Health check no topo (diagnóstico)
  app.get('/api/health', (_req,res)=> res.type('text/plain; charset=utf-8').send('ok'));
  
  // Configurar charset UTF-8 para todas as respostas da API
  app.use('/api', (req, res, next) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    next();
  });
  
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
  
  // Configurar SQLite para UTF-8
  db.run("PRAGMA encoding = 'UTF-8'");
  
  app.locals.db = db; // expor conexão para testes/cleanup
  console.log('🗄️ Conectado ao banco SQLite:', resolvedDbPath);

  // ======= AUTH (local) =======
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-r10';
  const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutos
  const REFRESH_TTL_DAYS = 7; // 7 dias
  const ACCESS_COOKIE = 'r10_access';
  const REFRESH_COOKIE = 'r10_refresh';
  function b64url(input) {
    return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  }
  function b64urlJson(obj) { return b64url(JSON.stringify(obj)); }
  function signJWT(payload, expSeconds = 60 * 60 * 4) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = { iat: now, exp: now + expSeconds, ...payload };
    const signingInput = `${b64urlJson(header)}.${b64urlJson(body)}`;
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64')
      .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    return `${signingInput}.${sig}`;
  }
  function verifyJWT(token) {
    try {
      const [h,p,s] = String(token||'').split('.');
      if (!h || !p || !s) return null;
      const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64')
        .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
      if (sig !== s) return null;
      const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
      if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null;
      return payload;
    } catch(_) { return null; }
  }
  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.scryptSync(password, salt, 32);
    return `scrypt:${salt}:${key.toString('hex')}`;
  }
  function verifyPassword(password, stored) {
    try {
      const [scheme, salt, hashHex] = String(stored||'').split(':');
      if (scheme !== 'scrypt' || !salt || !hashHex) return false;
      const key = crypto.scryptSync(password, salt, 32).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(key,'hex'), Buffer.from(hashHex,'hex'));
    } catch(_) { return false; }
  }

  function ensureUsersTable(cb) {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      avatar TEXT,
      created_at TEXT NOT NULL
    )`, [], (err) => {
      if (err) return cb && cb(err);
      // Seed admin se tabela vazia
      db.get('SELECT COUNT(*) as c FROM usuarios', [], (e, row) => {
        if (e) return cb && cb(e);
        if ((row?.c||0) === 0) {
          const now = new Date().toISOString();
          const admin = {
            name: 'João Silva',
            email: 'joao@r10piaui.com',
            password_hash: hashPassword('admin'),
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
            created_at: now
          };
          db.run('INSERT INTO usuarios (name,email,password_hash,role,avatar,created_at) VALUES (?,?,?,?,?,?)',
            [admin.name, admin.email.toLowerCase(), admin.password_hash, admin.role, admin.avatar, admin.created_at],
            () => cb && cb()
          );
        } else cb && cb();
      });
    });
  }

  ensureUsersTable((err)=>{
    if (err) console.error('⚠️ Erro ao garantir tabela usuarios:', err);
    else console.log('👤 Tabela de usuários pronta');
  });

  // ======= REFRESH TOKENS =======
  function ensureRefreshTokensTable(cb) {
    db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      user_agent TEXT,
      ip TEXT
    )`, [], (err) => cb && cb(err));
  }

  ensureRefreshTokensTable((err)=>{
    if (err) console.error('⚠️ Erro ao garantir tabela refresh_tokens:', err);
    else console.log('🔑 Tabela de refresh tokens pronta');
  });

  function base64urlBuffer(bytes = 48) {
    return crypto.randomBytes(bytes).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  }
  function sha256Hex(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

  function parseCookies(req) {
    const hdr = req.headers['cookie'] || '';
    const out = {};
    hdr.split(';').forEach(p => {
      const idx = p.indexOf('=');
      if (idx > -1) {
        const k = p.slice(0, idx).trim();
        const v = decodeURIComponent(p.slice(idx+1).trim());
        if (k) out[k] = v;
      }
    });
    return out;
  }

  function setAuthCookies(res, accessToken, refreshToken) {
    try {
      res.cookie(ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: ACCESS_TTL_SECONDS * 1000,
        path: '/'
      });
      res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
        path: '/'
      });
    } catch (_) {}
  }

  function clearAuthCookies(res) {
    try {
      res.cookie(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: false, expires: new Date(0), path: '/' });
      res.cookie(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: false, expires: new Date(0), path: '/' });
      // Limpeza extra para casos legados com path antigo
      res.cookie(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: false, expires: new Date(0), path: '/api/auth' });
      res.cookie(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: false, expires: new Date(0), path: '/api/auth' });
    } catch (_) {}
  }

  function authMiddleware(req, res, next) {
    const hdr = req.headers['authorization'] || '';
    let token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) {
      const cookies = parseCookies(req);
      if (!cookies || (!cookies[ACCESS_COOKIE] && !cookies[REFRESH_COOKIE])) {
        console.warn('[auth] sem cookies de auth na requisição', {
          hasCookieHeader: !!req.headers['cookie'],
          cookieLen: (req.headers['cookie']||'').length
        });
      }
      if (cookies && cookies[ACCESS_COOKIE]) {
        // Não logar valor do token, apenas comprimento
        console.log('[auth] r10_access presente (len=', String(cookies[ACCESS_COOKIE]||'').length, ')');
      }
      if (cookies && cookies[ACCESS_COOKIE]) token = cookies[ACCESS_COOKIE];
    }
    const payload = token ? verifyJWT(token) : null;
    if (!payload) return res.status(401).json({ error: 'unauthorized' });
    req.user = payload;
    next();
  }

  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: 'unauthorized' });
      if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
      next();
    };
  }

  // Rotas de autenticação
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email e senha obrigatórios' });
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString();
    const allowed = allowLoginAttempt(ip);
    if (!allowed.ok) {
      return res.status(429).json({ error: 'muitas tentativas, tente mais tarde', retryAfterMs: allowed.retryAfter });
    }
    db.get('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [String(email).trim()], (err, user) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!user) return res.status(401).json({ error: 'credenciais inválidas' });
      if (!verifyPassword(String(password), user.password_hash)) return res.status(401).json({ error: 'credenciais inválidas' });
      const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
      const accessToken = signJWT(payload, ACCESS_TTL_SECONDS);
      const refreshRaw = base64urlBuffer(48);
      const refreshHash = sha256Hex(refreshRaw);
      const now = new Date();
      const created_at = now.toISOString();
      const expires_at = new Date(now.getTime() + (REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)).toISOString();
      const ua = req.headers['user-agent'] || null;
      const ipAddr = ip;
      db.run('INSERT INTO refresh_tokens (user_id, token_hash, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)',
        [user.id, refreshHash, created_at, expires_at, ua, ipAddr], (insErr) => {
          if (insErr) return res.status(500).json({ error: 'erro de servidor' });
          setAuthCookies(res, accessToken, refreshRaw);
          const outUser = { id: String(user.id), name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.created_at };
          res.json({ token: accessToken, user: outUser });
        }
      );
    });
  });

  // Endpoint de debug não sensível: inspeciona presença de cookies (sem revelar valores)
  app.get('/api/auth/debug-cookies', (req, res) => {
    const cookies = parseCookies(req);
    res.json({
      hasAccess: !!cookies[ACCESS_COOKIE],
      hasRefresh: !!cookies[REFRESH_COOKIE],
      cookieHeaderPresent: !!req.headers['cookie'],
      cookieHeaderLength: (req.headers['cookie']||'').length
    });
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const id = req.user.sub;
    db.get('SELECT id,name,email,role,avatar,created_at FROM usuarios WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!row) return res.status(404).json({ error: 'não encontrado' });
      res.json({ id: String(row.id), name: row.name, email: row.email, role: row.role, avatar: row.avatar, createdAt: row.created_at });
    });
  });

  app.post('/api/auth/register', authMiddleware, requireRole('admin'), (req, res) => {
    const { name, email, password, role = 'editor', avatar } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'campos obrigatórios: name, email, password' });
    if (String(password).length < 8) return res.status(400).json({ error: 'senha muito curta (mínimo 8 caracteres)' });
    const created_at = new Date().toISOString();
    const password_hash = hashPassword(String(password));
    db.run('INSERT INTO usuarios (name,email,password_hash,role,avatar,created_at) VALUES (?,?,?,?,?,?)',
      [name, String(email).toLowerCase(), password_hash, role, avatar || null, created_at], function (err) {
        if (err) {
          if (String(err.message||'').includes('UNIQUE')) return res.status(409).json({ error: 'email já cadastrado' });
          return res.status(500).json({ error: 'erro de servidor' });
        }
        res.status(201).json({ id: String(this.lastID), name, email: String(email).toLowerCase(), role, avatar: avatar || null, createdAt: created_at });
      }
    );
  });

  // ======= User Management (Admin only) =======
  app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
    db.all('SELECT id,name,email,role,avatar,created_at FROM usuarios ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      const users = (rows || []).map(r => ({ id: String(r.id), name: r.name, email: r.email, role: r.role, avatar: r.avatar, createdAt: r.created_at }));
      res.json({ items: users, total: users.length });
    });
  });

  // ======= Categories (editorial/municipality/special) =======
  // Tabela e endpoints simples para gerenciar categorias básicas usadas no painel
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('editorial','municipality','special')),
    created_at TEXT
  )`);

  app.get('/api/categories', authMiddleware, requireRole('admin'), (req, res) => {
    const type = String(req.query.type || '').trim();
    const params = [];
    let sql = 'SELECT id,name,color,type,created_at FROM categories';
    if (type) { sql += ' WHERE type = ?'; params.push(type); }
    sql += ' ORDER BY created_at DESC, id DESC';
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      const items = (rows || []).map(r => ({ id: String(r.id), name: r.name, color: r.color, type: r.type, createdAt: r.created_at }));
      res.json({ items, total: items.length });
    });
  });

  app.post('/api/categories', authMiddleware, requireRole('admin'), (req, res) => {
    const { name, color = '#6B7280', type } = req.body || {};
    if (!name || !type || !['editorial','municipality','special'].includes(String(type))) {
      return res.status(400).json({ error: 'parâmetros inválidos' });
    }
    const created_at = new Date().toISOString();
    db.run('INSERT INTO categories (name,color,type,created_at) VALUES (?,?,?,?)', [String(name).trim(), String(color), String(type), created_at], function (err) {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      res.status(201).json({ id: String(this.lastID), name: String(name).trim(), color: String(color), type: String(type), createdAt: created_at });
    });
  });

  app.delete('/api/categories/:id', authMiddleware, requireRole('admin'), (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      res.json({ ok: true });
    });
  });

  // ======= Social Insights (Facebook/Instagram) =======
  app.get('/api/social/insights', authMiddleware, async (req, res) => {
    const IG_USER_ID = process.env.IG_BUSINESS_ID || process.env.IG_USER_ID || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || process.env.PAGE_ID || '';
  const META_TOKEN = process.env.IG_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const FB_PAGE_TOKEN_ENV = process.env.FB_PAGE_ACCESS_TOKEN || '';

    if (!IG_USER_ID || !FB_PAGE_ID || !META_TOKEN) {
      return res.status(501).json({
        error: 'Meta Graph não configurado',
        missing: {
          ig_user_id: !IG_USER_ID,
          fb_page_id: !FB_PAGE_ID,
          access_token: !META_TOKEN
        },
        hint: 'Defina IG_BUSINESS_ID/IG_USER_ID, FB_PAGE_ID e IG_ACCESS_TOKEN (ou FB_ACCESS_TOKEN/META_ACCESS_TOKEN) no .env'
      });
    }

    try {
      console.log('[insights] start[v3]', { ig: IG_USER_ID, fb: FB_PAGE_ID });
      console.log('[insights] ordem IG: reach -> impressions | FB: page_engaged_users -> page_impressions -> page_impressions_unique');
    } catch(_) {}

  const base = 'https://graph.facebook.com/v22.0';
    const now = Math.floor(Date.now() / 1000);
    const days = 7;
    const since = now - (days - 1) * 86400;
    const until = now;

    async function getJson(url) {
      const r = await fetch(url);
      const txt = await r.text();
      try { return { ok: r.ok, status: r.status, data: JSON.parse(txt) }; }
      catch { return { ok: r.ok, status: r.status, data: null, raw: txt }; }
    }

    async function getPageAccessToken(pageId, userToken) {
      try {
        // Tenta diretamente no recurso da Página
        const resp = await getJson(`${base}/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`);
        if (resp.ok && resp.data && resp.data.access_token) {
          console.log('[insights][facebook] usando Page Access Token para insights');
          return String(resp.data.access_token);
        }
        try { console.warn('[insights][facebook] falha ao obter Page Access Token', resp.status, resp.data || resp.raw); } catch(_) {}
        // Fallback: lista de páginas do usuário autenticado
        const accounts = await getJson(`${base}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`);
        if (accounts.ok && Array.isArray(accounts.data?.data)) {
          const found = accounts.data.data.find(p => String(p.id) === String(pageId));
          if (found && found.access_token) {
            console.log('[insights][facebook] usando Page Access Token via me/accounts');
            return String(found.access_token);
          }
        } else {
          try { console.warn('[insights][facebook] me/accounts FAIL', accounts.status, accounts.data || accounts.raw); } catch(_) {}
        }
      } catch (e) {
        console.warn('[insights][facebook] exceção ao obter Page Access Token', e?.message || e);
      }
      return null;
    }

    try {
      // Instagram: followers_count + reach/impressions (7 dias). Preferir reach (mais amplamente disponível).
      const igResult = { followers: null, username: null, trend: [], engagement: null, metric: null, status: 'unavailable', error: null };
      const igUserResp = await getJson(`${base}/${IG_USER_ID}?fields=followers_count,username,name&access_token=${encodeURIComponent(META_TOKEN)}`);
      if (!igUserResp.ok) {
        try { console.warn('[insights][instagram] followers_count FAIL', igUserResp.status, igUserResp.data || igUserResp.raw); } catch(_) {}
        igResult.error = { step: 'followers', status: igUserResp.status, detail: igUserResp.data || igUserResp.raw || null };
      } else {
        igResult.followers = Number(igUserResp.data?.followers_count || 0);
        igResult.username = String(igUserResp.data?.username || igUserResp.data?.name || '').trim();
        // Tentar primeiro reach (mais estável), depois impressions
        let igReachResp = await getJson(`${base}/${IG_USER_ID}/insights?metric=reach&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(META_TOKEN)}`);
        if (!igReachResp.ok) {
          try { console.warn('[insights][instagram] reach FAIL', igReachResp.status, igReachResp.data || igReachResp.raw); } catch(_) {}
          // Fallback: usar 'views' (impressions pode não estar disponível na versão atual da API para nível de conta)
          const igViewsResp = await getJson(`${base}/${IG_USER_ID}/insights?metric=views&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(META_TOKEN)}`);
          if (!igViewsResp.ok) {
            igResult.error = { step: 'insights', status: igReachResp.status, detail: igReachResp.data || igReachResp.raw || null, fallback: { status: igViewsResp.status, detail: igViewsResp.data || igViewsResp.raw || null } };
          } else {
            const series = Array.isArray(igViewsResp.data?.data) ? igViewsResp.data.data : [];
            const values = (series.find(m => m.name === 'views')?.values || [] )
              .map(v => ({ date: String(v.end_time || '').slice(0,10), engagement: Number(v.value || 0) }));
            igResult.trend = values;
            igResult.engagement = values.reduce((a,b)=> a + (b.engagement||0), 0);
            igResult.metric = 'views';
            igResult.status = 'ok'; // fallback bem-sucedido ainda é dado real
          }
        } else {
          const series = Array.isArray(igReachResp.data?.data) ? igReachResp.data.data : [];
          const values = (series.find(m => m.name === 'reach')?.values || [])
            .map(v => ({ date: String(v.end_time || '').slice(0,10), engagement: Number(v.value || 0) }));
          igResult.trend = values;
          igResult.engagement = values.reduce((a,b)=> a + (b.engagement||0), 0);
          igResult.metric = 'reach';
          igResult.status = 'ok';
        }
      }

      // Facebook Page: followers_count + série de engajamento últimos 7 dias
  const fbResult = { followers: null, name: null, trend: [], engagement: null, metric: null, status: 'unavailable', error: null };
  // Obter Page Access Token (se possível) para métricas de página; prioriza variável de ambiente se fornecida
  const PAGE_TOKEN = FB_PAGE_TOKEN_ENV || (await getPageAccessToken(FB_PAGE_ID, META_TOKEN)) || META_TOKEN;
      const fbPageResp = await getJson(`${base}/${FB_PAGE_ID}?fields=followers_count,name&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
      if (!fbPageResp.ok) {
        try { console.warn('[insights][facebook] followers_count FAIL', fbPageResp.status, fbPageResp.data || fbPageResp.raw); } catch(_) {}
        fbResult.error = { step: 'followers', status: fbPageResp.status, detail: fbPageResp.data || fbPageResp.raw || null };
      } else {
        fbResult.followers = Number(fbPageResp.data?.followers_count || 0);
        fbResult.name = String(fbPageResp.data?.name || '').trim();
        let fbInsightsResp = await getJson(`${base}/${FB_PAGE_ID}/insights?metric=page_engaged_users&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
        if (!fbInsightsResp.ok) {
          try { console.warn('[insights][facebook] page_engaged_users FAIL', fbInsightsResp.status, fbInsightsResp.data || fbInsightsResp.raw); } catch(_) {}
          // fallback 1: page_impressions (mais comum e estável)
          let fbImpResp = await getJson(`${base}/${FB_PAGE_ID}/insights?metric=page_impressions&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
          if (!fbImpResp.ok) {
            // fallback 2: page_impressions_unique (alcance único)
            const fbImpUniqueResp = await getJson(`${base}/${FB_PAGE_ID}/insights?metric=page_impressions_unique&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
            if (!fbImpUniqueResp.ok) {
              fbResult.error = { step: 'insights', status: fbInsightsResp.status, detail: fbInsightsResp.data || fbInsightsResp.raw || null, fallback: { status: fbImpResp.status, detail: fbImpResp.data || fbImpResp.raw || null, second: { status: fbImpUniqueResp.status, detail: fbImpUniqueResp.data || fbImpUniqueResp.raw || null } } };
            } else {
              const series = Array.isArray(fbImpUniqueResp.data?.data) ? fbImpUniqueResp.data.data : [];
              const values = (series.find(m => m.name === 'page_impressions_unique')?.values || series[0]?.values || [])
                .map(v => ({ date: String(v.end_time || '').slice(0,10), engagement: Number((v.value && v.value.value) || v.value || 0) }));
              fbResult.trend = values;
              fbResult.engagement = values.reduce((a,b)=> a + (b.engagement||0), 0);
              fbResult.metric = 'page_impressions_unique';
              fbResult.status = 'ok';
            }
          } else {
            const series = Array.isArray(fbImpResp.data?.data) ? fbImpResp.data.data : [];
            const values = (series.find(m => m.name === 'page_impressions')?.values || series[0]?.values || [])
              .map(v => ({ date: String(v.end_time || '').slice(0,10), engagement: Number((v.value && v.value.value) || v.value || 0) }));
            fbResult.trend = values;
            fbResult.engagement = values.reduce((a,b)=> a + (b.engagement||0), 0);
            fbResult.metric = 'page_impressions';
            fbResult.status = 'ok';
          }
        } else {
          const series = Array.isArray(fbInsightsResp.data?.data) ? fbInsightsResp.data.data : [];
          const values = (series.find(m => m.name === 'page_engaged_users')?.values || [])
            .map(v => ({ date: String(v.end_time || '').slice(0,10), engagement: Number((v.value && v.value.value) || v.value || 0) }));
          fbResult.trend = values;
          fbResult.engagement = values.reduce((a,b)=> a + (b.engagement||0), 0);
          fbResult.metric = 'page_engaged_users';
          fbResult.status = 'ok';
        }
      }

      const payload = {
        facebook: {
          followers: fbResult.followers,
          engagement: fbResult.engagement,
          growth7d: 0, // recalculado abaixo se possível
          trend: fbResult.trend,
          account: { id: FB_PAGE_ID, name: fbResult.name },
          metrics: { primary: fbResult.metric, status: fbResult.status, error: fbResult.error || null }
        },
        instagram: {
          followers: igResult.followers,
          engagement: igResult.engagement,
          growth7d: 0, // recalculado abaixo se possível
          trend: igResult.trend,
          account: { id: IG_USER_ID, username: igResult.username },
          metrics: { primary: igResult.metric, status: igResult.status, error: igResult.error || null }
        }
      };

      // Persistir métricas diárias e calcular growth real (diferença percentual entre primeiro e último dos últimos 7 dias)
      const today = new Date().toISOString().slice(0,10);
      function upsertMetric(source, followers, engagement) {
        return new Promise((resolve)=>{
          db.run('INSERT OR IGNORE INTO social_metrics (source,date,followers,engagement,created_at) VALUES (?,?,?,?,?)',
            [source, today, followers, engagement, new Date().toISOString()], () => {
              // Se já existia, opcionalmente podemos atualizar seguidores/engajamento (mantemos primeiro do dia para histórico coerente)
              resolve();
            });
        });
      }
      if (typeof fbResult.followers === 'number') {
        await upsertMetric('facebook', fbResult.followers, Number(fbResult.engagement || 0));
      }
      if (typeof igResult.followers === 'number') {
        await upsertMetric('instagram', igResult.followers, Number(igResult.engagement || 0));
      }

      function computeGrowth(source, currentFollowers) {
        return new Promise((resolve)=>{
          db.all('SELECT date, followers FROM social_metrics WHERE source = ? ORDER BY date DESC LIMIT 8', [source], (err, rows) => {
            if (err || !rows || !rows.length) return resolve(0);
            // rows estão em ordem DESC; pegamos últimos 7 dias distintos
            const unique = [];
            const seen = new Set();
            for (const r of rows) { if (!seen.has(r.date)) { unique.push(r); seen.add(r.date); } }
            const slice = unique.slice(-7); // mais antigos dentro do intervalo
            if (slice.length < 2) return resolve(0);
            const first = slice[0].followers;
            const last = currentFollowers; // usamos valor atual (garantido)
            if (!first || first <= 0) return resolve(0);
            const growthPct = ((last - first) / first) * 100;
            resolve(Math.round(growthPct * 10) / 10); // uma casa decimal
          });
        });
      }

      const [fbGrowth, igGrowth] = await Promise.all([
        typeof fbResult.followers === 'number' ? computeGrowth('facebook', fbResult.followers) : Promise.resolve(0),
        typeof igResult.followers === 'number' ? computeGrowth('instagram', igResult.followers) : Promise.resolve(0)
      ]);
      payload.facebook.growth7d = fbGrowth;
      payload.instagram.growth7d = igGrowth;
      try {
        console.log('[insights] payload', JSON.stringify({
          facebook: { followers: payload.facebook.followers, engagement: payload.facebook.engagement, trendLen: (payload.facebook.trend||[]).length, account: payload.facebook.account?.name, metric: payload.facebook.metrics?.primary, status: payload.facebook.metrics?.status },
          instagram: { followers: payload.instagram.followers, engagement: payload.instagram.engagement, trendLen: (payload.instagram.trend||[]).length, account: payload.instagram.account?.username, metric: payload.instagram.metrics?.primary, status: payload.instagram.metrics?.status }
        }));
      } catch(_) {}
      // Nunca quebrar por falha parcial de métricas: retornar payload com status por fonte
      res.json(payload);
    } catch (e) {
      console.error('Erro ao consultar Meta Graph:', e && (e.stack || e));
      res.status(500).json({ error: 'erro ao consultar Meta Graph' });
    }
  });

  // ======= Social Analytics (dataset completo) =======
  // Retorna várias métricas reais possíveis para IG e FB, com período configurável (7-90 dias)
  app.get('/api/social/analytics', authMiddleware, async (req, res) => {
    const IG_USER_ID = process.env.IG_BUSINESS_ID || process.env.IG_USER_ID || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || process.env.PAGE_ID || '';
    const META_TOKEN = process.env.IG_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
    const FB_PAGE_TOKEN_ENV = process.env.FB_PAGE_ACCESS_TOKEN || '';

    if (!IG_USER_ID || !FB_PAGE_ID || !META_TOKEN) {
      return res.status(501).json({
        error: 'Meta Graph não configurado',
        missing: {
          ig_user_id: !IG_USER_ID,
          fb_page_id: !FB_PAGE_ID,
          access_token: !META_TOKEN
        }
      });
    }

  const base = 'https://graph.facebook.com/v22.0';
    const daysReq = Math.max(7, Math.min(90, parseInt(String(req.query.days || '30')) || 30));
    const now = Math.floor(Date.now() / 1000);
    const since = now - (daysReq - 1) * 86400;
    const until = now;

    async function getJson(url) {
      const r = await fetch(url);
      const txt = await r.text();
      try { return { ok: r.ok, status: r.status, data: JSON.parse(txt) }; }
      catch { return { ok: r.ok, status: r.status, data: null, raw: txt }; }
    }

    async function getPageAccessToken(pageId, userToken) {
      try {
        const resp = await getJson(`${base}/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`);
        if (resp.ok && resp.data && resp.data.access_token) return String(resp.data.access_token);
        const accounts = await getJson(`${base}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`);
        if (accounts.ok && Array.isArray(accounts.data?.data)) {
          const found = accounts.data.data.find(p => String(p.id) === String(pageId));
          if (found?.access_token) return String(found.access_token);
        }
      } catch(_) {}
      return null;
    }

    try {
      // Instagram account basics
      const igAccountResp = await getJson(`${base}/${IG_USER_ID}?fields=followers_count,username,name&access_token=${encodeURIComponent(META_TOKEN)}`);
      const igAccount = igAccountResp.ok ? {
        id: IG_USER_ID,
        username: String(igAccountResp.data?.username || igAccountResp.data?.name || ''),
        followers: Number(igAccountResp.data?.followers_count || 0)
      } : { id: IG_USER_ID, username: null, followers: null, error: igAccountResp.data || igAccountResp.raw };

      // Facebook account basics (com Page Token se disponível)
      const PAGE_TOKEN = FB_PAGE_TOKEN_ENV || (await getPageAccessToken(FB_PAGE_ID, META_TOKEN)) || META_TOKEN;
      const fbAccountResp = await getJson(`${base}/${FB_PAGE_ID}?fields=followers_count,name&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
      const fbAccount = fbAccountResp.ok ? {
        id: FB_PAGE_ID,
        name: String(fbAccountResp.data?.name || ''),
        followers: Number(fbAccountResp.data?.followers_count || 0)
      } : { id: FB_PAGE_ID, name: null, followers: null, error: fbAccountResp.data || fbAccountResp.raw };

      // Coleções de métricas a tentar (apenas métricas amplamente disponíveis)
      const igMetrics = [
        { name: 'reach', period: 'day' },
        { name: 'accounts_engaged', period: 'day' },
        { name: 'impressions', period: 'day' },
        { name: 'profile_views', period: 'day' },
        { name: 'total_interactions', period: 'day' }
      ];
      const IG_TOTAL_VALUE_METRICS = new Set(['accounts_engaged','profile_views','total_interactions']);

      const fbMetrics = [
        { name: 'page_impressions', period: 'day' },
        { name: 'page_impressions_unique', period: 'day' },
        { name: 'page_engaged_users', period: 'day' },
        { name: 'page_fan_adds_unique', period: 'day' },
        { name: 'page_fan_removes_unique', period: 'day' }
      ];

      async function fetchIgMetric(m) {
        const needsTotal = IG_TOTAL_VALUE_METRICS.has(m.name);
        const url = `${base}/${IG_USER_ID}/insights?metric=${m.name}&period=${m.period}&since=${since}&until=${until}${needsTotal ? '&metric_type=total_value' : ''}&access_token=${encodeURIComponent(META_TOKEN)}`;
        const r = await getJson(url);
        if (!r.ok) return { name: m.name, period: m.period, status: 'error', error: r.data || r.raw || null };
        const series = Array.isArray(r.data?.data) ? r.data.data : [];
        const values = (series.find(x => x.name === m.name)?.values || series[0]?.values || [])
          .map(v => ({ date: String(v.end_time || '').slice(0,10), value: Number((v.value && v.value.value) || v.value || 0) }));
        return { name: m.name, period: m.period, status: 'ok', series: values };
      }

      async function fetchFbMetric(m) {
        const url = `${base}/${FB_PAGE_ID}/insights?metric=${m.name}&period=${m.period}&since=${since}&until=${until}&access_token=${encodeURIComponent(PAGE_TOKEN)}`;
        const r = await getJson(url);
        if (!r.ok) return { name: m.name, period: m.period, status: 'error', error: r.data || r.raw || null };
        const series = Array.isArray(r.data?.data) ? r.data.data : [];
        const values = (series.find(x => x.name === m.name)?.values || series[0]?.values || [])
          .map(v => ({ date: String(v.end_time || '').slice(0,10), value: Number((v.value && v.value.value) || v.value || 0) }));
        return { name: m.name, period: m.period, status: 'ok', series: values };
      }

      // Executar coletas em paralelo (séries diárias)
      const [igResults, fbResults] = await Promise.all([
        Promise.all(igMetrics.map(fetchIgMetric)),
        Promise.all(fbMetrics.map(fetchFbMetric))
      ]);

      // Coletas agregadas (28 dias) para aproximar valores exibidos na interface da Meta
      const IG_AGG_METRICS = ['reach','impressions','accounts_engaged','profile_views','total_interactions'];
      const FB_AGG_METRICS = ['page_impressions','page_impressions_unique','page_engaged_users'];

      async function fetchIgAggregate(metricName) {
        const needsTotal = IG_TOTAL_VALUE_METRICS.has(metricName);
        const url = `${base}/${IG_USER_ID}/insights?metric=${metricName}&period=days_28${needsTotal ? '&metric_type=total_value' : ''}&access_token=${encodeURIComponent(META_TOKEN)}`;
        const r = await getJson(url);
        if (!r.ok) return { name: metricName, status: 'error', aggregate28: null, error: r.data || r.raw || null };
        const dataArr = Array.isArray(r.data?.data) ? r.data.data : [];
        const values = dataArr[0]?.values || [];
        const firstVal = values[values.length - 1] || values[0] || {};
        const aggVal = Number((firstVal.value && firstVal.value.value) || firstVal.value || 0);
        return { name: metricName, status: 'ok', aggregate28: aggVal };
      }

      async function fetchFbAggregate(metricName) {
        const url = `${base}/${FB_PAGE_ID}/insights?metric=${metricName}&period=days_28&access_token=${encodeURIComponent(PAGE_TOKEN)}`;
        const r = await getJson(url);
        if (!r.ok) return { name: metricName, status: 'error', aggregate28: null, error: r.data || r.raw || null };
        const dataArr = Array.isArray(r.data?.data) ? r.data.data : [];
        const values = dataArr[0]?.values || [];
        const firstVal = values[values.length - 1] || values[0] || {};
        const aggVal = Number((firstVal.value && firstVal.value.value) || firstVal.value || 0);
        return { name: metricName, status: 'ok', aggregate28: aggVal };
      }

      const [igAggResults, fbAggResults] = await Promise.all([
        Promise.all(IG_AGG_METRICS.map(fetchIgAggregate)),
        Promise.all(FB_AGG_METRICS.map(fetchFbAggregate))
      ]);

      // Indexar agregados para anexar
      const igAggMap = Object.fromEntries(igAggResults.map(r => [r.name, r]));
      const fbAggMap = Object.fromEntries(fbAggResults.map(r => [r.name, r]));

      function enrich(items, aggMap) {
        return items.map(it => {
          const series = it.series || [];
          const sum = series.reduce((a,b)=> a + (b.value||0), 0);
          const last = series[series.length - 1]?.value || 0;
            const avg = series.length ? Math.round((sum / series.length) * 100) / 100 : 0;
          const agg = aggMap[it.name]?.aggregate28 ?? null;
          return { ...it, sumDaily: sum, lastDaily: last, avgDaily: avg, aggregate28: agg };
        });
      }

      const igEnriched = enrich(igResults, igAggMap);
      const fbEnriched = enrich(fbResults, fbAggMap);

      const payload = {
        generatedAt: new Date().toISOString(),
        period: { since: new Date(since*1000).toISOString().slice(0,10), until: new Date(until*1000).toISOString().slice(0,10), days: daysReq },
        instagram: {
          account: igAccount,
          metrics: igEnriched
        },
        facebook: {
          account: fbAccount,
          metrics: fbEnriched
        }
      };

      res.json(payload);
    } catch (e) {
      console.error('[analytics] erro:', e?.stack || e);
      res.status(500).json({ error: 'erro ao coletar analytics' });
    }
  });

  // Debug seguro (admin) para verificar variáveis carregadas sem expor token completo
  app.get('/api/social/insights/debug', authMiddleware, requireRole('admin'), (req, res) => {
    const IG_USER_ID = process.env.IG_BUSINESS_ID || process.env.IG_USER_ID || '';
    const FB_PAGE_ID = process.env.FB_PAGE_ID || process.env.PAGE_ID || '';
    const RAW_TOKEN = process.env.IG_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
    res.json({
      configured: !!(IG_USER_ID && FB_PAGE_ID && RAW_TOKEN),
      ig_business_id_present: !!IG_USER_ID,
      fb_page_id_present: !!FB_PAGE_ID,
      token_present: !!RAW_TOKEN,
      token_prefix: RAW_TOKEN ? RAW_TOKEN.slice(0, 8) : null,
      token_length: RAW_TOKEN ? RAW_TOKEN.length : 0
    });
  });

  // ======= Site Analytics (First-Party) =======
  // Tabela de eventos de pageview (privacidade: sem PII; IP hash + session id)
  db.run(`CREATE TABLE IF NOT EXISTS web_analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    path TEXT NOT NULL,
    session_id TEXT,
    ip_hash TEXT,
    ua TEXT,
    referer TEXT,
    created_at TEXT
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics_events(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_web_analytics_path ON web_analytics_events(path)`);

  // Lazy-init robusto: garante criação da tabela/índices antes de consultas/inserts (evita corrida no boot)
  const webAnalyticsInit = { initialized: false, promise: null };
  function ensureWebAnalyticsReady() {
    if (webAnalyticsInit.initialized) return Promise.resolve();
    if (webAnalyticsInit.promise) return webAnalyticsInit.promise;
    webAnalyticsInit.promise = new Promise((resolve) => {
      // Reexecuta DDL com IF NOT EXISTS; seguro mesmo que já tenha rodado acima
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS web_analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          path TEXT NOT NULL,
          session_id TEXT,
          ip_hash TEXT,
          ua TEXT,
          referer TEXT,
          created_at TEXT
        )`, (err1) => {
          if (err1) console.warn('⚠️  ensureWebAnalyticsReady/table:', err1.message || err1);
          db.run(`CREATE INDEX IF NOT EXISTS idx_web_analytics_date ON web_analytics_events(date)`, (err2) => {
            if (err2) console.warn('⚠️  ensureWebAnalyticsReady/index date:', err2.message || err2);
            db.run(`CREATE INDEX IF NOT EXISTS idx_web_analytics_path ON web_analytics_events(path)`, (err3) => {
              if (err3) console.warn('⚠️  ensureWebAnalyticsReady/index path:', err3.message || err3);
              webAnalyticsInit.initialized = true;
              resolve();
            });
          });
        });
      });
    });
    return webAnalyticsInit.promise;
  }

  function runAsync(sql, params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
    });
  }

  function parseCookieHeader(header) {
    const out = {}; if (!header) return out;
    String(header).split(';').forEach(part => {
      const [k, v] = part.split('='); if (!k) return;
      out[decodeURIComponent(k.trim())] = decodeURIComponent((v||'').trim());
    });
    return out;
  }

  function getClientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
    return (req.socket && req.socket.remoteAddress) || '';
  }

  function getOrSetSessionId(req, res) {
    const cookies = parseCookieHeader(req.headers.cookie || '');
    let sid = cookies['r10sid'];
    if (!sid || sid.length < 8) {
      sid = crypto.randomBytes(16).toString('hex');
      try {
        res.cookie('r10sid', sid, { maxAge: 3600*24*365*3*1000, sameSite: 'lax', httpOnly: false, path: '/' });
      } catch(_) {
        // fallback: set header manual se necessário
        res.setHeader('Set-Cookie', `r10sid=${sid}; Path=/; Max-Age=${3600*24*365*3}; SameSite=Lax`);
      }
    }
    return sid;
  }

  function sha256Hex(s) {
    return crypto.createHash('sha256').update(s).digest('hex');
  }

  // Coleta de pageview (pública; respeita cookies SameSite=Lax)
  app.post('/api/analytics/track', async (req, res) => {
    try {
      await ensureWebAnalyticsReady();
      const pathStr = String((req.body && req.body.path) || '').slice(0, 512);
      if (!pathStr || !pathStr.startsWith('/')) return res.status(400).json({ error: 'path inválido' });
      const ua = String((req.body && req.body.ua) || req.headers['user-agent'] || '').slice(0, 512);
      const referer = String((req.body && req.body.referer) || req.headers['referer'] || '').slice(0, 512);
      const sid = getOrSetSessionId(req, res);
      const ip = getClientIp(req);
      const salt = process.env.ANALYTICS_SALT || 'r10-site';
      const ipHash = sha256Hex(ip + '|' + salt).slice(0, 64);
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0,10);
      const createdAt = now.toISOString();
      try {
        await runAsync(
          'INSERT INTO web_analytics_events (date, path, session_id, ip_hash, ua, referer, created_at) VALUES (?,?,?,?,?,?,?)',
          [date, pathStr, sid, ipHash, ua, referer, createdAt]
        );
        return res.json({ ok: true });
      } catch (err) {
        // Proteção extra: se a tabela ainda não existir por alguma corrida exótica, cria e tenta de novo
        const msg = String(err && (err.message || err));
        if (msg.includes('no such table') || msg.includes('no such table: web_analytics_events')) {
          try {
            await ensureWebAnalyticsReady();
            await runAsync(
              'INSERT INTO web_analytics_events (date, path, session_id, ip_hash, ua, referer, created_at) VALUES (?,?,?,?,?,?,?)',
              [date, pathStr, sid, ipHash, ua, referer, createdAt]
            );
            return res.json({ ok: true });
          } catch (e2) {
            console.error('⚠️ Falha ao registrar pageview após ensure:', e2);
            return res.status(500).json({ ok: false });
          }
        }
        console.error('⚠️ Falha ao registrar pageview:', err);
        return res.status(500).json({ ok: false });
      }
    } catch (e) {
      console.error('❌ /api/analytics/track erro:', e && (e.stack || e));
      res.status(500).json({ error: 'erro ao registrar' });
    }
  });

  // Agregados diários do site (protegido)
  app.get('/api/site/analytics', authMiddleware, async (req, res) => {
    try {
      await ensureWebAnalyticsReady();
      const daysReq = Math.max(7, Math.min(90, parseInt(String(req.query.days || '30')) || 30));
      const today = new Date();
      const dates = [];
      for (let i = daysReq - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        dates.push(d.toISOString().slice(0,10));
      }

      const since = dates[0];
      const until = dates[dates.length - 1];

      function all(sql, params) {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
        });
      }

      const rows = await all(`
        SELECT date,
               COUNT(*) AS pageviews,
               COUNT(DISTINCT session_id) AS sessions,
               COUNT(DISTINCT ip_hash) AS users
        FROM web_analytics_events
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [since, until]);

      const map = new Map(rows.map(r => [r.date, r]));
      const pageviews = [];
      const sessions = [];
      const users = [];
      for (const d of dates) {
        const r = map.get(d) || { pageviews: 0, sessions: 0, users: 0 };
        pageviews.push({ date: d, value: Number(r.pageviews) || 0 });
        sessions.push({ date: d, value: Number(r.sessions) || 0 });
        users.push({ date: d, value: Number(r.users) || 0 });
      }

      const topPages = await all(`
        SELECT path, COUNT(*) as pageviews
        FROM web_analytics_events
        WHERE date BETWEEN ? AND ?
        GROUP BY path
        ORDER BY pageviews DESC
        LIMIT 10
      `, [since, until]);

      res.json({
        generatedAt: new Date().toISOString(),
        period: { since, until, days: daysReq },
        source: 'first-party',
        metrics: {
          pageviews,
          sessions,
          users
        },
        topPages
      });
    } catch (e) {
      console.error('❌ /api/site/analytics erro:', e && (e.stack || e));
      res.status(500).json({ error: 'erro ao coletar site analytics' });
    }
  });

  // ======= Banners (Ads) =======
  db.run(`CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    cliente TEXT,
    imagem TEXT,
    link TEXT,
    posicao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tamanho TEXT,
    status TEXT NOT NULL,
    data_inicio TEXT,
    data_fim TEXT,
    impressoes_max INTEGER,
    cliques_max INTEGER,
    impressoes_atuais INTEGER DEFAULT 0,
    cliques_atuais INTEGER DEFAULT 0,
    cpm REAL,
    cpc REAL,
    valor_total REAL,
    prioridade INTEGER DEFAULT 3,
    conteudo_html TEXT,
    observacoes TEXT,
    created_at TEXT,
    updated_at TEXT
  )`);

  function mapBannerRow(r) {
    return {
      id: String(r.id),
      titulo: r.titulo,
      cliente: r.cliente,
      imagem: r.imagem,
      link: r.link,
      posicao: r.posicao,
      tipo: r.tipo,
      tamanho: r.tamanho,
      status: r.status,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      impressoesMax: r.impressoes_max,
      cliquesMax: r.cliques_max,
      impressoesAtuais: r.impressoes_atuais,
      cliquesAtuais: r.cliques_atuais,
      cpm: r.cpm,
      cpc: r.cpc,
      valorTotal: r.valor_total,
      prioridade: r.prioridade,
      conteudoHtml: r.conteudo_html,
      observacoes: r.observacoes,
      dataCriacao: r.created_at,
      dataAtualizacao: r.updated_at
    };
  }

  function isBannerActive(b) {
    if (!b) return false;
    if (b.status === 'pausado') return false;
    const now = new Date();
    if (b.dataInicio) {
      const ini = new Date(b.dataInicio);
      if (now < ini) return false;
    }
    if (b.dataFim) {
      const fim = new Date(b.dataFim);
      if (now > fim) return false;
    }
    if (b.impressoesMax && b.impressoesAtuais >= b.impressoesMax) return false;
    if (b.cliquesMax && b.cliquesAtuais >= b.cliquesMax) return false;
    return true;
  }

  app.get('/api/banners', authMiddleware, requireRole('admin','editor'), (req, res) => {
    db.all('SELECT * FROM banners ORDER BY prioridade ASC, updated_at DESC, id DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      const items = (rows || []).map(mapBannerRow);
      res.json({ items, total: items.length });
    });
  });

  // Público: retorna apenas banners elegíveis/ativos para renderização no site
  app.get('/api/banners/public', (req, res) => {
    db.all('SELECT * FROM banners ORDER BY prioridade ASC, updated_at DESC, id DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      const items = (rows || []).map(mapBannerRow).filter(isBannerActive);
      res.json({ items, total: items.length });
    });
  });

  app.post('/api/banners', authMiddleware, requireRole('admin','editor'), (req, res) => {
    const b = req.body || {};
    const required = ['titulo','posicao','tipo','status'];
    for (const k of required) if (!b[k]) return res.status(400).json({ error: `campo obrigatório: ${k}` });
    const now = new Date().toISOString();
    const sql = `INSERT INTO banners (titulo,cliente,imagem,link,posicao,tipo,tamanho,status,data_inicio,data_fim,impressoes_max,cliques_max,impressoes_atuais,cliques_atuais,cpm,cpc,valor_total,prioridade,conteudo_html,observacoes,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [b.titulo, b.cliente||null, b.imagem||null, b.link||null, b.posicao, b.tipo, b.tamanho||null, b.status, b.dataInicio||null, b.dataFim||null, b.impressoesMax||null, b.cliquesMax||null, b.impressoesAtuais||0, b.cliquesAtuais||0, b.cpm||null, b.cpc||null, b.valorTotal||null, b.prioridade||3, b.conteudoHtml||null, b.observacoes||null, now, now];
    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      db.get('SELECT * FROM banners WHERE id = ?', [this.lastID], (gErr, row) => {
        if (gErr || !row) return res.status(201).json({ id: String(this.lastID) });
        res.status(201).json(mapBannerRow(row));
      });
    });
  });

  app.put('/api/banners/:id', authMiddleware, requireRole('admin','editor'), (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const b = req.body || {};
    const now = new Date().toISOString();
    db.get('SELECT * FROM banners WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!row) return res.status(404).json({ error: 'não encontrado' });
      const merged = {
        ...row,
        titulo: b.titulo ?? row.titulo,
        cliente: b.cliente ?? row.cliente,
        imagem: b.imagem ?? row.imagem,
        link: b.link ?? row.link,
        posicao: b.posicao ?? row.posicao,
        tipo: b.tipo ?? row.tipo,
        tamanho: b.tamanho ?? row.tamanho,
        status: b.status ?? row.status,
        data_inicio: b.dataInicio ?? row.data_inicio,
        data_fim: b.dataFim ?? row.data_fim,
        impressoes_max: b.impressoesMax ?? row.impressoes_max,
        cliques_max: b.cliquesMax ?? row.cliques_max,
        impressoes_atuais: b.impressoesAtuais ?? row.impressoes_atuais,
        cliques_atuais: b.cliquesAtuais ?? row.cliques_atuais,
        cpm: b.cpm ?? row.cpm,
        cpc: b.cpc ?? row.cpc,
        valor_total: b.valorTotal ?? row.valor_total,
        prioridade: b.prioridade ?? row.prioridade,
        conteudo_html: b.conteudoHtml ?? row.conteudo_html,
        observacoes: b.observacoes ?? row.observacoes
      };
      const sql = `UPDATE banners SET titulo=?,cliente=?,imagem=?,link=?,posicao=?,tipo=?,tamanho=?,status=?,data_inicio=?,data_fim=?,impressoes_max=?,cliques_max=?,impressoes_atuais=?,cliques_atuais=?,cpm=?,cpc=?,valor_total=?,prioridade=?,conteudo_html=?,observacoes=?,updated_at=? WHERE id = ?`;
      const params = [merged.titulo, merged.cliente, merged.imagem, merged.link, merged.posicao, merged.tipo, merged.tamanho, merged.status, merged.data_inicio, merged.data_fim, merged.impressoes_max, merged.cliques_max, merged.impressoes_atuais, merged.cliques_atuais, merged.cpm, merged.cpc, merged.valor_total, merged.prioridade, merged.conteudo_html, merged.observacoes, now, id];
      db.run(sql, params, (uErr) => {
        if (uErr) return res.status(500).json({ error: 'erro de servidor' });
        db.get('SELECT * FROM banners WHERE id = ?', [id], (gErr, nrow) => {
          if (gErr || !nrow) return res.json({ id: String(id) });
          res.json(mapBannerRow(nrow));
        });
      });
    });
  });

  app.delete('/api/banners/:id', authMiddleware, requireRole('admin'), (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    db.run('DELETE FROM banners WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      res.json({ ok: true });
    });
  });

  // Substituir endpoint PUT /api/users/:id existente por versão extendida
  // Localizar o trecho anterior e incluir avatar; se já modificado, ignorar duplicação
  app._router && app._router.stack && (app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/users/:id' && l.route.methods.put)));
  app.put('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
    const targetId = Number(req.params.id);
    const { name, role, avatar } = req.body || {};
    if (!targetId) return res.status(400).json({ error: 'id inválido' });
    if (role && !['admin','editor'].includes(String(role))) return res.status(400).json({ error: 'role inválida' });
    db.get('SELECT id,name,email,role,avatar FROM usuarios WHERE id = ?', [targetId], (err, user) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!user) return res.status(404).json({ error: 'usuário não encontrado' });
      const nextName = typeof name === 'string' && name.trim() ? name.trim() : user.name;
      const nextRole = role ? String(role) : user.role;
      let avatarResult;
      if (avatar !== undefined) {
        avatarResult = validateAvatarInput(avatar);
        if (!avatarResult.ok) return res.status(400).json({ error: avatarResult.error });
      }
      const nextAvatar = avatar === undefined ? user.avatar : (avatarResult ? avatarResult.value : null);
      const applyUpdate = () => {
        db.run('UPDATE usuarios SET name = ?, role = ?, avatar = ? WHERE id = ?', [nextName, nextRole, nextAvatar, targetId], (uErr) => {
          if (uErr) return res.status(500).json({ error: 'erro de servidor' });
          res.json({ id: String(user.id), name: nextName, email: user.email, role: nextRole, avatar: nextAvatar });
        });
      };
      if (user.role === 'admin' && nextRole !== 'admin') {
        db.get("SELECT COUNT(*) as cnt FROM usuarios WHERE role = 'admin'", [], (cErr, row) => {
          if (cErr) return res.status(500).json({ error: 'erro de servidor' });
          if ((row?.cnt || 0) <= 1) return res.status(400).json({ error: 'não é possível rebaixar o último admin' });
          applyUpdate();
        });
      } else {
        applyUpdate();
      }
    });
  });

  // Endpoint para o próprio usuário atualizar name e avatar
  app.put('/api/auth/me', authMiddleware, (req, res) => {
    const meId = Number(req.user.sub);
    const { name, avatar } = req.body || {};
    if (!meId) return res.status(400).json({ error: 'id inválido' });
    db.get('SELECT id,name,email,role,avatar FROM usuarios WHERE id = ?', [meId], (err, user) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!user) return res.status(404).json({ error: 'usuário não encontrado' });
      const nextName = typeof name === 'string' && name.trim() ? name.trim() : user.name;
      let nextAvatar = user.avatar;
      if (avatar !== undefined) {
        const vr = validateAvatarInput(avatar);
        if (!vr.ok) return res.status(400).json({ error: vr.error });
        nextAvatar = vr.value;
      }
      db.run('UPDATE usuarios SET name = ?, avatar = ? WHERE id = ?', [nextName, nextAvatar, meId], (uErr) => {
        if (uErr) return res.status(500).json({ error: 'erro de servidor' });
        res.json({ id: String(user.id), name: nextName, email: user.email, role: user.role, avatar: nextAvatar });
      });
    });
  });

  // ======= Password Recovery =======
  function ensurePasswordResetsTable(cb) {
    db.run(`CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      user_agent TEXT,
      ip TEXT
    )`, [], (err) => cb && cb(err));
  }
  ensurePasswordResetsTable((err)=>{
    if (err) console.error('⚠️ Erro ao garantir tabela password_resets:', err);
    else console.log('🧩 Tabela de password resets pronta');
  });

  // ======= Social Metrics (persistência diária) =======
  function ensureSocialMetricsTable(cb) {
    db.run(`CREATE TABLE IF NOT EXISTS social_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      date TEXT NOT NULL,
      followers INTEGER NOT NULL,
      engagement INTEGER NOT NULL,
      created_at TEXT,
      UNIQUE(source, date)
    )`, [], (err) => cb && cb(err));
  }
  ensureSocialMetricsTable((err)=>{
    if (err) console.error('⚠️ Erro ao garantir tabela social_metrics:', err);
    else console.log('📊 Tabela de social_metrics pronta');
  });

  app.post('/api/auth/request-reset', (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email obrigatório' });
    db.get('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [String(email).trim()], (err, user) => {
      // Resposta genérica mesmo que email não exista
      if (err || !user) {
        return res.json({ ok: true });
      }
      const raw = base64urlBuffer(48);
      const hash = sha256Hex(raw);
      const nowIso = new Date().toISOString();
      const expIso = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h
      db.run('INSERT INTO password_resets (user_id, token_hash, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)',
        [user.id, hash, nowIso, expIso, req.headers['user-agent'] || null, (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString()],
        (insErr) => {
          if (insErr) return res.status(500).json({ error: 'erro de servidor' });
          // Log do link (stub de e-mail)
          const link = `http://localhost:5175/reset?token=${raw}`;
          console.log('📧 [RESET] Link de recuperação gerado para', user.email, '=>', link);
          res.json({ ok: true });
        }
      );
    });
  });

  app.post('/api/auth/reset', (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'token e password são obrigatórios' });
    const pwErr = validatePasswordStrength(password);
    if (pwErr) return res.status(400).json({ error: pwErr });
    const h = sha256Hex(token);
    db.get('SELECT * FROM password_resets WHERE token_hash = ?', [h], (err, row) => {
      if (err || !row) return res.status(400).json({ error: 'token inválido' });
      if (row.used_at) return res.status(400).json({ error: 'token já usado' });
      if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'token expirado' });
      db.get('SELECT * FROM usuarios WHERE id = ?', [row.user_id], (uErr, user) => {
        if (uErr || !user) return res.status(400).json({ error: 'usuário inválido' });
        const newHash = hashPassword(String(password));
        const nowIso = new Date().toISOString();
        db.run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, row.user_id], (u2Err) => {
          if (u2Err) return res.status(500).json({ error: 'erro de servidor' });
          db.run('UPDATE password_resets SET used_at = ? WHERE id = ?', [nowIso, row.id], () => {});
          // Revogar refresh tokens existentes
          db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ?', [nowIso, row.user_id], () => {});
          res.json({ ok: true });
        });
      });
    });
  });

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

      const { model = 'llama-3.1-8b-instant', messages = [], max_tokens = 300, temperature = 0.7 } = req.body || {};
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

  // Função auxiliar para gerar resumo automático
  async function generateSummary(content) {
    try {
      const API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      if (!API_KEY) {
        console.log('⚠️ API key não configurada, resumo não será gerado');
        return null;
      }

      // Limitar conteúdo para evitar tokens excessivos
      const limitedContent = content.substring(0, 2000);
      
      // Usar o endpoint proxy local em vez de chamada direta
      const response = await fetch('http://localhost:3002/api/ai/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Você é um jornalista especializado em criar resumos em bullet points. Responda sempre em português brasileiro. Crie exatamente 4 bullet points curtos e diretos com "•" destacando os pontos principais da notícia. Não use títulos como "Tópico 1" ou numeração. Apenas bullet points simples.'
            },
            {
              role: 'user', 
              content: `Crie um resumo em 4 bullet points desta notícia:\n\n${limitedContent}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error('Erro na API Groq para resumo:', response.status);
        return null;
      }

      const data = await response.json();
      let summary = data.choices[0]?.message?.content?.trim();
      
      if (summary) {
        // Limpar e formatar o resumo com bullet points
        const cleanSummary = summary
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const cleaned = line.trim()
              .replace(/^Tópico \d+:/gi, '') // Removes "Tópico X:"
              .replace(/^\d+\./g, '') // Removes numeração "1."
              .replace(/^-\s*/, '') // Removes traços
              .replace(/^\*\s*/, '') // Removes asteriscos
              .trim();
            
            // Garantir que cada linha tenha bullet point
            return cleaned.startsWith('•') ? cleaned : `• ${cleaned}`;
          })
          .join('\n');
        
        console.log('✅ Resumo com bullet points gerado automaticamente');
        return cleanSummary;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return null;
    }
  }

  // Rota específica para posts mais lidos (ordenados por views)
  app.get('/api/posts/most-read', (req, res) => {
    const limitParam = req.query.limit ?? 10;
    const limit = Math.min(20, Math.max(1, parseInt(limitParam)));
    
    console.log(`📈 Buscando ${limit} posts mais lidos...`);
    
    const sql = `
      SELECT * FROM noticias 
      WHERE titulo IS NOT NULL AND titulo != ''
      ORDER BY COALESCE(views, 0) DESC, published_at DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar posts mais lidos:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      const items = rows.map(mapPost);
      console.log(`📈 Encontrados ${items.length} posts mais lidos`);
      console.log(`📈 Views dos top 3:`, items.slice(0, 3).map(p => ({ titulo: p.titulo.substring(0, 50), views: p.views })));
      
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache de 5 minutos
      res.json(items);
    });
  });

  // Função para completar seções com posts de outras posições
  function completeSection(posicao, items, targetCount) {
    if (items.length >= targetCount) return items.slice(0, targetCount);
    
    const needed = targetCount - items.length;
    const usedIds = items.map(item => item.id);
    
    return new Promise((resolve) => {
      let fallbackQuery;
      let fallbackParams = [];
      
      if (posicao === 'destaque') {
        // Destaque pega da seção geral
        fallbackQuery = `SELECT * FROM noticias WHERE (LOWER(COALESCE(posicao, "")) = ? OR posicao IS NULL OR TRIM(posicao) = "") AND id NOT IN (${usedIds.map(() => '?').join(',') || 'NULL'}) ORDER BY id DESC LIMIT ?`;
        fallbackParams = ['geral', ...usedIds, needed];
      } else if (posicao === 'geral') {
        // Geral pega posts sem posição definida
        fallbackQuery = `SELECT * FROM noticias WHERE (posicao IS NULL OR TRIM(posicao) = "" OR posicao = "") AND id NOT IN (${usedIds.map(() => '?').join(',') || 'NULL'}) ORDER BY id DESC LIMIT ?`;
        fallbackParams = [...usedIds, needed];
      } else {
        return resolve(items);
      }
      
      if (usedIds.length === 0) {
        fallbackQuery = fallbackQuery.replace('AND id NOT IN (NULL)', '');
        fallbackParams = fallbackParams.filter(p => !usedIds.includes(p));
      }
      
      db.all(fallbackQuery, fallbackParams, (err, rows) => {
        if (err) {
          console.error('Erro ao completar seção:', err);
          return resolve(items);
        }
        
        const additionalPosts = rows.map(mapPost);
        const combined = [...items, ...additionalPosts].slice(0, targetCount);
        resolve(combined);
      });
    });
  }

  // Listar posts (com filtros básicos)
  app.get('/api/posts', (req, res) => {
    const limitParam = req.query.limit ?? 50;
    const pageParam = req.query.page ?? 1;
    const posicaoParam = req.query.posicao || req.query.position || undefined;
    const categoriaParam = req.query.categoria || req.query.category || undefined;
    const q = req.query.q;
    const admin = req.query.admin; // ignorado, mas habilita resposta paginada

    let limit = Math.min(100, Math.max(1, parseInt(limitParam)));
    const page = Math.max(1, parseInt(pageParam));
    const offset = (page - 1) * limit;

    // Definir limites específicos para seções especiais
    const targetCounts = {
      'destaque': 5,
      'geral': 7
    };
    
    if (posicaoParam) {
      const normalized = normalizePos(String(posicaoParam));
      if (targetCounts[normalized]) {
        limit = Math.max(limit, targetCounts[normalized]);
      }
    }

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

  db.all(query, [...params, limit, offset], async (err, rows) => {
      if (err) {
        console.error('Erro na consulta /api/posts:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      let items = rows.map(mapPost);
      
      // Completar seções se necessário
      if (posicaoParam && !q && !categoriaParam) {
        const normalized = normalizePos(String(posicaoParam));
        const targetCount = targetCounts[normalized];
        
        if (targetCount && items.length < targetCount) {
          try {
            items = await completeSection(normalized, items, targetCount);
            console.log(`📊 Seção ${normalized} completada: ${items.length}/${targetCount} itens`);
          } catch (completeErr) {
            console.error('Erro ao completar seção:', completeErr);
          }
        }
      }
      
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
  app.put('/api/posts/:id', authMiddleware, requireRole('admin','editor'), (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    
    // Log para debug do tamanho do payload
    const payloadSize = JSON.stringify(req.body).length / 1024 / 1024;
    console.log(`📊 Tamanho do body recebido: ${payloadSize.toFixed(2)} MB`);
    console.log(`📝 [BACKEND] Resumo recebido: ${body.resumo ? body.resumo.substring(0, 100) + '...' : 'VAZIO'}`);

    // Campos que aceitaremos do front
    const desired = {
      titulo: body.titulo ?? body.title,
  subtitulo: body.subtitulo ?? body.subtitle,
      conteudo: body.conteudo ?? body.content,
      categoria: body.categoria ?? body.category,
      chapeu: body.chapeu,
      resumo: body.resumo, // ✅ RESUMO INCLUÍDO!
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

      // ✅ BUSCAR POSIÇÃO ATUAL ANTES DA ATUALIZAÇÃO
      db.get('SELECT posicao FROM noticias WHERE id = ?', [id], (posErr, currentPost) => {
        if (posErr) {
          console.error('Erro ao buscar posição atual:', posErr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        const currentPosition = currentPost ? currentPost.posicao : null;
        console.log(`📍 [DEBUG] Posição atual: ${currentPosition} → Nova posição: ${desired.posicao}`);

        const sql = `UPDATE noticias SET ${sets.join(', ')} WHERE id = ?`;
        console.log(`🔍 [SQL] Executando: ${sql}`);
        console.log(`📝 [SQL] Parâmetros:`, [...params, id]);
        db.run(sql, [...params, id], function (uerr) {
        if (uerr) {
          console.error('Erro ao atualizar post:', uerr);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Post não encontrado' });
        }
        
        // Gerar resumo automaticamente se o conteúdo foi atualizado
        const updatedContent = desired.conteudo;
        if (updatedContent && updatedContent.trim().length > 50) {
          generateSummary(updatedContent).then(resumo => {
            if (resumo) {
              db.run('UPDATE noticias SET resumo = ? WHERE id = ?', [resumo, id], (updateErr) => {
                if (updateErr) {
                  console.error('Erro ao salvar resumo:', updateErr);
                } else {
                  console.log(`📝 Resumo atualizado para post ${id}`);
                }
              });
            }
          }).catch(err => {
            console.error('Erro ao gerar resumo:', err);
          });
        }
        
        // Invalida cache home
        try { if (typeof invalidateHomeCache === 'function') invalidateHomeCache(); } catch(_) {}
        
        // ✅ SÓ REORGANIZAR SE A POSIÇÃO REALMENTE MUDOU DE FORMA SIGNIFICATIVA
        const hasExplicitPosition = desired.posicao && desired.posicao.trim() !== '';
        const normalizedCurrentPosition = normalizePos(currentPosition || '');
        const normalizedDesiredPosition = normalizePos(desired.posicao || '');
        const isChangingToHighPriority = hasExplicitPosition && (normalizedDesiredPosition === 'supermanchete' || normalizedDesiredPosition === 'destaque');
        const isChangingFromHighPriority = currentPosition && (normalizedCurrentPosition === 'supermanchete' || normalizedCurrentPosition === 'destaque');
        const positionActuallyChanged = hasExplicitPosition && normalizedCurrentPosition && normalizedDesiredPosition !== normalizedCurrentPosition;
        
        // 🔒 CONDIÇÃO ULTRA RESTRITIVA: só reorganizar se:
        // 1. A posição realmente mudou (normalized comparison)
        // 2. E está mudando PARA uma posição de alta prioridade (supermanchete/destaque)
        // 3. E não está apenas editando uma matéria que JÁ ESTÁ em alta prioridade
        const shouldReorganize = positionActuallyChanged && isChangingToHighPriority && !isChangingFromHighPriority;
        
        console.log(`🔍 [DEBUG] Análise de reorganização:`);
        console.log(`   - Posição atual: '${currentPosition}' (norm: '${normalizedCurrentPosition}')`);
        console.log(`   - Posição desejada: '${desired.posicao}' (norm: '${normalizedDesiredPosition}')`);
        console.log(`   - Posição mudou: ${positionActuallyChanged}`);
        console.log(`   - Indo para alta prioridade: ${isChangingToHighPriority}`);
        console.log(`   - Vindo de alta prioridade: ${isChangingFromHighPriority}`);
        console.log(`   - DEVE REORGANIZAR: ${shouldReorganize}`);
        
        // ❌ NUNCA reorganizar edições simples em matérias que já estão em posições altas
        if (shouldReorganize && hasExplicitPosition) {
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
        });  // Fecha o db.get que busca posição atual
      });
    });
  });

  // Atualizar posição de um post (usado pelo dashboard)
  app.put('/api/posts/:id/position', authMiddleware, requireRole('admin','editor'), (req, res) => {
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
  app.put('/api/posts/:id/chapeu', authMiddleware, requireRole('admin','editor'), (req, res) => {
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
  app.delete('/api/posts/:id', authMiddleware, requireRole('admin'), (req, res) => {
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
  app.post('/api/posts', authMiddleware, requireRole('admin','editor'), (req, res) => {
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
      
      // Gerar resumo automaticamente se há conteúdo
      if (conteudo && conteudo.trim().length > 50) {
        generateSummary(conteudo).then(resumo => {
          if (resumo) {
            db.run('UPDATE noticias SET resumo = ? WHERE id = ?', [resumo, newId], (updateErr) => {
              if (updateErr) {
                console.error('Erro ao salvar resumo:', updateErr);
              } else {
                console.log(`📝 Resumo salvo para post ${newId}`);
              }
            });
          }
        }).catch(err => {
          console.error('Erro ao gerar resumo:', err);
        });
      }
      
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

  // Incrementar views de um post
  app.post('/api/posts/:id/view', (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }
    
    console.log(`👁️ Incrementando view para post ${id}`);
    
    // Incrementar o contador de views
    const sql = 'UPDATE noticias SET views = COALESCE(views, 0) + 1 WHERE id = ?';
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('Erro ao incrementar views:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Post não encontrado' });
      }
      
      // Buscar o post atualizado para retornar as views atuais
      db.get('SELECT views FROM noticias WHERE id = ?', [id], (gerr, row) => {
        if (gerr) {
          console.error('Erro ao buscar views atualizadas:', gerr);
          return res.json({ success: true, views: null });
        }
        
        const views = row ? row.views : 0;
        console.log(`👁️ Post ${id} agora tem ${views} views`);
        
        res.json({ 
          success: true, 
          views: views,
          message: 'View incrementada com sucesso'
        });
      });
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

  // ===== Rate Limiter simples para login =====
const loginRate = { attempts: new Map(), WINDOW_MS: 5*60*1000, MAX: 10 };
function allowLoginAttempt(ip) {
  const now = Date.now();
  const rec = loginRate.attempts.get(ip) || { hits: [], blockedUntil: 0 };
  if (rec.blockedUntil && rec.blockedUntil > now) return { ok: false, retryAfter: rec.blockedUntil - now };
  rec.hits = rec.hits.filter(t => now - t < loginRate.WINDOW_MS);
  rec.hits.push(now);
  if (rec.hits.length > loginRate.MAX) {
    rec.blockedUntil = now + 10*60*1000;
    loginRate.attempts.set(ip, rec);
    return { ok: false, retryAfter: rec.blockedUntil - now };
  }
  loginRate.attempts.set(ip, rec);
  return { ok: true };
}

// (Re)definição segura das rotas login e register aplicando rate limit e senha forte
try {
  if (app._router && app._router.stack) {
    app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/login' && l.route.methods.post));
    app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/register' && l.route.methods.post));
  }
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email e senha obrigatórios' });
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString();
    const allowed = allowLoginAttempt(ip);
    if (!allowed.ok) return res.status(429).json({ error: 'muitas tentativas, tente mais tarde', retryAfterMs: allowed.retryAfter });
    db.get('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [String(email).trim()], (err, user) => {
      if (err) return res.status(500).json({ error: 'erro de servidor' });
      if (!user) return res.status(401).json({ error: 'credenciais inválidas' });
      if (!verifyPassword(String(password), user.password_hash)) return res.status(401).json({ error: 'credenciais inválidas' });
      const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
      const accessToken = signJWT(payload, ACCESS_TTL_SECONDS);
      const refreshRaw = base64urlBuffer(48);
      const refreshHash = sha256Hex(refreshRaw);
      const now = new Date();
      const created_at = now.toISOString();
      const expires_at = new Date(now.getTime() + (REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)).toISOString();
      const ua = req.headers['user-agent'] || null;
      const ipAddr = ip;
      db.run('INSERT INTO refresh_tokens (user_id, token_hash, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)',
        [user.id, refreshHash, created_at, expires_at, ua, ipAddr], (insErr) => {
          if (insErr) return res.status(500).json({ error: 'erro de servidor' });
          setAuthCookies(res, accessToken, refreshRaw);
          const outUser = { id: String(user.id), name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.created_at };
          res.json({ token: accessToken, user: outUser });
        }
      );
    });
  });

  app.post('/api/auth/register', authMiddleware, requireRole('admin'), (req, res) => {
    const { name, email, password, role = 'editor', avatar } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'campos obrigatórios: name, email, password' });
    if (String(password).length < 8) return res.status(400).json({ error: 'senha muito curta (mínimo 8 caracteres)' });
    const created_at = new Date().toISOString();
    const password_hash = hashPassword(String(password));
    db.run('INSERT INTO usuarios (name,email,password_hash,role,avatar,created_at) VALUES (?,?,?,?,?,?)',
      [name, String(email).toLowerCase(), password_hash, role, avatar || null, created_at], function (err) {
        if (err) {
          if (String(err.message||'').includes('UNIQUE')) return res.status(409).json({ error: 'email já cadastrado' });
          return res.status(500).json({ error: 'erro de servidor' });
        }
        res.status(201).json({ id: String(this.lastID), name, email: String(email).toLowerCase(), role, avatar: avatar || null, createdAt: created_at });
      }
    );
  });
} catch(e) {
  console.error('Falha ao redefinir rotas de auth com rate limit', e);
}

// Endpoint de logout: revoga refresh tokens ativos do usuário e limpa cookies
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const userId = Number(req.user.sub);
  const nowIso = new Date().toISOString();
  db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [nowIso, userId], (err)=>{
    // Limpa cookies independente de erro (melhor esforço)
    try { clearAuthCookies(res); } catch(_) {}
    if (err) return res.status(500).json({ error: 'erro ao revogar tokens' });
    res.json({ ok: true });
  });
});
}