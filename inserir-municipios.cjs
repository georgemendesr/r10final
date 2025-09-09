const fs = require('fs');
const path = require('path');

// Ler o arquivo JSON com as notícias
const noticiasPath = path.join(__dirname, 'municipios-noticias.json');
const noticias = JSON.parse(fs.readFileSync(noticiasPath, 'utf8'));

console.log('🏛️ INSERINDO NOTÍCIAS DOS MUNICÍPIOS');
console.log('===================================');

async function inserirNoticias() {
  const API_BASE = 'http://127.0.0.1:3002';
  
  for (let i = 0; i < noticias.length; i++) {
    const noticia = noticias[i];
    
    try {
      console.log(`📰 Inserindo: ${noticia.titulo.substring(0, 50)}...`);
      
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noticia)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Notícia inserida com ID: ${result.id}`);
      } else {
        console.log(`❌ Erro ao inserir notícia: ${response.status}`);
      }
      
      // Pequena pausa entre inserções
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Erro ao inserir notícia: ${error.message}`);
    }
  }
  
  console.log('\n🎉 PROCESSO CONCLUÍDO!');
  console.log('📊 Verificando notícias inseridas...');
  
  // Verificar total de posts
  try {
    const response = await fetch(`${API_BASE}/api/posts`);
    const allPosts = await response.json();
    console.log(`📈 Total de posts no banco: ${allPosts.length}`);
    
    // Contar por município
    const municipios = {};
    allPosts.forEach(post => {
      if (post.categoria && post.categoria !== 'geral' && post.categoria !== 'destaque') {
        municipios[post.categoria] = (municipios[post.categoria] || 0) + 1;
      }
    });
    
    console.log('\n🏛️ POSTS POR MUNICÍPIO:');
    Object.entries(municipios).forEach(([municipio, count]) => {
      console.log(`  ${municipio}: ${count} posts`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar posts:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  inserirNoticias().catch(console.error);
}

module.exports = { inserirNoticias };
