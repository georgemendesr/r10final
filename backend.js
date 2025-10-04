// Wrapper simples para iniciar a API principal.
// Objetivo: ficar claro no painel qual arquivo iniciar (backend.js) sem caçar caminhos.
// Ele apenas carrega o servidor real em server/server-api-simple.cjs.

console.log('[BOOT] Iniciando R10 API via backend.js...');

try {
  require('./server/server-api-simple.cjs');
} catch (err) {
  console.error('[BOOT][ERRO] Falha ao carregar server/server-api-simple.cjs');
  console.error(err);
  process.exit(1);
}
