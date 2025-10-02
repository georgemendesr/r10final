const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🔍 Debug da animação de highlight...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navegar para a página
    await page.goto('http://localhost:5175/post/21', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Esperar o conteúdo carregar
    await page.waitForSelector('.prose', { timeout: 10000 });
    
    // Procurar por elementos highlight-animated
    const highlights = await page.$$eval('.highlight-animated, [data-highlight="animated"], span[class*="highlight-animated"]', 
      elements => elements.map(el => ({
        className: el.className,
        dataHighlight: el.getAttribute('data-highlight'),
        style: el.getAttribute('style'),
        text: el.textContent?.substring(0, 100) + '...',
        outerHTML: el.outerHTML.substring(0, 200) + '...'
      }))
    );
    
    console.log('🎨 Elementos highlight encontrados:');
    console.log(highlights);
    
    // Verificar se existe o CSS de keyframes
    const hasKeyframes = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let hasHighlightPulse = false;
      
      try {
        sheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
              if (rule.cssText && rule.cssText.includes('highlight-pulse')) {
                hasHighlightPulse = true;
              }
            });
          } catch (e) {
            // Ignorar erros de CORS
          }
        });
      } catch (e) {
        // Ignorar erros
      }
      
      return hasHighlightPulse;
    });
    
    console.log('🎯 CSS highlight-pulse encontrado:', hasKeyframes);
    
    // Verificar IntersectionObserver
    const hasObserver = await page.evaluate(() => {
      return typeof window.IntersectionObserver !== 'undefined';
    });
    
    console.log('👁️ IntersectionObserver disponível:', hasObserver);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();