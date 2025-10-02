const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🔍 Testando animação no scroll...');
    
    browser = await puppeteer.default.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await puppeteer.newPage();
    
    // Navegar para a página
    await page.goto('http://localhost:5175/post/21', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Esperar o conteúdo carregar
    await page.waitForSelector('.prose', { timeout: 10000 });
    
    // Verificar estado INICIAL da animação (deve estar invisível)
    const initialState = await page.$eval('.highlight-animated', el => {
      const style = el.getAttribute('style');
      const backgroundSize = style?.match(/background-size:\s*([^;!]+)/)?.[1];
      return {
        backgroundSize: backgroundSize?.trim(),
        isVisible: backgroundSize?.includes('100%') || false
      };
    });
    
    console.log('📍 Estado INICIAL da animação:', initialState);
    
    // Rolar até o elemento (simular usuário scrollando)
    console.log('📜 Rolando página até o elemento highlight...');
    await page.evaluate(() => {
      const element = document.querySelector('.highlight-animated');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // Aguardar um pouco para a animação acontecer
    await page.waitForTimeout(3000);
    
    // Verificar estado APÓS scroll (deve estar visível/animado)
    const afterScrollState = await page.$eval('.highlight-animated', el => {
      const style = el.getAttribute('style');
      const backgroundSize = style?.match(/background-size:\s*([^;!]+)/)?.[1];
      return {
        backgroundSize: backgroundSize?.trim(),
        isVisible: backgroundSize?.includes('100%') || false,
        dataAnimated: el.getAttribute('data-animated')
      };
    });
    
    console.log('✨ Estado APÓS scroll:', afterScrollState);
    
    // Verificar se a animação funcionou corretamente
    if (!initialState.isVisible && afterScrollState.isVisible) {
      console.log('🎉 SUCCESS: Animação funcionou perfeitamente!');
      console.log('   ✅ Inicial: invisível (background-size: 0%)');
      console.log('   ✅ Após scroll: visível (background-size: 100%)');
    } else {
      console.log('❌ PROBLEMA na animação:');
      console.log(`   - Inicial visível: ${initialState.isVisible}`);
      console.log(`   - Após scroll visível: ${afterScrollState.isVisible}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();