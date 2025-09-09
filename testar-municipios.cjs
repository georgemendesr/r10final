// Teste simples para verificar se a consulta dos municípios funciona
async function testarMunicipios() {
  try {
    console.log('🔍 Testando busca por municípios...');
    
    // Lista dos municípios para testar
    const municipios = [
      'piripiri', 'pedro-ii', 'brasileira', 'lagoa-de-sao-francisco',
      'piracuruca', 'sao-jose-do-divino'
    ];
    
    // Testar busca por categoria
    for (const municipio of municipios) {
      const response = await fetch(`http://127.0.0.1:3002/api/posts?categoria=${municipio}`);
      const data = await response.json();
      
      if (data.posts && data.posts.length > 0) {
        console.log(`✅ ${municipio}: ${data.posts.length} notícias encontradas`);
        data.posts.forEach(post => {
          console.log(`   - ID ${post.id}: ${post.titulo}`);
        });
      } else {
        console.log(`❌ ${municipio}: Nenhuma notícia encontrada`);
      }
    }
    
    // Testar busca geral
    console.log('\n🔍 Testando busca geral de posts...');
    const responseGeral = await fetch('http://127.0.0.1:3002/api/posts');
    const dataGeral = await responseGeral.json();
    console.log(`📊 Total de posts: ${dataGeral.posts.length}`);
    
    // Verificar quantos têm categoria de município
    const postsComMunicipio = dataGeral.posts.filter(post => 
      municipios.includes(post.categoria)
    );
    console.log(`🏘️ Posts com categoria de município: ${postsComMunicipio.length}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testarMunicipios();
