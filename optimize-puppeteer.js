// ========================================
// OTIMIZADOR DE PUPPETEER
// Reduz de 8-10 processos para 3-4
// ========================================

/**
 * Configuração otimizada do Puppeteer para produção
 * Reduz drasticamente o consumo de processos e memória
 */

const OPTIMIZED_PUPPETEER_ARGS = [
  // ===== REDUÇÃO DE PROCESSOS =====
  '--single-process', // CRÍTICO: Força processo único (economiza ~5 processos)
  '--no-zygote', // Remove processo zygote (economiza ~2 processos)
  '--no-sandbox', // Necessário em ambientes containerizados
  '--disable-setuid-sandbox',
  
  // ===== REDUÇÃO DE MEMÓRIA =====
  '--disable-dev-shm-usage', // Usa /tmp em vez de /dev/shm (evita erro em low-memory)
  '--disable-accelerated-2d-canvas', // Desabilita aceleração GPU (economiza RAM)
  '--disable-gpu', // Sem GPU em servidor
  '--disable-software-rasterizer',
  
  // ===== PERFORMANCE =====
  '--disable-background-networking', // Sem downloads em background
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad', // Sem crash reporter
  '--disable-component-extensions-with-background-pages',
  '--disable-extensions',
  '--disable-features=TranslateUI',
  '--disable-ipc-flooding-protection',
  '--disable-renderer-backgrounding',
  
  // ===== SEGURANÇA RELAXADA (apenas para screenshots) =====
  '--disable-web-security', // Se precisar capturar cross-origin
  '--allow-running-insecure-content',
  
  // ===== TAMANHO DA JANELA =====
  '--window-size=1920,1080',
  '--hide-scrollbars',
  '--mute-audio'
];

/**
 * Singleton do Puppeteer Browser
 * Evita múltiplas instâncias simultâneas
 */
let browserInstance = null;
let browserPromise = null;

async function getOptimizedBrowser() {
  // Se já existe uma promessa de criação em andamento, aguarda
  if (browserPromise) {
    return browserPromise;
  }
  
  // Se já existe instância ativa, retorna
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  // Cria nova instância com configurações otimizadas
  const puppeteer = require('puppeteer');
  
  browserPromise = puppeteer.launch({
    headless: 'new', // Usa novo headless mode
    args: OPTIMIZED_PUPPETEER_ARGS,
    ignoreHTTPSErrors: true,
    dumpio: false, // Não logar tudo
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  });
  
  browserInstance = await browserPromise;
  browserPromise = null;
  
  console.log('🚀 Puppeteer otimizado iniciado (single-process)');
  
  // Limpar em caso de desconexão
  browserInstance.on('disconnected', () => {
    console.warn('⚠️ Puppeteer desconectado');
    browserInstance = null;
  });
  
  return browserInstance;
}

/**
 * Fecha o browser e libera memória
 * Chame após gerar cada card!
 */
async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      console.log('✅ Puppeteer fechado, memória liberada');
    } catch (err) {
      console.error('❌ Erro ao fechar Puppeteer:', err.message);
    } finally {
      browserInstance = null;
      browserPromise = null;
      
      // CRÍTICO: Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
        console.log('🗑️ Garbage collection executado');
      }
    }
  }
}

/**
 * Wrapper para criar página otimizada
 */
async function createOptimizedPage() {
  const browser = await getOptimizedBrowser();
  const page = await browser.newPage();
  
  // Desabilitar recursos desnecessários
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    // Bloquear recursos pesados desnecessários
    if (['font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });
  
  // Timeout conservador
  page.setDefaultNavigationTimeout(30000);
  page.setDefaultTimeout(30000);
  
  return page;
}

module.exports = {
  getOptimizedBrowser,
  closeBrowser,
  createOptimizedPage,
  OPTIMIZED_PUPPETEER_ARGS
};
