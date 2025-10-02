const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🔍 Testando renderização da matéria 21...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navegar para a página
    console.log('📄 Navegando para http://localhost:5175/post/21');
    await page.goto('http://localhost:5175/post/21', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Esperar o conteúdo carregar
    await page.waitForSelector('.prose', { timeout: 10000 });
    
    // Verificar se existem blockquotes
    const blockquotes = await page.$$('blockquote');
    console.log(`📌 Blockquotes encontradas: ${blockquotes.length}`);
    
    if (blockquotes.length > 0) {
      for (let i = 0; i < blockquotes.length; i++) {
        const text = await blockquotes[i].evaluate(el => el.textContent?.trim());
        console.log(`🎯 Blockquote ${i + 1}: "${text}"`);
      }
    }
    
    // Verificar o conteúdo do artigo
    const articleContent = await page.$('.prose');
    if (articleContent) {
      const fullText = await articleContent.evaluate(el => el.textContent);
      console.log('📝 Conteúdo detectado (primeiros 200 chars):');
      console.log(fullText?.substring(0, 200) + '...');
      
      // Verificar se há elementos com classe article-html-content
      const htmlContent = await page.$$('.article-html-content');
      console.log(`🔧 Elementos HTML processados: ${htmlContent.length}`);
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();