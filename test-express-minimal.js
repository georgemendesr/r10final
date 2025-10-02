// TESTE MÍNIMO: Express consegue abrir porta?
const express = require('express');
const app = express();
const PORT = 7777;

console.log(`🔍 Testando Express básico na porta ${PORT}...`);

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Express funcionando!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor teste iniciado na porta ${PORT}`);
  console.log(`🌐 Teste: curl http://localhost:${PORT}/test`);
});

server.on('error', (err) => {
  console.error('❌ ERRO:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Porta ${PORT} em uso!`);
  }
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  console.log(`👂 Servidor REALMENTE escutando em ${addr.address}:${addr.port}`);
});

setTimeout(() => {
  console.log('\n📊 Verificando status do servidor após 3 segundos...');
  console.log('  - Listening?', server.listening);
  const addr = server.address();
  if (addr) {
    console.log(`  - Address: ${addr.address}:${addr.port}`);
  } else {
    console.log('  - ❌ Endereço NULL (servidor não está escutando!)');
  }
}, 3000);
