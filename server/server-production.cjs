#!/usr/bin/env node
const path = require('path');
const express = require('express');
const { createApp } = require('./server-api-simple.cjs');

// Respeita SQLITE_DB_PATH automaticamente via createApp
const app = createApp({ dbPath: process.env.SQLITE_DB_PATH });

// Servir estáticos do build do front
const distDir = path.join(__dirname, '..', 'r10-front_full_07ago', 'dist');
app.use(express.static(distDir, {
  setHeaders: (res) => {
    // Cache agressivo para assets fingerprinted, leve para html
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// SPA fallback para index.html (Express 5: use regex em vez de '*')
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
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
