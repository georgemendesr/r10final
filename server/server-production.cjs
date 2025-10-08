#!/usr/bin/env node
const path = require('path');
const express = require('express');
const { createApp } = require('./server-api-simple.cjs');

// Respeita SQLITE_DB_PATH automaticamente via createApp
const app = createApp({ dbPath: process.env.SQLITE_DB_PATH });

// ⚠️ CRÍTICO: Servir /uploads ANTES de servir dist/ para evitar conflito com dist/uploads/
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filepath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Garantir Content-Type correto
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filepath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filepath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filepath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));
console.log(`✅ [PRODUCTION] Rota /uploads configurada ANTES de dist/ → ${UPLOADS_DIR}`);

// Servir estáticos do build do front (DEPOIS de /uploads)
const distDir = path.join(__dirname, '..', 'r10-front_full_07ago', 'dist');
app.use(express.static(distDir, {
  setHeaders: (res) => {
    // Cache agressivo para assets fingerprinted, leve para html
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// SPA fallback para index.html (Express 5: use regex em vez de '*')
app.get(/.*/, (req, res, next) => {
  // Não interceptar rotas de API e uploads
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
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
