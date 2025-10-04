// ========================================
// EXEMPLO DE INTEGRAÇÃO DAS OTIMIZAÇÕES
// Como usar optimize-puppeteer.js e card-queue.js
// ========================================

/**
 * Este arquivo mostra como integrar as otimizações no server.js
 * 
 * ANTES (sem otimizações):
 * - Puppeteer lançava 8-10 processos
 * - Múltiplos cards simultâneos (sobrecarga)
 * - Memória não era liberada
 * 
 * DEPOIS (com otimizações):
 * - Puppeteer usa 3-4 processos apenas
 * - 1 card por vez (fila)
 * - Garbage collection automático
 */

// ===== IMPORTS =====
const puppeteerOptimized = require('./optimize-puppeteer');
const cardQueue = require('./card-queue');

// ===== EXEMPLO 1: Gerar card Instagram (SEM otimização) =====
async function gerarCardAntigo() {
  const puppeteer = require('puppeteer');
  
  // ❌ Problema: cria nova instância toda vez
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://exemplo.com');
  const screenshot = await page.screenshot();
  
  await browser.close();
  // ❌ Problema: não força GC, memória fica alocada
  
  return screenshot;
}

// ===== EXEMPLO 2: Gerar card Instagram (COM otimização) =====
async function gerarCardOtimizado() {
  // ✅ Usa fila (garante 1 por vez)
  return await cardQueue.add(async () => {
    // ✅ Usa Puppeteer otimizado (single-process)
    const page = await puppeteerOptimized.createOptimizedPage();
    
    try {
      await page.goto('https://exemplo.com');
      const screenshot = await page.screenshot();
      
      return screenshot;
    } finally {
      await page.close();
      // ✅ Fecha browser e força GC
      await puppeteerOptimized.closeBrowser();
    }
  });
}

// ===== EXEMPLO 3: Endpoint Express =====
const express = require('express');
const app = express();

// ❌ ANTES (sem fila)
app.post('/gerar-card', async (req, res) => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  // ... processar
  await browser.close();
  res.json({ ok: true });
});

// ✅ DEPOIS (com fila + otimizações)
app.post('/gerar-card', async (req, res) => {
  try {
    const resultado = await cardQueue.add(async () => {
      const page = await puppeteerOptimized.createOptimizedPage();
      
      try {
        // Seu código de geração aqui
        const screenshot = await page.screenshot();
        return screenshot;
      } finally {
        await page.close();
        await puppeteerOptimized.closeBrowser();
      }
    });
    
    res.json({ ok: true, data: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EXEMPLO 4: Status da fila =====
app.get('/card-queue/status', (req, res) => {
  const status = cardQueue.getStatus();
  const memory = process.memoryUsage();
  
  res.json({
    queue: status,
    memory: {
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(1)} MB`,
      rss: `${(memory.rss / 1024 / 1024).toFixed(1)} MB`
    }
  });
});

// ===== EXEMPLO 5: Canvas otimizado =====
async function gerarImagemCanvas() {
  return await cardQueue.add(async () => {
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext('2d');
    
    // ... desenhar no canvas
    
    const buffer = canvas.toBuffer('image/png');
    
    // ✅ Limpar referências
    ctx.clearRect(0, 0, 1080, 1080);
    
    // ✅ Forçar GC se disponível
    if (global.gc) {
      global.gc();
    }
    
    return buffer;
  });
}

// ===== EXEMPLO 6: Sharp otimizado =====
async function processarImagemSharp(inputPath, outputPath) {
  return await cardQueue.add(async () => {
    const sharp = require('sharp');
    
    const resultado = await sharp(inputPath)
      .resize(1080, 1080, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    // ✅ Forçar GC após processar
    if (global.gc) {
      global.gc();
    }
    
    return resultado;
  });
}

// ===== EXEMPLO 7: Health check de memória =====
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = used.heapUsed / 1024 / 1024;
  
  console.log(`💾 Memória: ${heapUsedMB.toFixed(1)}MB / 1024MB`);
  
  // ⚠️ Alerta se passar de 800MB (limite de segurança)
  if (heapUsedMB > 800) {
    console.warn(`⚠️ MEMÓRIA ALTA: ${heapUsedMB.toFixed(1)}MB!`);
    
    // Forçar GC emergencial
    if (global.gc) {
      global.gc();
      const afterGC = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`🗑️ Após GC: ${afterGC.toFixed(1)}MB`);
    }
  }
}, 60000); // Verificar a cada 1 minuto

// ===== EXEMPLO 8: Graceful shutdown =====
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, fechando gracefully...');
  
  // Fechar browser se estiver aberto
  await puppeteerOptimized.closeBrowser();
  
  // Limpar fila
  cardQueue.clear();
  
  // Fechar servidor
  process.exit(0);
});

// ===== EXEMPLO 9: Tratamento de erro de memória =====
process.on('uncaughtException', async (err) => {
  if (err.message.includes('out of memory')) {
    console.error('❌ ERRO: Memória esgotada!');
    
    // Limpar tudo
    await puppeteerOptimized.closeBrowser();
    cardQueue.clear();
    
    if (global.gc) {
      global.gc();
    }
    
    // Reiniciar processo (PM2 vai relançar)
    process.exit(1);
  }
});

module.exports = {
  gerarCardOtimizado,
  gerarImagemCanvas,
  processarImagemSharp
};
