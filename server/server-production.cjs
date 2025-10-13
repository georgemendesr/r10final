#!/usr/bin/env node
const path = require('path');
const express = require('express');
const { createApp } = require('./server-api-simple.cjs');

// Respeita SQLITE_DB_PATH automaticamente via createApp
const app = createApp({ dbPath: process.env.SQLITE_DB_PATH });

// =========================================================================
// 🔍 LOG DE DIAGNÓSTICO: Registra TODAS as requisições que chegam no servidor
// =========================================================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📥 REQ: ${req.method} ${req.path}`);
  next();
});
// =========================================================================

const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
const distDir = path.join(__dirname, '..', 'r10-front_full_07ago', 'dist');

console.log(`📂 [PRODUCTION] Diretórios configurados:`);
console.log(`   - UPLOADS: ${UPLOADS_DIR}`);
console.log(`   - DIST: ${distDir}`);

// =========================================================================
// 🚀 ORDEM DE PRIORIDADE (CRÍTICA)
// =========================================================================

// PRIORIDADE 1: Servir arquivos de /uploads (MÁXIMA PRIORIDADE)
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filepath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filepath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filepath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filepath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    console.log(`📤 [UPLOAD] Servindo: ${filepath}`);
  }
}));

// PRIORIDADE 2: Servir arquivos estáticos do frontend (CSS, JS, imagens do build)
app.use(express.static(distDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// ============================================================
// MÓDULO DE ARQUIVO - Integração isolada e segura
// ============================================================
console.log('🔍 [DEBUG] Iniciando carregamento do módulo arquivo...');
console.log('🔍 [DEBUG] __dirname:', __dirname);
console.log('🔍 [DEBUG] process.cwd():', process.cwd());

const fs = require('fs');

// Tentar múltiplos caminhos possíveis
const possiblePaths = [
  path.join(__dirname, '..', 'arquivo-routes.js'),
  path.join(__dirname, '..', 'arquivo-routes'),
  path.join(process.cwd(), 'arquivo-routes.js'),
  './arquivo-routes.js',
  '../arquivo-routes.js'
];

console.log('🔍 [DEBUG] Testando caminhos possíveis:');
let arquivoLoaded = false;
let lastError = null;

for (const testPath of possiblePaths) {
  console.log(`   - Tentando: ${testPath}`);
  const exists = fs.existsSync(testPath);
  console.log(`     Existe? ${exists ? '✅ SIM' : '❌ NÃO'}`);
  
  if (exists) {
    try {
      const arquivoRoutes = require(testPath);
      app.use('/arquivo', arquivoRoutes);
      console.log(`✅ [SUCCESS] Módulo arquivo carregado de: ${testPath}`);
      console.log('📚 Módulo de Arquivo carregado em /arquivo');
      arquivoLoaded = true;
      break;
    } catch (err) {
      console.log(`❌ [ERROR] Falha ao carregar de ${testPath}:`, err.message);
      lastError = err;
    }
  }
}

if (!arquivoLoaded) {
  console.log('❌ [CRITICAL] MÓDULO ARQUIVO NÃO ENCONTRADO EM NENHUM PATH!');
  if (lastError) {
    console.log('❌ [CRITICAL] Último erro:', lastError.message);
    console.log('❌ [CRITICAL] Stack:', lastError.stack);
  }
  
  // Listar conteúdo do diretório raiz
  const rootPath = path.join(__dirname, '..');
  console.log(`🔍 [DEBUG] Listando conteúdo de: ${rootPath}`);
  try {
    const files = fs.readdirSync(rootPath);
    console.log('🔍 [DEBUG] Arquivos encontrados:', files.filter(f => f.includes('arquivo')));
  } catch (e) {
    console.log('❌ [DEBUG] Erro ao listar diretório:', e.message);
  }
}
// ============================================================

// PRIORIDADE 3: SPA Fallback (ÚLTIMA REGRA - só se nada acima resolveu)
// IMPORTANTE: Usar app.use() em vez de app.get() para respeitar ordem de middlewares
app.use((req, res, next) => {
  // Se já foi respondido, não fazer nada
  if (res.headersSent) return;
  
  // Não interceptar rotas de API (já tratadas pelo createApp)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // NÃO interceptar rotas do módulo de arquivo
  if (req.path.startsWith('/arquivo')) {
    return next();
  }
  
  // Se for /uploads e chegou aqui, arquivo não existe - retornar 404 real
  if (req.path.startsWith('/uploads/')) {
    console.log(`❌ [404] Arquivo não encontrado: ${req.path}`);
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Qualquer outra rota: servir index.html (SPA)
  console.log(`🌐 [SPA] Fallback para: ${req.path}`);
  return res.sendFile(path.join(distDir, 'index.html'));
});

const primary = Number(process.env.PORT || 3002) || 3002;
const extra = process.env.ADDITIONAL_PORT ? Number(process.env.ADDITIONAL_PORT) : null;
const ports = extra && extra !== primary ? [primary, extra] : [primary];

ports.forEach((p) => {
  try {
    const server = app.listen(p, () => {
      console.log(`🚀 Servidor de produção ouvindo em http://127.0.0.1:${p}`);
      console.log(`📍 API Health: http://127.0.0.1:${p}/api/health`);
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
