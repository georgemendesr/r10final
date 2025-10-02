// Utilitário para criar instância do app compartilhando DB em memória ou arquivo de teste.
// Ajusta createApp para aceitar DB já aberto.
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

// Requer o arquivo principal e substitui a lógica interna de abertura de DB se necessário.
const serverModulePath = path.join(__dirname, '..', 'server', 'server-api-simple.cjs');

// Monkey: exportar factory adaptada sem modificar o arquivo original demais.
// O arquivo original define createApp; aqui reusamos e injetamos DB custom via patch rápido.

function createAppAndDb(db) {
  // O server-api-simple.cjs espera um path; então vamos criar função compatível replicando parte minima.
  // Como alternativa, poderíamos abrir DB em memória e copiar seed.
  const { createAppInner } = require('./wrap-server.cjs');
  return createAppInner(db);
}

module.exports = { createAppAndDb };
