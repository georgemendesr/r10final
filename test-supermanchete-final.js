const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts?posicao=supermanchete',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('🔍 Testando getPostsByPosition("supermanchete", 1)...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✅ API retornou:', parsed.length, 'item(s)');
      if (parsed.length > 0) {
        const first = parsed[0];
        console.log('🎯 Supermanchete encontrada:');
        console.log('   ID:', first.id);
        console.log('   Título:', first.titulo);
        console.log('   Posição:', first.posicao);
        console.log('');
        console.log('🟢 A supermanchete "Forró do Idoso anima comunidade no CRAS I em Piripiri" deveria aparecer no frontend!');
      } else {
        console.log('❌ Nenhuma supermanchete encontrada');
      }
    } catch (e) {
      console.log('❌ Erro ao parsear resposta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

req.end();
