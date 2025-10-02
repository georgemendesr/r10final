const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🔍 Debug específico da blockquote...');
    
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
    
    // Verificar HTML da blockquote
    const blockquoteHTML = await page.$eval('blockquote', el => el.outerHTML);
    console.log('🏷️ HTML da blockquote:');
    console.log(blockquoteHTML);
    
    // Verificar o parent da blockquote
    const parentHTML = await page.$eval('blockquote', el => el.parentElement?.outerHTML || 'No parent');
    console.log('');
    console.log('👨‍👦 HTML do parent:');
    console.log(parentHTML.substring(0, 500) + '...');
    
    // Verificar se há divs com classe article-html-content
    const htmlContentDivs = await page.$$eval('.article-html-content, [dangerously-set-inner-html]', 
      els => els.map(el => ({ 
        tagName: el.tagName, 
        className: el.className, 
        innerHTML: el.innerHTML.substring(0, 200) + '...'
      }))
    );
    
    console.log('');
    console.log('🔧 Divs com conteúdo HTML:');
    console.log(htmlContentDivs);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();