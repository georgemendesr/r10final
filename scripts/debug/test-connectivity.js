const http = require('http');

console.log('🔍 Testando conectividade com a API...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts?posicao=supermanchete',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const posts = JSON.parse(data);
      console.log('✅ API funcionando!');
      console.log(`📊 Encontradas ${posts.length} supermanchete(s)`);
      if (posts.length > 0) {
        console.log('🎯 Primeira supermanchete:');
        console.log(`   ID: ${posts[0].id}`);
        console.log(`   Título: ${posts[0].titulo}`);
        console.log(`   Posição: ${posts[0].posicao}`);
      }
    } catch (e) {
      console.log('❌ Erro ao parsear resposta:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

req.end();
