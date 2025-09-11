#!/usr/bin/env node

const concurrently = require('concurrently');
const path = require('path');

console.log('🚀 Iniciando Sistema R10 Piauí...\n');

const commands = [
  {
    command: 'node server-api-simple.cjs',
    name: 'BACKEND',
    cwd: path.join(__dirname, 'server'),
    prefixColor: 'green'
  },
  {
    command: 'npm run dev',
    name: 'FRONTEND', 
    cwd: path.join(__dirname, 'r10-front_full_07ago'),
    prefixColor: 'cyan'
  },
  {
    command: 'node server.js',
    name: 'INSTAGRAM',
    cwd: __dirname,
    prefixColor: 'yellow'
  }
];

async function startServices() {
  try {
    console.log('🔥 Iniciando todos os serviços...\n');
    
    const { result } = concurrently(
      commands,
      {
        prefix: '[{name}]',
        killOthers: ['failure', 'success'],
        restartTries: 5,
        restartDelay: 2000,
        successCondition: 'first',
        raw: false
      }
    );

    await result;
  } catch (error) {
    console.error('❌ Erro ao iniciar serviços:', error);
    process.exit(1);
  }
}

// Interceptar sinais para limpeza
process.on('SIGINT', () => {
  console.log('\n🛑 Parando todos os serviços...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando todos os serviços...');
  process.exit(0);
});

startServices();
