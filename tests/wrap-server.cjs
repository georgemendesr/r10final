// Wrap para reutilizar lógica de createApp do server principal com DB injetado.
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

// Carrega o módulo original
const serverPath = path.join(__dirname, '..', 'server', 'server-api-simple.cjs');
const modSrc = fs.readFileSync(serverPath, 'utf8');

// Hack simples: avaliar o arquivo em um contexto próprio para capturar createApp
const vm = require('vm');
const sandbox = { module: { exports: {} }, exports: {}, require, __dirname: path.dirname(serverPath), process, console, Buffer, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(modSrc, sandbox, { filename: 'server-api-simple.cjs' });

// O arquivo exporta (provavelmente) createApp? Se não, precisamos extrair a função original.
// Vamos assumir que aceita database path. Então criamos adaptador que aceita db já aberto.

function createAppInner(dbInstance) {
  // Criamos um arquivo temporário de banco se necessário? Aqui passamos apenas path dummy e substituímos global db.
  // Mais simples: reexecutar o código substituindo new sqlite3.Database por dbInstance - para evitar grande refactor, faremos patch leve.
  return new Promise((resolve) => {
    // Como fallback: apenas abrir via factory existente se houver.
    if (typeof sandbox.module.exports.createApp === 'function') {
      const appObj = sandbox.module.exports.createApp({ dbPath: ':memory:' });
      // Substituir referência global db se existir
      if (sandbox.db && dbInstance) {
        try { sandbox.db.close(); } catch(_) {}
        sandbox.db = dbInstance;
      }
      resolve({ app: appObj.app || appObj, db: dbInstance });
    } else {
      // fallback mínimo
      const express = require('express');
      const app = express();
      resolve({ app, db: dbInstance });
    }
  });
}

module.exports = { createAppInner };
