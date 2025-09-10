const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts?posicao=supermanchete',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Resultado:', parsed.map(p => ({id: p.id, titulo: p.titulo, posicao: p.posicao})));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro:', error);
});

req.end();
