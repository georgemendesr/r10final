const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🔍 Debug COMPLETO da animação...');
    
    browser = await puppeteer.launch({ 
      headless: false, // Modo não headless para ver o que acontece
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true
    });
    
    const page = await browser.newPage();
    
    // Interceptar console.log da página
    page.on('console', (msg) => {
      console.log('🌐 [BROWSER]:', msg.text());
    });
    
    // Navegar para a página
    await page.goto('http://localhost:5175/post/21', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('📄 Página carregada, verificando elementos...');
    
    // Aguardar um pouco para garantir que JavaScript foi executado
    await page.waitForTimeout(2000);
    
    // Verificar se existem highlights
    const highlightInfo = await page.evaluate(() => {
      const highlights = document.querySelectorAll('.highlight-animated, [data-highlight="animated"]');
      return Array.from(highlights).map(el => ({
        className: el.className,
        dataHighlight: el.getAttribute('data-highlight'),
        style: el.getAttribute('style'),
        text: el.textContent?.substring(0, 50) + '...',
        parentTag: el.parentElement?.tagName
      }));
    });
    
    console.log('🎨 Highlights encontrados:', highlightInfo.length);
    highlightInfo.forEach((h, i) => {
      console.log(`  ${i + 1}:`, h);
    });
    
    if (highlightInfo.length === 0) {
      console.log('❌ NENHUM HIGHLIGHT ENCONTRADO! Verificando HTML bruto...');
      
      const rawHTML = await page.evaluate(() => {
        const prose = document.querySelector('.prose');
        return prose ? prose.innerHTML.substring(0, 1000) + '...' : 'PROSE NÃO ENCONTRADO';
      });
      
      console.log('📝 HTML bruto:', rawHTML);
    }
    
    // Aguardar mais um pouco antes de fechar
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();