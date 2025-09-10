const http = require('http');

console.log('🚀 TESTE RÁPIDO DE CONECTIVIDADE...\n');

// Teste Backend
console.log('1️⃣ Testando Backend (porta 3002)...');
const testAPI = http.request({hostname: 'localhost', port: 3002, path: '/api/health'}, (res) => {
  console.log('✅ BACKEND FUNCIONANDO! Status:', res.statusCode);
});
testAPI.on('error', () => console.log('❌ Backend não responde'));
testAPI.end();

// Teste Frontend  
console.log('2️⃣ Testando Frontend (porta 5175)...');
const testFront = http.request({hostname: 'localhost', port: 5175, path: '/'}, (res) => {
  console.log('✅ FRONTEND FUNCIONANDO! Status:', res.statusCode);
  console.log('\n🎉 AMBOS OS SERVIÇOS ATIVOS!');
  console.log('🌐 Acesse: http://localhost:5175');
});
testFront.on('error', () => console.log('❌ Frontend não responde'));
testFront.end();
