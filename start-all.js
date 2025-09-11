const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando todos os serviços com Forever...');

// Backend
const backend = spawn('node', ['server-api-simple.cjs'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
});

// Frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'r10-front_full_07ago'),
  stdio: 'inherit',
  shell: true
});

// Instagram
const instagram = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'instagram-publisher'),
  stdio: 'inherit'
});

console.log('✅ Todos os serviços iniciados!');

// Manter o processo principal vivo
process.on('SIGINT', () => {
  console.log('🛑 Parando todos os serviços...');
  backend.kill();
  frontend.kill();
  instagram.kill();
  process.exit(0);
});
