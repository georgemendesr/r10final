const { spawn, exec } = require('child_process');
const path = require('path');

// Função para executar processo oculto
function startHiddenProcess(command, args, options = {}) {
  const proc = spawn(command, args, {
    ...options,
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  
  proc.unref();
  return proc;
}

// Função para executar comando PowerShell oculto
function startPowerShellHidden(command, workingDir) {
  const psCommand = `Start-Process -WindowStyle Hidden -FilePath "powershell" -ArgumentList "-Command", "${command}" -WorkingDirectory "${workingDir}"`;
  exec(`powershell -WindowStyle Hidden -Command "${psCommand}"`);
}

console.log('🚀 Iniciando R10 Piauí em background (sem janelas)...');

// Backend (oculto)
startHiddenProcess('node', ['server-api-simple.cjs'], {
  cwd: path.join(__dirname, 'server')
});

// Aguardar backend iniciar
setTimeout(() => {
  // Frontend usando PowerShell para garantir execução
  const frontendDir = path.join(__dirname, 'r10-front_full_07ago');
  startPowerShellHidden('npm run dev', frontendDir);
}, 3000);

// Instagram (oculto)
setTimeout(() => {
  startHiddenProcess('node', ['server.js'], {
    cwd: path.join(__dirname, 'instagram-publisher')
  });
}, 5000);

console.log('✅ Todos os serviços iniciados em background!');
console.log('📱 Frontend: http://localhost:5175');
console.log('🔧 Backend: http://localhost:3002');
console.log('📸 Instagram: http://localhost:8080');

// Sair do processo principal após iniciar tudo
setTimeout(() => {
  process.exit(0);
}, 8000);
