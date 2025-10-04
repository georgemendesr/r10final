// Entry point para o cPanel (API principal)
// Usa a API real que está em server/server-api-simple.cjs
// Mantemos separado de server.js (Instagram) para não confundir.

console.log('[APP] Iniciando API principal via app.js');

try {
  require('./server/server-api-simple.cjs');
} catch (e) {
  console.error('[APP][ERRO] Não foi possível carregar server/server-api-simple.cjs');
  console.error(e);
  process.exit(1);
}
