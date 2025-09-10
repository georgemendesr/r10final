// Script intermediário para iniciar o Vite via PM2
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Iniciando frontend via PM2...');

// Executa npm run dev de forma segura (sem shell para evitar janelas CMD)
const isWindows = process.platform === 'win32';

const child = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
  stdio: 'inherit',
  shell: false,
  cwd: process.cwd(),
  windowsHide: true // Oculta janelas no Windows
});

child.on('error', (error) => {
  console.error('❌ Erro ao iniciar frontend:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`📋 Frontend finalizou com código: ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Parando frontend...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Terminando frontend...');
  child.kill('SIGTERM');
});
