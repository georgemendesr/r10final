const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Servidor de teste funcionando' }));
});

server.listen(3002, '127.0.0.1', () => {
  console.log('✅ Servidor de teste rodando em http://127.0.0.1:3002');
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
});

// Manter o processo vivo
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
