const http = require('http');

console.log('🔍 Testando se o site está funcionando...');

// Teste do backend
const testAPI = () => {
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
        if (posts.length > 0) {
          console.log('✅ BACKEND OK - Supermanchete:');
          console.log(`   Título: ${posts[0].titulo}`);
          console.log(`   Imagem: ${posts[0].imagemUrl}`);
        } else {
          console.log('❌ Backend: Nenhuma supermanchete');
        }
      } catch (e) {
        console.log('❌ Backend: Erro ao parsear resposta');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend: Erro na conexão -', error.message);
  });

  req.end();
};

// Teste do frontend
const testFrontend = () => {
  const options = {
    hostname: 'localhost',
    port: 5175,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('✅ FRONTEND OK - Status:', res.statusCode);
  });

  req.on('error', (error) => {
    console.error('❌ Frontend: Erro na conexão -', error.message);
  });

  req.end();
};

setTimeout(() => {
  testAPI();
  testFrontend();
}, 1000);
