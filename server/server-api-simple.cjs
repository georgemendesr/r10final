console.log('[[bootstrap]] Iniciando carregamento módulos principais...');
const express = require('express');
const cors = require('cors');
let sqlite3; try { sqlite3 = require('sqlite3').verbose(); console.log('[[bootstrap]] sqlite3 carregado'); } catch(e){ console.error('[[bootstrap]] ERRO ao carregar sqlite3:', e.message); process.exit(97); }
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

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

// Porta do servidor: agora lê da variável de ambiente (Integrador define PORT=62013)
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;

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
    // Considerar variações de colunas: imagem, imagemUrl, imagem_url, imagem_destaque
    imagemUrl: (row.imagem_url && String(row.imagem_url).trim()) || (row.imagem && String(row.imagem).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || '/placeholder.svg',
    imagemDestaque: (row.imagem_url && String(row.imagem_url).trim()) || (row.imagem && String(row.imagem).trim()) || (row.imagem_destaque && String(row.imagem_destaque).trim()) || (row.imagemDestaque && String(row.imagemDestaque).trim()) || (row.imagemUrl && String(row.imagemUrl).trim()) || '/placeholder.svg',
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
  // Segurança básica e compressão HTTP
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  // Rate limit global simples
  const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false });
  app.use(globalLimiter);
  const LOG_JSON = process.env.LOG_JSON === '1';
  // ======= Observability Metrics =======
  const metrics = {
    startTime: Date.now(),
    requestsTotal: 0,
    requestsByRoute: {},
    statusCounts: {},
    slowRequests: 0,
    maxLatencyMs: 0,
    authFailures: 0,
    socialCacheHits: 0,
    socialCacheMiss: 0,
    latencyBuckets: { '50':0, '100':0, '300':0, '1000':0, '3000':0, '3000_plus':0 }
  };
  // Cache social unificado: { insights: {payload, fetchedAt}, analytics: {...} }
  const socialCache = { insights: null, analytics: null, ttlMs: 60_000 };
  function metricsLog(event, extra) {
    if (!LOG_JSON) return; console.log(JSON.stringify({ ts: new Date().toISOString(), evt: event, ...extra }));
  }
  app.use((req,res,next)=>{
    const start = process.hrtime.bigint();
    metrics.requestsTotal++;
    let key = req.method + ' ' + (req.path||'');
    key = key.replace(/\/[0-9]+(?![0-9])/g,'/:id');
    metrics.requestsByRoute[key] = (metrics.requestsByRoute[key]||0)+1;
    res.on('finish', ()=>{
      const durMs = Number(process.hrtime.bigint() - start)/1e6;
      const sc = res.statusCode;
      metrics.statusCounts[sc] = (metrics.statusCounts[sc]||0)+1;
      if (durMs > 1000) metrics.slowRequests++;
      if (durMs > metrics.maxLatencyMs) metrics.maxLatencyMs = durMs;
  // Buckets
  if (durMs <= 50) metrics.latencyBuckets['50']++; else
  if (durMs <= 100) metrics.latencyBuckets['100']++; else
  if (durMs <= 300) metrics.latencyBuckets['300']++; else
  if (durMs <= 1000) metrics.latencyBuckets['1000']++; else
  if (durMs <= 3000) metrics.latencyBuckets['3000']++; else metrics.latencyBuckets['3000_plus']++;
      metricsLog('http_request', { m: req.method, p: req.path, s: sc, ms: Math.round(durMs) });
    });
    next();
  });

  // Endpoint público leve de runtime metrics (sem info sensível)
  app.get('/api/metrics/runtime', (req,res)=>{
    const mem = process.memoryUsage ? process.memoryUsage() : null;
    const summary = {
      uptimeSeconds: Math.round((Date.now() - metrics.startTime)/1000),
      memoryMB: mem ? {
        rss: +(mem.rss/1024/1024).toFixed(2),
        heapUsed: +(mem.heapUsed/1024/1024).toFixed(2)
      } : null,
      requests: {
        total: metrics.requestsTotal,
        '2xx': Object.entries(metrics.statusCounts).filter(([c])=>/^2/.test(c)).reduce((a,[,v])=>a+v,0),
        '4xx': Object.entries(metrics.statusCounts).filter(([c])=>/^4/.test(c)).reduce((a,[,v])=>a+v,0),
        '5xx': Object.entries(metrics.statusCounts).filter(([c])=>/^5/.test(c)).reduce((a,[,v])=>a+v,0)
      },
      slowRequests: metrics.slowRequests,
      maxLatencyMs: Math.round(metrics.maxLatencyMs)
    };
    res.json(summary);
  });

  // Endpoint admin para forçar migração de 'noticias'
  app.post('/api/admin/migrate-noticias', authMiddleware, requireRole('admin'), (req,res)=>{
    try {
      console.log('🛠️  [MIGRATE] Iniciando migração via endpoint...');
      db.all('PRAGMA table_info(noticias)', [], (perr, rows)=>{
        if (perr) return res.status(500).json({ error:'PRAGMA failed', details: perr.message });
        const existing = new Set(rows.map(r=>r.name));
        const steps = [];
        if (!existing.has('published_at')) steps.push("ALTER TABLE noticias ADD COLUMN published_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        if (!existing.has('created_at')) steps.push("ALTER TABLE noticias ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        if (!existing.has('updated_at')) steps.push("ALTER TABLE noticias ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        if (!existing.has('views')) steps.push("ALTER TABLE noticias ADD COLUMN views INTEGER DEFAULT 0");
        if (!existing.has('status')) steps.push("ALTER TABLE noticias ADD COLUMN status VARCHAR(20) DEFAULT 'ativo'");

        let done = 0; const total = steps.length;
        if (total === 0) {
          finalize();
        } else {
          steps.forEach(sql => {
            db.run(sql, err=>{
              if (err && !/duplicate column|already exists/i.test(err.message)) {
                console.warn('⚠️  Falha ao aplicar:', sql, err.message);
              } else {
                console.log('✅ Migração aplicada/ignorada:', sql.split(' ')[3]);
              }
              if (++done === total) finalize();
            });
          });
        }

        function finalize(){
          const fixes = [
            'UPDATE noticias SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)',
            'UPDATE noticias SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)',
            'UPDATE noticias SET published_at = COALESCE(published_at, created_at, CURRENT_TIMESTAMP)',
            'UPDATE noticias SET views = COALESCE(views,0)',
            "UPDATE noticias SET status = COALESCE(status,'ativo')"
          ];
          let fdone = 0;
          fixes.forEach(s=> db.run(s, ()=>{ if (++fdone===fixes.length) createIndex(); }));
          function createIndex(){
            db.run('CREATE INDEX IF NOT EXISTS idx_noticias_posicao_published ON noticias(posicao, published_at)', ()=>{
              console.log('🏁 [MIGRATE] Finalizado');
              res.json({ ok:true, applied: steps, normalized: true });
            });
          }
        }
      });
    } catch(e){
      console.error('💥 MIGRATION endpoint error', e);
      res.status(500).json({ error:'migration failed', details: e.message });
    }
  });

  // Endpoint Prometheus simples
  app.get('/metrics', (req,res)=>{
    res.set('Content-Type','text/plain; version=0.0.4');
    const mem = process.memoryUsage ? process.memoryUsage() : null;
    const lines = [];
    const upSeconds = (Date.now() - metrics.startTime)/1000;
    lines.push('# HELP app_uptime_seconds Uptime do processo em segundos');
    lines.push('# TYPE app_uptime_seconds gauge');
    lines.push(`app_uptime_seconds ${upSeconds.toFixed(0)}`);
    lines.push('# HELP http_requests_total Total de requisições recebidas');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${metrics.requestsTotal}`);
    ['2','4','5'].forEach(cl => {
      const val = Object.entries(metrics.statusCounts).filter(([c])=>c.startsWith(cl)).reduce((a,[,v])=>a+v,0);
      lines.push(`http_responses_status_total{class="${cl}xx"} ${val}`);
    });
    lines.push('# HELP http_slow_requests_total Requisições >1s');
    lines.push('# TYPE http_slow_requests_total counter');
    lines.push(`http_slow_requests_total ${metrics.slowRequests}`);
    lines.push('# HELP http_request_max_latency_ms Maior latência observada em ms');
    lines.push('# TYPE http_request_max_latency_ms gauge');
    lines.push(`http_request_max_latency_ms ${Math.round(metrics.maxLatencyMs)}`);
    lines.push('# HELP http_request_latency_bucket Requisições por faixas de latência (ms)');
    lines.push('# TYPE http_request_latency_bucket counter');
    const b = metrics.latencyBuckets;
    lines.push(`http_request_latency_bucket{le="50"} ${b['50']}`);
    lines.push(`http_request_latency_bucket{le="100"} ${b['50']+b['100']}`);
    lines.push(`http_request_latency_bucket{le="300"} ${b['50']+b['100']+b['300']}`);
    lines.push(`http_request_latency_bucket{le="1000"} ${b['50']+b['100']+b['300']+b['1000']}`);
    lines.push(`http_request_latency_bucket{le="3000"} ${b['50']+b['100']+b['300']+b['1000']+b['3000']}`);
    lines.push(`http_request_latency_bucket{le="+Inf"} ${b['50']+b['100']+b['300']+b['1000']+b['3000']+b['3000_plus']}`);
    if (mem) {
      lines.push('# HELP process_resident_memory_bytes RSS em bytes');
      lines.push('# TYPE process_resident_memory_bytes gauge');
      lines.push(`process_resident_memory_bytes ${mem.rss}`);
      lines.push('# HELP process_heap_used_bytes Heap usado em bytes');
      lines.push('# TYPE process_heap_used_bytes gauge');
      lines.push(`process_heap_used_bytes ${mem.heapUsed}`);
    }
    res.send(lines.join('\n')+'\n');
  });
  
  // Configuração CORS específica para o frontend
  const corsOptions = {
    origin: (origin, callback) => {
      const staticAllowed = new Set([
        'http://localhost:5175', 'http://127.0.0.1:5175',
        'http://localhost:5176', 'http://127.0.0.1:5176',
        'http://localhost:5177', 'http://127.0.0.1:5177',
        'http://localhost:3000', 'http://127.0.0.1:3000',
        // Domínios de produção
        'https://r10piaui.com',
        'https://www.r10piaui.com',
        'https://r10piaui.onrender.com'
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

  // (Removido bloco antigo de uploads - agora toda lógica centralizada em UPLOADS_DIR persistente mais abaixo)

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
  
  // ===== Logger com níveis =====
  const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const LEVELS = ['error','warn','info','debug'];
  function shouldLog(l){ return LEVELS.indexOf(l) <= LEVELS.indexOf(LOG_LEVEL); }
  const logger = {
    error: (...a)=> shouldLog('error') && console.error('[err]', ...a),
    warn:  (...a)=> shouldLog('warn')  && console.warn('[warn]', ...a),
    info:  (...a)=> shouldLog('info')  && console.log('[info]', ...a),
    debug: (...a)=> shouldLog('debug') && console.debug('[dbg]', ...a)
  };

  app.locals.logger = logger;

  const startedAt = Date.now();
  // Health check estendido
  app.get('/api/health', async (req,res)=> {
    const now = Date.now();
    const uptimeMs = now - startedAt;
    // Verificar DB com uma consulta rápida
    let dbOk = true; let dbLatencyMs = null; let postsCount = null; let usersCount = null;
    const tDb = Date.now();
    try {
      await new Promise((resolve,reject)=> db.get('SELECT COUNT(*) as c FROM noticias', [], (e,r)=> e?reject(e): (postsCount=r?.c||0, resolve(null))));
      await new Promise((resolve,reject)=> db.get('SELECT COUNT(*) as c FROM usuarios', [], (e,r)=> e?reject(e): (usersCount=r?.c||0, resolve(null))));
    } catch(e) { dbOk = false; logger.error('health db check fail', e?.message||e); }
    dbLatencyMs = Date.now() - tDb;

    // Social cache (se existir) — tolerante
    let socialCacheStats = null;
    try {
      if (typeof socialCache === 'object') {
        socialCacheStats = {
          hasInsights: !!socialCache.insights,
          hasAnalytics: !!socialCache.analytics,
          lastInsightsAt: socialCache.insights?.fetchedAt || null,
          lastAnalyticsAt: socialCache.analytics?.fetchedAt || null,
          ttlMs: 60_000
        };
      }
    } catch(_) {}

    const payload = {
      status: dbOk ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      uptimeMs,
      db: { ok: dbOk, latencyMs: dbLatencyMs, postsCount, usersCount },
      cache: { home: { has: !!app.locals.homeCache?.body, expiresAt: app.locals.homeCache?.expiresAt || null } },
      social: socialCacheStats,
      memory: process.memoryUsage ? {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal
      } : null,
      pid: process.pid
    };
    const statusCode = dbOk ? 200 : 503;
    res.status(statusCode).json(payload);
  });

  // Readiness probe (para orquestradores / balanceadores) – foco em dependências críticas
  app.get('/api/readiness', async (req,res) => {
    const start = Date.now();
    const checks = { db: { ok:false }, disk: { ok:false }, backup: { ok:false }, migrations: { ok:false } };
    const diskThreshold = parseInt(process.env.DISK_ALERT_THRESHOLD || '70', 10);
    // DB check simples
    try {
      await new Promise((resolve,reject)=> db.get('SELECT 1 as x',[], (e)=> e?reject(e):resolve()));
      checks.db.ok = true;
    } catch(e) { checks.db.error = e.message; }
    // Uso de disco real (percentual) – implementação simplificada multiplataforma
    async function getDiskUsage() {
      return new Promise((resolve) => {
        if (process.platform === 'win32') {
          const drive = path.parse(process.cwd()).root.replace('\\','');
          const { exec } = require('child_process');
            exec(`wmic logicaldisk where DeviceID='${drive}' get Size,FreeSpace /format:value`, { windowsHide:true }, (err, stdout) => {
            if (err) return resolve(null);
            let free=0,size=0; stdout.split(/\r?\n/).forEach(l=>{ const [k,v]=l.split('='); if(k==='FreeSpace') free=parseInt(v||'0'); if(k==='Size') size=parseInt(v||'0'); });
            if (!size) return resolve(null);
            resolve({ free, size, used: size-free, usedPercent: (size-free)/size*100 });
          });
        } else {
          const { exec } = require('child_process');
          exec('df -k .', (err, stdout) => {
            if (err) return resolve(null);
            const lines = stdout.trim().split(/\n/); const parts = lines[lines.length-1].split(/\s+/);
            const size = parseInt(parts[1],10)*1024; const used = parseInt(parts[2],10)*1024; const free = parseInt(parts[3],10)*1024;
            const usedPercent = used/size*100; resolve({ free,size,used,usedPercent });
          });
        }
      });
    }
    try {
      const du = await getDiskUsage();
      if (du) {
        checks.disk.usedPercent = +du.usedPercent.toFixed(2);
        checks.disk.sizeBytes = du.size;
        checks.disk.freeBytes = du.free;
        checks.disk.threshold = diskThreshold;
        checks.disk.ok = du.usedPercent < diskThreshold;
      } else {
        checks.disk.error = 'disk info unavailable';
      }
    } catch(e){ checks.disk.error = e.message; }
    // Backup: ler manifest
    try {
      const manifestPath = path.join(process.cwd(),'backups','manifest.json');
      if (fs.existsSync(manifestPath)) {
        const m = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
        checks.backup.manifestAgeMinutes = (Date.now() - new Date(m.generatedAt).getTime())/60000;
        checks.backup.ok = checks.backup.manifestAgeMinutes < 1440; // < 24h
      } else {
        checks.backup.error = 'manifest ausente';
      }
    } catch(e){ checks.backup.error = e.message; }
    // Migrations table (já criada) -> verificar se existe alguma migração pendente (placeholder)
    try {
      await new Promise((resolve)=> db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations_applied'",[],()=>resolve()));
      checks.migrations.ok = true; // Sem sistema de versão avançado implementado
    } catch(e){ checks.migrations.error = e.message; }
    const ok = Object.values(checks).every(c=>c.ok);
    res.status(ok?200:503).json({ status: ok?'ready':'degraded', durationMs: Date.now()-start, checks });
  });
  
  // Configurar charset UTF-8 para todas as respostas da API
  app.use('/api', (req, res, next) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    next();
  });
  
  // Configurar limites de payload para suportar imagens base64
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  
  // Middleware de logging request/response (respeita LOG_LEVEL)
  app.use((req,res,next)=>{
    const t = Date.now();
    if (shouldLog('debug')) logger.debug('REQ', req.method, req.url);
    res.on('finish', ()=> {
      if (shouldLog('info')) logger.info('RES', req.method, req.url, res.statusCode, (Date.now()-t)+'ms');
    });
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

  // 🎯 CAMINHO DO BANCO E UPLOADS: Usar disco persistente no Render
  const DATA_DIR = process.env.RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'data');
  const DB_FILENAME = 'r10piaui.db';
  const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
  
  // Garantir que os diretórios existem
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✅ Diretório de dados criado:', DATA_DIR);
  }
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('✅ Diretório de uploads criado:', UPLOADS_DIR);
  }
  
  const resolvedDbPath = dbPath || process.env.SQLITE_DB_PATH || path.join(DATA_DIR, DB_FILENAME);
  const db = new sqlite3.Database(resolvedDbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar ao banco:', err);
      process.exit(1);
    }
    console.log('✅ Conectado ao banco SQLite:', resolvedDbPath);
    console.log('📁 Diretório de dados:', DATA_DIR);
    console.log('📂 Diretório de uploads:', UPLOADS_DIR);
    console.log('💾 Persistente:', process.env.RENDER ? 'SIM (Render Disk)' : 'LOCAL');
    
    // 🔧 CORREÇÃO URGENTE: Verificar e adicionar colunas faltantes
    console.log('🔧 Verificando estrutura do banco...');
    const columnsToAdd = [
      { sql: "ALTER TABLE noticias ADD COLUMN published_at DATETIME DEFAULT CURRENT_TIMESTAMP", name: "published_at" },
      { sql: "ALTER TABLE noticias ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", name: "created_at" },
      { sql: "ALTER TABLE noticias ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", name: "updated_at" },
      { sql: "ALTER TABLE noticias ADD COLUMN status VARCHAR(20) DEFAULT 'ativo'", name: "status" },
      { sql: "ALTER TABLE noticias ADD COLUMN chapeu TEXT", name: "chapeu" },
      { sql: "ALTER TABLE noticias ADD COLUMN views INTEGER DEFAULT 0", name: "views" }
    ];
    
    columnsToAdd.forEach(col => {
      db.run(col.sql, (err) => {
        if (err) {
          if (err.message.includes('duplicate column')) {
            console.log(`✅ Coluna ${col.name} já existe`);
          } else {
            console.error(`⚠️ Erro ao adicionar coluna ${col.name}:`, err.message);
          }
        } else {
          console.log(`✅ Coluna ${col.name} adicionada com sucesso`);
        }
      });
    });
  });
  
  // Configurar SQLite para UTF-8
  db.run("PRAGMA encoding = 'UTF-8'");
  
  app.locals.db = db; // expor conexão para testes/cleanup
  
  // 🖼️ CONFIGURAR MULTER PARA UPLOAD DE IMAGENS
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      // Gerar nome único: timestamp-random.ext
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
  
  // Validar tipo e tamanho de imagem
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
      // Aceitar apenas imagens
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas (JPG, PNG, GIF, WebP)'));
      }
    }
  });
  
  // Servir imagens estáticas do diretório de uploads
  app.use('/uploads', express.static(UPLOADS_DIR, {
    maxAge: '7d', // Cache de 7 dias para imagens
    etag: true
  }));
  console.log('✅ Rota estática /uploads configurada');

  // ======= INICIALIZAR / MIGRAR TABELA NOTICIAS =======
  db.serialize(()=>{
    db.run(`CREATE TABLE IF NOT EXISTS noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      subtitulo TEXT,
      chapeu TEXT,
      resumo TEXT,
      conteudo TEXT NOT NULL,
      autor TEXT NOT NULL,
      categoria TEXT NOT NULL,
      posicao TEXT,
      imagem TEXT,
      imagemUrl TEXT,
      imagem_destaque TEXT,
      slug TEXT,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )`, (err)=>{
      if (err) console.error('⚠️ Erro ao garantir tabela noticias:', err); else console.log('📰 Tabela noticias verificada');
    });

    // Migração incremental de colunas faltantes (idempotente)
    db.all('PRAGMA table_info(noticias)', [], (perr, rows)=>{
      if (perr) { console.error('Erro PRAGMA table_info noticias:', perr); return; }
      const existing = new Set(rows.map(r=>r.name));
      const addColumn = (name, ddl) => {
        if (!existing.has(name)) {
          db.run(`ALTER TABLE noticias ADD COLUMN ${name} ${ddl}`, err=>{
            if (err) console.error(`❌ Falha ao adicionar coluna ${name}:`, err.message); else console.log(`✅ Coluna adicionada: ${name}`);
          });
        }
      };
      addColumn('subtitulo','TEXT');
      addColumn('chapeu','TEXT');
      addColumn('resumo','TEXT');
      addColumn('imagem','TEXT');
      addColumn('imagemUrl','TEXT');
      addColumn('imagem_destaque','TEXT');
      addColumn('slug','TEXT');
      addColumn('published_at','DATETIME DEFAULT CURRENT_TIMESTAMP');
      addColumn('views','INTEGER DEFAULT 0');
    });

    // Índices essenciais
    db.run(`CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_noticias_posicao ON noticias(posicao)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_noticias_published ON noticias(published_at)`);
  });

  // ======= AUTH (local) =======
  const JWT_SECRET = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET ausente ou fraco: defina uma string >=32 chars em produção');
    }
  } else {
    // Em desenvolvimento permitir fallback controlado mas avisar
    if (!JWT_SECRET) {
      console.warn('[seguranca] JWT_SECRET não definido; usando fallback DEV inseguro');
    }
  }
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
      const prod = process.env.NODE_ENV === 'production';
      const base = { httpOnly: true, sameSite: prod ? 'strict' : 'lax', secure: prod, path: '/' };
      res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TTL_SECONDS * 1000 });
      res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000 });
    } catch (_) {}
  }

  function clearAuthCookies(res) {
    try {
      const prod = process.env.NODE_ENV === 'production';
      const base = { httpOnly: true, sameSite: prod ? 'strict' : 'lax', secure: prod, expires: new Date(0) };
      res.cookie(ACCESS_COOKIE, '', { ...base, path: '/' });
      res.cookie(REFRESH_COOKIE, '', { ...base, path: '/' });
      res.cookie(ACCESS_COOKIE, '', { ...base, path: '/api/auth' });
      res.cookie(REFRESH_COOKIE, '', { ...base, path: '/api/auth' });
    } catch (_) {}
  }

  function authMiddleware(req, res, next) {
    // Middleware de autenticação: tenta obter token de Authorization ou cookie
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
        console.log('[auth] r10_access presente (len=', String(cookies[ACCESS_COOKIE]||'').length, ')');
      }
      if (cookies && cookies[ACCESS_COOKIE]) token = cookies[ACCESS_COOKIE];
    }
    const payload = token ? verifyJWT(token) : null;
    if (!payload) {
      metrics.authFailures++;
      return res.status(401).json({ error: 'unauthorized' });
    }
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

  // Limiter específico login (IP + email combinados)
  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const email = (req.body && req.body.email) ? String(req.body.email).toLowerCase() : '';
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString();
      return ip + '|' + email;
    }
  });

  // Rotas de autenticação
  app.post('/api/auth/login', loginLimiter, (req, res) => {
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

  // Rota de refresh token: rotaciona refresh e devolve novo access token
  app.post('/api/auth/refresh', (req, res) => {
    try { console.log('[auth][refresh] chamada recebida'); } catch(_) {}
    try {
      const cookies = parseCookies(req);
      const raw = cookies[REFRESH_COOKIE];
      if (!raw || raw.length < 20) {
        metrics.authFailures++;
        return res.status(401).json({ error: 'missing refresh token' });
      }
      const hash = sha256Hex(raw);
      const nowIso = new Date().toISOString();
      db.get('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL', [hash], (err, row) => {
        if (err) return res.status(500).json({ error: 'server error' });
        if (!row) {
          metrics.authFailures++;
          clearAuthCookies(res);
          return res.status(401).json({ error: 'invalid refresh token' });
        }
        if (row.expires_at <= nowIso) {
          metrics.authFailures++;
          db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?', [nowIso, row.id], ()=>{});
          clearAuthCookies(res);
          return res.status(401).json({ error: 'expired refresh token' });
        }
        db.get('SELECT id,name,email,role,avatar,created_at FROM usuarios WHERE id = ?', [row.user_id], (uErr, user) => {
          if (uErr) return res.status(500).json({ error: 'server error' });
          if (!user) {
            db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?', [nowIso, row.id], ()=>{});
            return res.status(401).json({ error: 'user not found' });
          }
          const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
          const newAccess = signJWT(payload, ACCESS_TTL_SECONDS);
          const newRaw = base64urlBuffer(48);
          const newHash = sha256Hex(newRaw);
          const created_at = nowIso;
          const expires_at = new Date(Date.now() + (REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)).toISOString();
          db.run('BEGIN TRANSACTION');
          db.run('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?', [nowIso, row.id], ()=>{});
          db.run('INSERT INTO refresh_tokens (user_id, token_hash, created_at, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)',
            [user.id, newHash, created_at, expires_at, req.headers['user-agent']||null, (req.headers['x-forwarded-for']||req.socket.remoteAddress||'').toString()], (insErr) => {
              db.run('COMMIT');
              if (insErr) return res.status(500).json({ error: 'server error' });
              setAuthCookies(res, newAccess, newRaw);
              // Opcional: retornar user para frontend que espera mesmo shape do login
              const outUser = { id: String(user.id), name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.created_at };
              res.json({ token: newAccess, user: outUser });
            }
          );
        });
      });
    } catch (e) {
      return res.status(500).json({ error: 'server error' });
    }
  });

  // Rota de ping para verificar se a versão nova está ativa
  app.get('/api/auth/ping', (req,res)=>{
    res.json({ ok: true, ts: Date.now(), hasRefreshRoute: true, publicSocialDebug: SOCIAL_PUBLIC_DEBUG });
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
  const SOCIAL_PUBLIC_DEBUG = process.env.SOCIAL_PUBLIC_DEBUG === '1';
  app.get('/api/social/insights', SOCIAL_PUBLIC_DEBUG ? async (req,res,next)=>{ next(); } : authMiddleware, async (req, res) => {
    // Checagem de cache baseada em timestamp
    const nowTs = Date.now();
    if (socialCache.insights && (nowTs - new Date(socialCache.insights.fetchedAt).getTime()) < socialCache.ttlMs) {
      metrics.socialCacheHits++;
      try { console.log('[insights] cache HIT'); } catch(_) {}
      return res.json(socialCache.insights.payload);
    }
    metrics.socialCacheMiss++;
    try { console.log('[insights] cache MISS'); } catch(_) {}
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
      // Atualiza cache de insights
      try {
        socialCache.insights = { payload, fetchedAt: new Date().toISOString() };
      } catch(_) {}

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
  // ATUALIZADO: 01/10/2025 - Removida métrica 'impressions' (não existe mais na API v22.0)
  // Retorna várias métricas reais possíveis para IG e FB, com período configurável (7-90 dias)
  console.log('[analytics] 🔄 Endpoint /api/social/analytics carregado - VERSÃO ATUALIZADA SEM IMPRESSIONS');
  app.get('/api/social/analytics', SOCIAL_PUBLIC_DEBUG ? async (req,res,next)=>{ next(); } : authMiddleware, async (req, res) => {
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

      // Coleções de métricas a tentar (APENAS métricas válidas na API v22.0) - ATUALIZADO 01/10/2025
      // IMPORTANTE: impressions FOI REMOVIDA pela Meta - não existe mais!
      // DESCOBERTA: likes, comments, etc só funcionam com period=lifetime, NÃO com period=day
      const igMetrics = [
        { name: 'reach', period: 'day' },  // Funciona com day
        { name: 'accounts_engaged', period: 'lifetime' },  // Requer lifetime
        { name: 'profile_views', period: 'day' },  // Funciona com day
        { name: 'total_interactions', period: 'lifetime' },  // Requer lifetime
      ];
      console.log('[analytics][IG] Métricas configuradas:', igMetrics.map(m => `${m.name}(${m.period})`).join(', '));
      const IG_TOTAL_VALUE_METRICS = new Set([]);

      const fbMetrics = [
        { name: 'page_impressions', period: 'day' },
        { name: 'page_impressions_unique', period: 'day' },
        { name: 'page_engaged_users', period: 'day' },
        { name: 'page_fan_adds_unique', period: 'day' },
        { name: 'page_fan_removes_unique', period: 'day' }
      ];

      async function fetchIgMetric(m) {
        const needsTotal = IG_TOTAL_VALUE_METRICS.has(m.name);
        // lifetime não aceita since/until, apenas period=lifetime
        const timeParams = m.period === 'lifetime' ? '' : `&since=${since}&until=${until}`;
        const url = `${base}/${IG_USER_ID}/insights?metric=${m.name}&period=${m.period}${timeParams}${needsTotal ? '&metric_type=total_value' : ''}&access_token=${encodeURIComponent(META_TOKEN)}`;
        console.log(`[analytics][IG] Buscando métrica: ${m.name} (${m.period})${needsTotal ? ' (total_value)' : ''}`);
        const r = await getJson(url);
        if (!r.ok) {
          console.log(`[analytics][IG] ❌ ${m.name} ERRO ${r.status}:`, JSON.stringify(r.data || r.raw || null).slice(0, 200));
          return { name: m.name, period: m.period, status: 'error', error: r.data || r.raw || null };
        }
        const series = Array.isArray(r.data?.data) ? r.data.data : [];
        // Para lifetime, pegar o valor único; para day, pegar série temporal
        const values = m.period === 'lifetime' 
          ? [{ date: new Date().toISOString().slice(0,10), value: Number(series[0]?.values?.[0]?.value || 0) }]
          : (series.find(x => x.name === m.name)?.values || series[0]?.values || [])
              .map(v => ({ date: String(v.end_time || '').slice(0,10), value: Number((v.value && v.value.value) || v.value || 0) }));
        console.log(`[analytics][IG] ✅ ${m.name} OK: ${values.length} pontos, sum=${values.reduce((a,b)=>a+b.value,0)}`);
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
      const IG_AGG_METRICS = ['reach','accounts_engaged','profile_views','total_interactions','likes','comments','website_clicks'];
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
    const insertSql = `INSERT INTO banners (titulo,cliente,imagem,link,posicao,tipo,tamanho,status,data_inicio,data_fim,impressoes_max,cliques_max,impressoes_atuais,cliques_atuais,cpm,cpc,valor_total,prioridade,conteudo_html,observacoes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [b.titulo, b.cliente||null, b.imagem||null, b.link||null, b.posicao, b.tipo, b.tamanho||null, b.status, b.dataInicio||null, b.dataFim||null, b.impressoesMax||null, b.cliquesMax||null, b.impressoesAtuais||0, b.cliquesAtuais||0, b.cpm||null, b.cpc||null, b.valorTotal||null, b.prioridade||3, b.conteudoHtml||null, b.observacoes||null, now, now];
    db.run(insertSql, params, function (err) {
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
  const { validateAvatarInput } = require('./helpers/avatar-validator.cjs');
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
        const { validateAvatarInput } = require('./helpers/avatar-validator.cjs');
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

  // ======= Migrations Infra (lightweight) =======
  // Cria tabela de controle se não existir. Migrations são arquivos .sql em ./migrations nomeados AAAAMMDDHHMM_descricao.sql
  function ensureMigrationsTable(cb) {
    db.run(`CREATE TABLE IF NOT EXISTS migrations_applied (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )`, [], (err)=> cb && cb(err));
  }
  ensureMigrationsTable(err => {
    if (err) console.error('⚠️ Erro ao garantir tabela migrations_applied:', err);
    else console.log('🗂️  Tabela migrations_applied pronta');
  });

  // Runner interno opcional: se variável RUN_MIGRATIONS=1 estiver setada no start, aplicamos automaticamente.
  async function autoRunMigrationsIfRequested() {
    if (process.env.RUN_MIGRATIONS !== '1') return; // opt-in
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[migrations] diretório não existe, ignorando');
      return;
    }
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    if (!files.length) {
      console.log('[migrations] nenhuma migration encontrada');
      return;
    }
    console.log('[migrations] iniciando verificação de', files.length, 'arquivos');
    const applied = await new Promise((resolve, reject) => {
      db.all('SELECT name FROM migrations_applied', [], (err, rows) => {
        if (err) return reject(err); resolve(new Set(rows.map(r=>r.name))); }); });
    for (const file of files) {
      if (applied.has(file)) { continue; }
      const full = path.join(migrationsDir, file);
      const sqlRaw = fs.readFileSync(full, 'utf8');
      // Suporta múltiplos statements separados por ; ignorando linhas vazias e comentários --
      const statements = sqlRaw
        .split(/;\s*\n|;\r?\n/g)
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      console.log(`[migrations] aplicando ${file} (${statements.length} statements)`);
      try {
        await new Promise((resolve, reject) => db.run('BEGIN', [], e=> e?reject(e):resolve()));
        for (const st of statements) {
          await new Promise((resolve, reject) => db.run(st, [], err => err?reject(err):resolve()));
        }
        await new Promise((resolve, reject) => db.run('INSERT INTO migrations_applied (name, applied_at) VALUES (?, ?)', [file, new Date().toISOString()], err=> err?reject(err):resolve()));
        await new Promise((resolve, reject) => db.run('COMMIT', [], e=> e?reject(e):resolve()));
        console.log(`[migrations] ${file} OK`);
      } catch (e) {
        console.error(`[migrations] falha em ${file}:`, e.message || e);
        await new Promise((resolve) => db.run('ROLLBACK', [], ()=> resolve()));
        break; // para evitar aplicar seguintes se uma falhar
      }
    }
  }
  autoRunMigrationsIfRequested();

  // ======= /api/metrics =======
  app.get('/api/metrics', authMiddleware, requireRole('admin'), (req,res)=>{
    const upSec = (Date.now()-metrics.startTime)/1000;
    const accept = req.headers['accept']||'';
    if (accept.includes('text/plain')) {
      let out = '';
      out += `app_uptime_seconds ${upSec.toFixed(0)}\n`;
      out += `app_requests_total ${metrics.requestsTotal}\n`;
      Object.entries(metrics.statusCounts).forEach(([c,v])=>{ out += `app_http_status_total{code="${c}"} ${v}\n`; });
      Object.entries(metrics.requestsByRoute).forEach(([r,v])=>{ const esc=r.replace(/"/g,''); out += `app_http_requests_route_total{route="${esc}"} ${v}\n`; });
      out += `app_http_slow_requests_total ${metrics.slowRequests}\n`;
      out += `app_http_max_latency_ms ${Math.round(metrics.maxLatencyMs)}\n`;
      out += `app_auth_failures_total ${metrics.authFailures}\n`;
      out += `app_social_cache_hits_total ${metrics.socialCacheHits}\n`;
      out += `app_social_cache_miss_total ${metrics.socialCacheMiss}\n`;
      res.setHeader('Content-Type','text/plain; version=0.0.4');
      return res.send(out);
    }
    res.json({
      uptimeSeconds: upSec,
      requestsTotal: metrics.requestsTotal,
      statusCounts: metrics.statusCounts,
      requestsByRoute: metrics.requestsByRoute,
      slowRequests: metrics.slowRequests,
      maxLatencyMs: Math.round(metrics.maxLatencyMs),
      authFailures: metrics.authFailures,
      socialCache: { hits: metrics.socialCacheHits, miss: metrics.socialCacheMiss }
    });
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
      ORDER BY COALESCE(views, 0) DESC, created_at DESC
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
  const admin = req.query.admin; // quando presente (ex: admin=1) desabilitaremos cache para painel

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

      // Cache-Control e Last-Modified
      const isAdminLike = String(admin || '').trim() === '1';
      let lastMod = undefined;
      try {
        const dates = items
          .map(p => p.publishedAt || p.createdAt)
          .filter(Boolean)
          .map(d => new Date(d).getTime())
          .filter(n => Number.isFinite(n));
        lastMod = (dates.length ? new Date(Math.max(...dates)) : new Date()).toUTCString();
        if (isAdminLike) {
          // Painel precisa sempre de dados frescos
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=60');
        }
        res.setHeader('Last-Modified', lastMod);
      } catch (_) {}

      if (!doPaged) {
        const payload = isAdminLike ? { posts: items, total: items.length } : items;
        const body = JSON.stringify(payload);
        if (!isAdminLike) {
          const etag = strongEtagFor(body);
          if (etag) res.setHeader('ETag', etag);
        }
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
        if (!isAdminLike) {
          const etag = strongEtagFor(body);
          if (etag) res.setHeader('ETag', etag);
          if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=60');
        }
        if (lastMod) res.setHeader('Last-Modified', lastMod);
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
    // Sanitização de campos HTML ricos
    const sanitizeOptions = {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption','iframe']),
      allowedAttributes: {
        a: ['href','name','target','rel'],
        img: ['src','alt','title','width','height','loading'],
        iframe: ['src','width','height','allow','allowfullscreen','frameborder'],
        span: ['class', 'style', 'data-highlight'], // ✅ PERMITIR data-highlight para destaques animados
        '*': ['style', 'class']
      },
      allowedSchemes: ['http','https','data','mailto'],
      transformTags: {
        'b': 'strong',
        'i': 'em'
      },
      // ✅ PERMITIR TODOS OS ESTILOS INLINE SEGUROS (necessário para destaques animados)
      allowedStyles: {
        '*': {
          // Estilos de texto
          'text-align': [/.*/],
          'font-weight': [/.*/],
          'font-style': [/.*/],
          'font-size': [/.*/],
          'font-family': [/.*/],
          'line-height': [/.*/],
          'color': [/.*/],
          // Estilos de background (necessário para destaques)
          'background': [/.*/],
          'background-color': [/.*/],
          'background-size': [/.*/],
          'background-position': [/.*/],
          'background-repeat': [/.*/],
          // Estilos de layout
          'padding': [/.*/],
          'margin': [/.*/],
          'border': [/.*/],
          'border-radius': [/.*/],
          'border-left': [/.*/],
          'border-color': [/.*/],
          // Estilos de posição
          'position': [/^(relative|absolute|static)$/],
          'display': [/.*/],
          // Animação e transição
          'transition': [/.*/],
          'animation': [/.*/],
          // Box decoration
          '-webkit-box-decoration-break': [/.*/],
          'box-decoration-break': [/.*/],
        }
      },
      enforceHtmlBoundary: true
    };

    const baseAllowedSchemesUpdate = process.env.ALLOW_DATA_IMAGES_CONTENT === '1' ? ['http','https','data','mailto'] : ['http','https','mailto'];
    sanitizeOptions.allowedSchemes = baseAllowedSchemesUpdate;
    const rawConteudo = body.conteudo ?? body.content ?? '';
    let sanitizedConteudo = sanitizeHtml(String(rawConteudo), sanitizeOptions);
    if (process.env.ALLOW_DATA_IMAGES_CONTENT !== '1') {
      const beforeLenU = sanitizedConteudo.length;
      sanitizedConteudo = sanitizedConteudo.replace(/<img[^>]+src="data:[^"]+"[^>]*>/gi,'');
      if (beforeLenU !== sanitizedConteudo.length) {
        console.log('🧹 [UPDATE POST] Imagens Base64 inline removidas do conteúdo');
      }
    }
    // Proteção extra: limitar tamanho máximo (ex: 300KB) para evitar payloads gigantes
    if (sanitizedConteudo.length > 300 * 1024) {
      console.warn(`⚠️ Conteúdo sanitizado excedeu 300KB. Truncando.`);
      sanitizedConteudo = sanitizedConteudo.slice(0, 300 * 1024);
    }

    const desired = {
      titulo: body.titulo ?? body.title,
	subtitulo: body.subtitulo ?? body.subtitle,
      conteudo: sanitizedConteudo,
      categoria: body.categoria ?? body.category,
      chapeu: body.chapeu,
      resumo: body.resumo, // ✅ RESUMO INCLUÍDO!
      posicao: body.posicao ?? body.position,
      slug: body.slug,
    };

    // imagem: priorizar uma coluna existente
    let incomingImage = body.imagemUrl || body.imagemDestaque || body.imagem || body.image;
    
    // 🚫 IGNORAR Base64 - apenas URLs válidas
    if (incomingImage && incomingImage.startsWith('data:')) {
      console.log('⚠️ [UPDATE POST] Imagem Base64 detectada - IGNORANDO');
      incomingImage = null;
    }

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

        // Acrescentar updated_at se a coluna existir
        if (cols.includes('updated_at')) {
          sets.push('updated_at = ?');
          params.push(new Date().toISOString());
        }
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
        let updatedContent = desired.conteudo;
        if (updatedContent) {
          try {
            const sanitizeOptions = {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption','iframe']),
              allowedAttributes: {
                a: ['href','name','target','rel'],
                img: ['src','alt','title','width','height','loading'],
                iframe: ['src','width','height','allow','allowfullscreen','frameborder'],
                '*': ['style']
              },
              allowedSchemes: ['http','https','data','mailto'],
              transformTags: { 'b': 'strong', 'i': 'em' },
              allowedStyles: { '*': { 'text-align': [/^left$/,/^right$/,/^center$/,/^justify$/] } },
              enforceHtmlBoundary: true
            };
            updatedContent = sanitizeHtml(String(updatedContent), sanitizeOptions);
            if (updatedContent.length > 300*1024) updatedContent = updatedContent.slice(0,300*1024);
          } catch(_) {}
        }
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

  // ===== ENDPOINT DE UPLOAD DE IMAGENS =====
  // 🖼️ POST /api/upload - Upload de imagem no disco persistente
  // Aceitar vários nomes de campo: image, file, imagem, imagemDestaque
  const uploadAny = (req,res,next)=>{
    const single = upload.single('image');
    single(req,res,function(err){
      if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error:'Imagem maior que 5MB' });
      if (req.file) return next();
      // Tentar outros campos
      const tryFields = ['file','imagem','imagemDestaque'];
      let idx = 0;
      const tryNext = ()=>{
        if (idx >= tryFields.length) return next();
        const f = tryFields[idx++];
        const s = upload.single(f);
        s(req,res,function(e2){ if (!req.file && !e2) return tryNext(); next(e2); });
      };
      tryNext();
    });
  };
  app.post('/api/upload', authMiddleware, requireRole('admin','editor'), uploadAny, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado (campo esperado: image)' });
      }
      
      // URL da imagem (relativa ao domínio)
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // URL completa para produção
      const baseUrl = process.env.RENDER 
        ? 'https://r10piaui.onrender.com'
        : `http://localhost:${PORT}`;
      const fullUrl = baseUrl + imageUrl;
      
      console.log('✅ Imagem salva no disco:', req.file.filename);
      console.log('📍 Caminho completo:', req.file.path);
      console.log('🔗 URL:', fullUrl);
      
      res.json({
        success: true,
        imageUrl: fullUrl,
        url: fullUrl,
        relative: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        path: imageUrl
      });
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem', details: error.message });
    }
  });
  
  // 🗑️ DELETE /api/upload/:filename - Deletar imagem (opcional)
  app.delete('/api/upload/:filename', authMiddleware, requireRole('admin'), (req, res) => {
    try {
      const { filename } = req.params;
      const filepath = path.join(UPLOADS_DIR, filename);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }
      
      // Deletar arquivo
      fs.unlinkSync(filepath);
      console.log('🗑️ Imagem deletada:', filename);
      
      res.json({ 
        success: true, 
        message: 'Imagem deletada com sucesso',
        filename: filename
      });
    } catch (error) {
      console.error('❌ Erro ao deletar imagem:', error);
      res.status(500).json({ error: 'Erro ao deletar imagem', details: error.message });
    }
  });

  // Criar novo post
  app.post('/api/posts', authMiddleware, requireRole('admin','editor'), (req, res) => {
    try {
      console.log('📝 [CREATE POST] Iniciando criação de post...');
      const body = req.body || {};
      
      console.log('📝 [CREATE POST] Body recebido:', JSON.stringify(body).substring(0, 200));
      console.log('📝 [CREATE POST] Dados:', { titulo: body.titulo, categoria: body.categoria });
      
      // Campos obrigatórios
      const titulo = body.titulo || body.title;
      const categoria = body.categoria || body.category || 'geral';
      
      console.log('📝 [CREATE POST] Validando título:', titulo);
      
      if (!titulo) {
        console.error('❌ [CREATE POST] Título vazio!');
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
    
      console.log('📝 [CREATE POST] Preparando sanitização...');
      // Campos opcionais
      const subtitulo = body.subtitulo || body.subtitle || '';
      // Sanitização de conteúdo (mesma config do PUT para consistência)
      const baseAllowedSchemesCreate = process.env.ALLOW_DATA_IMAGES_CONTENT === '1' ? ['http','https','data','mailto'] : ['http','https','mailto'];
      const sanitizeOptions = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption','iframe']),
        allowedAttributes: {
          a: ['href','name','target','rel'],
          img: ['src','alt','title','width','height','loading'],
          iframe: ['src','width','height','allow','allowfullscreen','frameborder'],
          span: ['class', 'style', 'data-highlight'], // ✅ PERMITIR data-highlight para destaques animados
          '*': ['style', 'class']
        },
        // Bloqueia 'data' scheme para imagens se ALLOW_DATA_IMAGES_CONTENT != '1'
        allowedSchemes: baseAllowedSchemesCreate,
        transformTags: { 'b': 'strong', 'i': 'em' },
        // ✅ PERMITIR TODOS OS ESTILOS INLINE SEGUROS (necessário para destaques animados)
        allowedStyles: {
          '*': {
            'text-align': [/.*/],
            'font-weight': [/.*/],
            'font-style': [/.*/],
            'font-size': [/.*/],
            'font-family': [/.*/],
            'line-height': [/.*/],
            'color': [/.*/],
            'background': [/.*/],
            'background-color': [/.*/],
            'background-size': [/.*/],
            'background-position': [/.*/],
            'background-repeat': [/.*/],
            'padding': [/.*/],
            'margin': [/.*/],
            'border': [/.*/],
            'border-radius': [/.*/],
            'border-left': [/.*/],
            'border-color': [/.*/],
            'position': [/^(relative|absolute|static)$/],
            'display': [/.*/],
            'transition': [/.*/],
            'animation': [/.*/],
            '-webkit-box-decoration-break': [/.*/],
            'box-decoration-break': [/.*/],
          }
        },
        enforceHtmlBoundary: true
      };
      console.log('📝 [CREATE POST] Sanitizando conteúdo...');
      let conteudo = body.conteudo || body.content || '';
      console.log('📝 [CREATE POST] Conteúdo original length:', conteudo.length);
      conteudo = sanitizeHtml(String(conteudo), sanitizeOptions);
      if (process.env.ALLOW_DATA_IMAGES_CONTENT !== '1') {
        // Remove <img src="data:..."> para evitar páginas enormes e possíveis abusos
        const beforeLen = conteudo.length;
        conteudo = conteudo.replace(/<img[^>]+src="data:[^"]+"[^>]*>/gi,'');
        if (beforeLen !== conteudo.length) {
          console.log('🧹 [CREATE POST] Imagens Base64 inline removidas do conteúdo');
        }
      }
      console.log('📝 [CREATE POST] Conteúdo sanitizado length:', conteudo.length);
      if (conteudo.length > 300 * 1024) {
        console.warn('⚠️ Conteúdo sanitizado >300KB. Truncando.');
        conteudo = conteudo.slice(0, 300 * 1024);
      }
      console.log('📝 [CREATE POST] Extraindo campos...');
      const autor = body.autor || body.author || 'Redação R10 Piauí';
      const chapeu = body.chapeu || '';
      const posicao = body.posicao || body.position || 'geral';
      let imagemDestaque = body.imagem_destaque || body.imagemDestaque || body.imagemUrl || body.imagem || body.image || '';
      
      // 🚫 IGNORAR Base64 - apenas URLs válidas
      if (imagemDestaque && imagemDestaque.startsWith('data:')) {
        console.log('⚠️ [CREATE POST] Imagem Base64 detectada - IGNORANDO');
        imagemDestaque = '';
      }
      
      console.log('📝 [CREATE POST] Normalizando posição:', posicao);
      // Normalizar posição
      const normalizedPosition = normalizePos(posicao);
      console.log('📝 [CREATE POST] Posição normalizada:', normalizedPosition);
      
      console.log('📝 [CREATE POST] Preparando INSERT SQL...');

      const nowIso = new Date().toISOString();

      // Descobrir colunas realmente existentes para montagem segura
      db.all('PRAGMA table_info(noticias)', [], (perr, colsRows) => {
        if (perr) {
          console.error('⚠️ [CREATE POST] Falha PRAGMA, fallback minimal:', perr.message);
        }
        const existing = new Set((colsRows||[]).map(r=>r.name));
        const baseCols = ['titulo','subtitulo','conteudo','categoria','autor','chapeu','posicao','imagem_destaque'];
        const tsCols = [];
        if (existing.has('created_at')) tsCols.push('created_at');
        if (existing.has('updated_at')) tsCols.push('updated_at');
        if (existing.has('published_at')) tsCols.push('published_at');
        const allInsertCols = [...baseCols, ...tsCols];
        const placeholders = allInsertCols.map(()=>'?').join(',');
        const sql = `INSERT INTO noticias (${allInsertCols.join(',')}) VALUES (${placeholders})`;

        const valuesMap = {
          titulo, subtitulo, conteudo, categoria, autor, chapeu,
          posicao: normalizedPosition,
          imagem_destaque: imagemDestaque
        };
        if (tsCols.includes('created_at')) valuesMap.created_at = nowIso;
        if (tsCols.includes('updated_at')) valuesMap.updated_at = nowIso;
        if (tsCols.includes('published_at')) valuesMap.published_at = nowIso;
        const values = allInsertCols.map(c=> valuesMap[c]);

        console.log('📝 [CREATE POST] Executando db.run...');
        console.log('📝 [CREATE POST] Colunas=', allInsertCols, 'ValoresPreview=', { ...valuesMap });

        db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ [CREATE POST] Erro ao criar post no banco:', err);
          return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
        }
        
        const newId = this.lastID;
        console.log(`✅ [CREATE POST] Novo post criado com ID: ${newId} (posição: ${normalizedPosition})`);
        
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
        }); // fim db.run
      }); // fim PRAGMA table_info callback
    } catch (error) {
      console.error('💥 [CREATE POST] Erro não capturado no try-catch:', error);
      console.error('💥 [CREATE POST] Stack trace:', error.stack);
      res.status(500).json({ error: 'Erro interno ao criar post', details: error.message, stack: error.stack });
    }
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

  // ======= REAÇÕES (Reactions System) =======
  
  // Criar tabela de reações se não existir
  db.run(`CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('feliz','inspirado','surpreso','preocupado','triste','indignado')),
    ip_hash TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES noticias(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Erro ao criar tabela reactions:', err);
  });

  // Criar índices para performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reactions_timestamp ON reactions(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reactions_ip_post ON reactions(ip_hash, post_id)`);

  // POST /api/posts/:id/react - Adicionar ou alterar reação
  app.post('/api/posts/:id/react', (req, res) => {
    const { id } = req.params;
    const { tipo } = req.body || {};
    
    // Validações
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de post inválido' });
    }
    
    const tiposValidos = ['feliz', 'inspirado', 'surpreso', 'preocupado', 'triste', 'indignado'];
    if (!tipo || !tiposValidos.includes(String(tipo).toLowerCase())) {
      return res.status(400).json({ error: 'Tipo de reação inválido', tiposValidos });
    }
    
    // Hash do IP para privacidade
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString().split(',')[0].trim();
    const ipHash = sha256Hex(ip);
    const tipoNormalizado = String(tipo).toLowerCase();
    const timestamp = new Date().toISOString();
    
    console.log(`😊 Reação recebida: Post ${id}, Tipo: ${tipoNormalizado}, IP Hash: ${ipHash.substring(0, 8)}...`);
    
    // Verificar se o post existe
    db.get('SELECT id FROM noticias WHERE id = ?', [id], (err, post) => {
      if (err) {
        console.error('Erro ao verificar post:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!post) {
        return res.status(404).json({ error: 'Post não encontrado' });
      }
      
      // Verificar se usuário já reagiu (por IP)
      db.get('SELECT id, tipo FROM reactions WHERE post_id = ? AND ip_hash = ?', [id, ipHash], (errCheck, existing) => {
        if (errCheck) {
          console.error('Erro ao verificar reação existente:', errCheck);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (existing) {
          // Usuário já reagiu - atualizar reação
          if (existing.tipo === tipoNormalizado) {
            // Mesma reação - remover (toggle)
            db.run('DELETE FROM reactions WHERE id = ?', [existing.id], (errDel) => {
              if (errDel) {
                console.error('Erro ao remover reação:', errDel);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }
              
              console.log(`🗑️ Reação removida: Post ${id}, Tipo: ${tipoNormalizado}`);
              
              // Retornar contagens atualizadas
              getReactionCounts(id, (counts) => {
                res.json({ 
                  success: true, 
                  action: 'removed',
                  message: 'Reação removida com sucesso',
                  reactions: counts
                });
              });
            });
          } else {
            // Reação diferente - atualizar
            db.run('UPDATE reactions SET tipo = ?, timestamp = ? WHERE id = ?', [tipoNormalizado, timestamp, existing.id], (errUpd) => {
              if (errUpd) {
                console.error('Erro ao atualizar reação:', errUpd);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }
              
              console.log(`🔄 Reação atualizada: Post ${id}, ${existing.tipo} → ${tipoNormalizado}`);
              
              // Retornar contagens atualizadas
              getReactionCounts(id, (counts) => {
                res.json({ 
                  success: true, 
                  action: 'updated',
                  message: 'Reação atualizada com sucesso',
                  previousReaction: existing.tipo,
                  reactions: counts
                });
              });
            });
          }
        } else {
          // Nova reação
          db.run('INSERT INTO reactions (post_id, tipo, ip_hash, timestamp) VALUES (?, ?, ?, ?)', 
            [id, tipoNormalizado, ipHash, timestamp], 
            function(errIns) {
              if (errIns) {
                console.error('Erro ao inserir reação:', errIns);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }
              
              console.log(`✅ Nova reação adicionada: Post ${id}, Tipo: ${tipoNormalizado}, ID: ${this.lastID}`);
              
              // Retornar contagens atualizadas
              getReactionCounts(id, (counts) => {
                res.status(201).json({ 
                  success: true, 
                  action: 'created',
                  message: 'Reação adicionada com sucesso',
                  reactionId: this.lastID,
                  reactions: counts
                });
              });
            }
          );
        }
      });
    });
  });

  // GET /api/posts/:id/reactions - Obter reações de um post específico
  app.get('/api/posts/:id/reactions', (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de post inválido' });
    }
    
    getReactionCounts(id, (counts) => {
      // Verificar se usuário já reagiu (opcional)
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '').toString().split(',')[0].trim();
      const ipHash = sha256Hex(ip);
      
      db.get('SELECT tipo FROM reactions WHERE post_id = ? AND ip_hash = ?', [id, ipHash], (err, userReaction) => {
        res.json({
          postId: id,
          reactions: counts,
          total: Object.values(counts).reduce((sum, count) => sum + count, 0),
          userReaction: userReaction ? userReaction.tipo : null
        });
      });
    });
  });

  // GET /api/reactions/daily - Agregação das últimas 24 horas (para o painel "Como os leitores se sentem")
  app.get('/api/reactions/daily', (req, res) => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    db.all(`
      SELECT tipo, COUNT(*) as count 
      FROM reactions 
      WHERE timestamp >= ? 
      GROUP BY tipo
    `, [last24h], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar reações diárias:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      // Inicializar todos os tipos com zero
      const counts = {
        feliz: 0,
        inspirado: 0,
        surpreso: 0,
        preocupado: 0,
        triste: 0,
        indignado: 0
      };
      
      // Preencher com valores reais
      (rows || []).forEach(row => {
        counts[row.tipo] = row.count;
      });
      
      // Calcular total
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      // Calcular percentuais
      const percentages = {};
      if (total > 0) {
        Object.keys(counts).forEach(tipo => {
          percentages[tipo] = Math.round((counts[tipo] / total) * 100);
        });
      } else {
        // Se não houver reações, todos ficam com 0%
        Object.keys(counts).forEach(tipo => {
          percentages[tipo] = 0;
        });
      }
      
      res.json({
        period: 'last_24_hours',
        timestamp: new Date().toISOString(),
        total,
        counts,
        percentages
      });
    });
  });

  // Função auxiliar para obter contagens de reações de um post
  function getReactionCounts(postId, callback) {
    db.all('SELECT tipo, COUNT(*) as count FROM reactions WHERE post_id = ? GROUP BY tipo', [postId], (err, rows) => {
      if (err) {
        console.error('Erro ao contar reações:', err);
        return callback({ feliz: 0, inspirado: 0, surpreso: 0, preocupado: 0, triste: 0, indignado: 0 });
      }
      
      const counts = { feliz: 0, inspirado: 0, surpreso: 0, preocupado: 0, triste: 0, indignado: 0 };
      (rows || []).forEach(row => {
        counts[row.tipo] = row.count;
      });
      
      callback(counts);
    });
  }

  // ======= FIM REAÇÕES =======

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
    // ⚠️ COMENTADO: não remover as rotas originais definidas nas linhas 780-891
    // app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/login' && l.route.methods.post));
    // app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === '/api/auth/register' && l.route.methods.post));
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
  // (duplicado removido)
} catch(_) { /* noop */ }

  // ======= CLEAR: Limpar banco (desenvolvimento) =======
  app.get('/api/clear', (req, res) => {
    const secret = req.query.secret || '';
    if (secret !== (process.env.SEED_SECRET || 'r10seed2025')) {
      return res.status(403).json({ error: 'Acesso negado. Use ?secret=r10seed2025' });
    }

    db.serialize(() => {
      db.run('DELETE FROM noticias', (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao limpar notícias' });
        db.run('DELETE FROM banners', (errB) => {
          if (errB) return res.status(500).json({ error: 'Erro ao limpar banners' });
          // Resetar sequence de autoincrement (SQLite armazena em sqlite_sequence)
          db.run("DELETE FROM sqlite_sequence WHERE name IN ('noticias','banners')", (errSeq) => {
            if (errSeq) console.warn('⚠️ Não foi possível resetar sequence:', errSeq.message);
            // Otimizar arquivo
            db.run('VACUUM', (vErr) => {
              if (vErr) console.warn('⚠️ VACUUM falhou:', vErr.message);
              res.json({
                success: true,
                message: '🗑️ Banco limpo e otimizado! Execute /api/seed para repopular.'
              });
            });
          });
        });
      });
    });
  });

  // ======= SEED: Popular banco com dados de exemplo =======
  app.get('/api/seed', (req, res) => {
    const secret = req.query.secret || '';
    // Proteção simples: só executa se passar secret correto
    if (secret !== (process.env.SEED_SECRET || 'r10seed2025')) {
      return res.status(403).json({ error: 'Acesso negado. Use ?secret=r10seed2025' });
    }

    // ==== Funções utilitárias para schema dinâmico de noticias ====
    function getNoticiasColumns(cb) {
      db.all('PRAGMA table_info(noticias)', (err, rows) => {
        if (err) return cb(err, []);
        cb(null, rows.map(r => r.name));
      });
    }

    function ensureOptionalColumns(cols, done) {
      const optional = [
        { name: 'subtitulo', def: 'TEXT' },
        { name: 'resumo', def: 'TEXT' },
        { name: 'chapeu', def: 'TEXT' },
        { name: 'imagem_url', def: 'TEXT' }
      ];
      const missing = optional.filter(o => !cols.includes(o.name));
      if (!missing.length) return done();
      let idx = 0;
      function next() {
        if (idx >= missing.length) return done();
        const m = missing[idx++];
        db.run(`ALTER TABLE noticias ADD COLUMN ${m.name} ${m.def}`, (err) => {
          if (err) console.warn('⚠️ Falha ao adicionar coluna opcional', m.name, err.message);
          next();
        });
      }
      next();
    }

    const noticias = [
      // 1 Supermanchete
      {t:'Governo do Piauí anuncia investimento de R$ 500 milhões em infraestrutura',ch:'Desenvolvimento',r:'Recursos para 12 municípios',c:'<p>Investimento histórico em obras públicas que vai transformar a infraestrutura de 12 municípios do Piauí.</p>',a:'Redação',cat:'politica',p:'supermanchete',img:'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=600&fit=crop'},
      
      // 5 Destaques
      {t:'Piripiri recebe primeira indústria de tecnologia do interior',ch:'Economia',r:'150 empregos diretos',c:'<p>TechNorte inaugura sede no distrito industrial trazendo inovação.</p>',a:'Redação',cat:'piripiri',p:'destaque',img:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'},
      {t:'Festival de Verão movimenta economia em 15 municípios',ch:'Cultura',r:'50 mil visitantes esperados',c:'<p>Shows e feiras gastronômicas movimentam o estado todo.</p>',a:'Redação',cat:'entretenimento',p:'destaque',img:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop'},
      {t:'UESPI abre 500 vagas em cursos gratuitos',ch:'Educação',r:'Cursos técnicos e graduação',c:'<p>Inscrições abertas até dia 20 de outubro para diversos cursos.</p>',a:'Redação',cat:'geral',p:'destaque',img:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop'},
      {t:'Operação policial prende 12 suspeitos de tráfico',ch:'Segurança',r:'Drogas e armas apreendidas',c:'<p>Ação coordenada da Polícia Civil em Teresina desmantela quadrilha.</p>',a:'Redação',cat:'policia',p:'destaque',img:'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop'},
      {t:'Seleção piauiense de futsal conquista título nacional sub-17',ch:'Esporte',r:'Vitória sobre São Paulo por 4 a 2',c:'<p>Primeira vez que o Piauí vence a competição nacional.</p>',a:'Redação',cat:'esporte',p:'destaque',img:'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop'},
      
      // 8 Notícias gerais
      {t:'Chuvas atingem 12 municípios do interior',ch:'Clima',r:'Defesa Civil emite alerta',c:'<p>Possíveis alagamentos nas próximas 48 horas requerem atenção.</p>',a:'Redação',cat:'geral',p:'geral',img:'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&h=600&fit=crop'},
      {t:'Preço da gasolina cai 5% em postos de Teresina',ch:'Economia',r:'Redução no mercado internacional',c:'<p>Litro pode ser encontrado por R$ 5,59 em alguns postos.</p>',a:'Redação',cat:'geral',p:'geral',img:'https://images.unsplash.com/photo-1545262810-77515befe149?w=800&h=600&fit=crop'},
      {t:'Hospital Regional de Picos amplia leitos de UTI',ch:'Saúde',r:'De 10 para 20 leitos',c:'<p>Investimento de R$ 5 milhões reduz fila de espera por UTI.</p>',a:'Redação',cat:'geral',p:'geral',img:'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop'},
      {t:'Feira de artesanato reúne 200 expositores em Parnaíba',ch:'Cultura',r:'Entrada gratuita no fim de semana',c:'<p>Cerâmica, tecelagem e gastronomia piauiense em destaque.</p>',a:'Redação',cat:'entretenimento',p:'geral',img:'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600&fit=crop'},
      {t:'Concurso público oferece 300 vagas para professores',ch:'Emprego',r:'Salários até R$ 5 mil',c:'<p>Inscrições começam na próxima segunda-feira para rede estadual.</p>',a:'Redação',cat:'geral',p:'geral',img:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop'},
      
      // 5 Notícias de municípios
      {t:'Pedro II recebe obras de pavimentação no centro histórico',ch:'Infraestrutura',r:'Investimento de R$ 2 milhões',c:'<p>Obras devem ser concluídas em 6 meses preservando patrimônio.</p>',a:'Redação',cat:'pedro-ii',p:'geral',img:'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop'},
      {t:'Piracuruca inaugura novo mercado público',ch:'Comércio',r:'Espaço com 80 boxes',c:'<p>Investimento de R$ 1,5 milhão moderniza comércio local da cidade.</p>',a:'Redação',cat:'piracuruca',p:'geral',img:'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop'},
      {t:'Brasileira recebe investimento em energia solar',ch:'Sustentabilidade',r:'Painéis em prédios públicos',c:'<p>Expectativa de reduzir 40% dos gastos com energia elétrica.</p>',a:'Redação',cat:'brasileira',p:'geral',img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop'},
      {t:'Lagoa de São Francisco promove festival de pesca esportiva',ch:'Esporte',r:'200 pescadores de vários estados',c:'<p>5º Festival com shows e feira gastronômica para toda família.</p>',a:'Redação',cat:'lagoa-de-sao-francisco',p:'geral',img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'},
      {t:'São José do Divino amplia rede escolar',ch:'Educação',r:'Nova escola com 12 salas',c:'<p>Investimento estadual de R$ 2,5 milhões beneficia 600 alunos.</p>',a:'Redação',cat:'sao-jose-do-divino',p:'geral',img:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop'}
    ];

    const banners = [
      // top-strip: Banner horizontal no topo
      {t:'Economix',cl:'Supermercado',l:'https://exemplo.com',pos:'top-strip',tp:'html',tam:'728x90',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:5,html:'<div style="background:#667eea;padding:20px;text-align:center;color:white;height:90px;display:flex;align-items:center;justify-content:center"><h2>🛒 ECONOMIX - Ofertas!</h2></div>'},
      {t:'TechPi',cl:'Informática',l:'https://exemplo.com',pos:'top-strip',tp:'html',tam:'728x90',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:4,html:'<div style="background:#f093fb;padding:20px;text-align:center;color:white;height:90px;display:flex;align-items:center;justify-content:center"><h2>💻 TechPi</h2></div>'},
      
      // super-banner: Na NewsGeneralSection  
      {t:'Móveis',cl:'Móveis Design',l:'https://exemplo.com',pos:'super-banner',tp:'html',tam:'970x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:5,html:'<div style="background:#a8edea;padding:30px;text-align:center;height:250px;display:flex;align-items:center;justify-content:center"><h2>🛋️ Móveis Design</h2></div>'},
      {t:'Construtora',cl:'Construtora Forte',l:'https://exemplo.com',pos:'super-banner',tp:'html',tam:'970x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:4,html:'<div style="background:#ff9a9e;padding:30px;text-align:center;height:250px;display:flex;align-items:center;justify-content:center"><h2>🏗️ Construtora Forte</h2></div>'},
      
      // news-sidebar: Coluna direita da NewsGeneralSection
  {t:'Farmácia',cl:'Saúde Total',l:'https://exemplo.com',pos:'news-sidebar',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:5,html:'<div style="background:#4facfe;padding:15px;text-align:center;color:white;display:flex;flex-direction:column;justify-content:center;height:100%"><h3>💊 Saúde Total</h3></div>'},
  {t:'Pizzaria',cl:'Bella Massa',l:'https://exemplo.com',pos:'news-sidebar',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:4,html:'<div style="background:#fa709a;padding:15px;text-align:center;display:flex;flex-direction:column;justify-content:center;height:100%"><h3>🍕 Bella Massa</h3></div>'},
  {t:'Auto Peças',cl:'Auto Peças PI',l:'https://exemplo.com',pos:'news-sidebar',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:3,html:'<div style="background:#30cfd0;padding:15px;text-align:center;color:white;display:flex;flex-direction:column;justify-content:center;height:100%"><h3>🚗 Auto Peças</h3></div>'},
      
      // sidebar-article: AdBox na página de artigo
      {t:'Unifuturo',cl:'Faculdade',l:'https://exemplo.com',pos:'sidebar-article',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:5,html:'<div style="background:#84fab0;padding:20px;text-align:center;height:250px;display:flex;flex-direction:column;justify-content:center"><h2>🎓 Unifuturo</h2></div>'},
      {t:'Odonto',cl:'OdontoVida',l:'https://exemplo.com',pos:'sidebar-article',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:4,html:'<div style="background:#ffecd2;padding:15px;text-align:center;height:250px;display:flex;flex-direction:column;justify-content:center"><h3>😁 OdontoVida</h3></div>'},
      
      // in-content: No meio do conteúdo do artigo
      {t:'FitLife',cl:'Academia',l:'https://exemplo.com',pos:'in-content',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:5,html:'<div style="background:#ff6b6b;padding:20px;text-align:center;color:white;height:250px;display:flex;flex-direction:column;justify-content:center"><h3>💪 FitLife</h3></div>'},
      {t:'Pet Shop',cl:'Amigo Fiel',l:'https://exemplo.com',pos:'in-content',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:4,html:'<div style="background:#a1c4fd;padding:20px;text-align:center;height:250px;display:flex;flex-direction:column;justify-content:center"><h3>🐶 Pet Shop</h3></div>'},
      {t:'Advocacia',cl:'Silva Advogados',l:'https://exemplo.com',pos:'in-content',tp:'html',tam:'300x250',st:'ativo',di:'2025-10-01',df:'2025-12-31',pr:3,html:'<div style="background:#d299c2;padding:20px;text-align:center;height:250px;display:flex;flex-direction:column;justify-content:center"><h3>⚖️ Silva</h3></div>'}
    ];

    let inserted = { noticias: 0, banners: 0, schema: {} };

    getNoticiasColumns((errCols, cols) => {
      if (errCols) console.warn('⚠️ Não foi possível obter colunas de noticias:', errCols.message);
      ensureOptionalColumns(cols || [], () => {
        // Recarregar colunas após possíveis ALTER
        getNoticiasColumns((_, cols2) => {
          const colSet = new Set(cols2 || cols || []);
          inserted.schema = { colunas: Array.from(colSet) };

          // Determinar coluna de imagem disponível
            const imageColumn = colSet.has('imagem_url') ? 'imagem_url' : (colSet.has('imagem_destaque') ? 'imagem_destaque' : null);
          // Montar lista base dinâmica
          const baseCols = ['titulo','conteudo','autor','categoria','posicao'];
          const optionalMap = [
            ['subtitulo','subtitulo'],
            ['chapeu','chapeu'],
            ['resumo','resumo']
          ].filter(([c]) => colSet.has(c)).map(([c,a])=>c);
          if (imageColumn) baseCols.push(imageColumn);
          const allCols = [...optionalMap, ...baseCols];

          // Adicionar timestamps se existirem
          const hasCreated = colSet.has('created_at');
          const hasUpdated = colSet.has('updated_at');
          if (hasCreated) allCols.push('created_at');
          if (hasUpdated) allCols.push('updated_at');

          const placeholders = allCols.map(()=>'?').join(',');
          const insertSql = `INSERT INTO noticias (${allCols.join(',')}) VALUES (${placeholders})`;

          const now = new Date().toISOString().replace('T',' ').substring(0,19);

          const stmtN = db.prepare(insertSql);
          noticias.forEach(n => {
            const row = {};
            row.titulo = n.t;
            if (colSet.has('subtitulo')) row.subtitulo = n.r || '';
            if (colSet.has('chapeu')) row.chapeu = n.ch || '';
            if (colSet.has('resumo')) row.resumo = n.r || '';
            row.conteudo = n.c;
            row.autor = n.a;
            row.categoria = n.cat;
            row.posicao = n.p;
            if (imageColumn) row[imageColumn] = n.img;
            if (hasCreated) row.created_at = now;
            if (hasUpdated) row.updated_at = now;
            const values = allCols.map(c => row[c] ?? '');
            stmtN.run(values, (err) => { if (!err) inserted.noticias++; else console.warn('⚠️ Falha insert noticia', err.message); });
          });
          stmtN.finalize(() => {
            const stmtB = db.prepare('INSERT INTO banners (titulo,cliente,link,posicao,tipo,tamanho,status,data_inicio,data_fim,prioridade,conteudo_html,impressoes_atuais,cliques_atuais,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0,datetime("now"),datetime("now"))');
            banners.forEach(b => {
              stmtB.run(b.t, b.cl, b.l, b.pos, b.tp, b.tam, b.st, b.di, b.df, b.pr, b.html, (err) => { if (!err) inserted.banners++; else console.warn('⚠️ Falha insert banner', err.message); });
            });
            stmtB.finalize(() => {
              res.json({
                success: true,
                message: 'Banco populado com sucesso! 🎉',
                inserted,
                note: 'Inserção adaptativa conforme colunas existentes.',
                next: 'Acesse a home: https://r10piaui.onrender.com'
              });
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
  // 🎯 Usar o mesmo caminho persistente que configuramos no createApp
  const DATA_DIR = process.env.RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'data');
  const defaultDbPath = path.join(DATA_DIR, 'r10piaui.db');
  
  const app = createApp({ dbPath: process.env.SQLITE_DB_PATH || defaultDbPath });
  const primary = Number(process.env.PORT || PORT) || 3002;
  const extra = process.env.ADDITIONAL_PORT ? Number(process.env.ADDITIONAL_PORT) : null;
  const ports = extra && extra !== primary ? [primary, extra] : [primary];
  ports.forEach((p) => {
    try {
      const server = app.listen(p, '0.0.0.0', () => {
        console.log(`🚀 API SQLite rodando na porta ${p} (todas as interfaces)`);
        console.log(`📍 Health: http://0.0.0.0:${p}/api/health`);
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
  console.log(`📰 Posts: http://127.0.0.1:${primary}/api/posts?limit=5`);
  console.log(`🏠 Home: http://127.0.0.1:${primary}/api/home`);
}

module.exports = { createApp };