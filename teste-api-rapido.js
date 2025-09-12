// Teste rápido da API
const http = require('http');

console.log('🔍 Testando API...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const posts = JSON.parse(data);
      console.log(`📊 Total de posts encontrados: ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('📰 Primeiros 3 posts:');
        posts.slice(0, 3).forEach((post, i) => {
          console.log(`   ${i+1}. ID ${post.id} [${post.posicao}] - ${post.titulo.substring(0, 50)}...`);
        });
        console.log('\n🎉 AS NOTÍCIAS ESTÃO LÁ! Problema é no frontend.');
      } else {
        console.log('❌ Nenhum post retornado pela API');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error.message);
      console.log('Raw data:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.error('❌ Erro completo:', error);
});

req.end();