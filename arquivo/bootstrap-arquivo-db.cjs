#!/usr/bin/env node
/**
 * Script automático: garante que o banco do módulo /arquivo seja copiado
 * para a pasta oficial de dados usada pelo servidor principal, SEM tocar
 * no banco principal (noticias.db / r10piaui.db) se já existir.
 *
 * Objetivo: você não precisa fazer nada manual. Ao iniciar o servidor,
 * este script roda e garante a presença do banco isolado em
 * ./arquivo/arquivo.db e, se configurado por variável, permite override.
 */
const fs = require('fs');
const path = require('path');

function log(msg){ console.log('[arquivo-bootstrap]', msg); }
function warn(msg){ console.warn('[arquivo-bootstrap][WARN]', msg); }
function err(msg){ console.error('[arquivo-bootstrap][ERROR]', msg); }

try {
  const root = process.cwd();
  const localDb = path.join(root, 'arquivo', 'arquivo.db');
  const dataDir = path.join(root, 'data');
  const legacy1 = path.join(dataDir, 'noticias.db');
  const legacy2 = path.join(dataDir, 'r10piaui.db');

  if (!fs.existsSync(localDb)) {
    warn('Banco local ./arquivo/arquivo.db NÃO existe. Nada a fazer.');
    process.exit(0);
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    log('Criado diretório data/');
  }

  // Estratégia: NÃO sobrescrever bancos existentes (evita risco)
  let target = null;
  if (fs.existsSync(legacy1)) {
    target = legacy1;
    log('Detectado banco noticias.db. NÃO será sobrescrito.');
  } else if (fs.existsSync(legacy2)) {
    target = legacy2;
    log('Detectado banco r10piaui.db. NÃO será sobrescrito.');
  } else {
    // Nenhum banco principal existe: podemos publicar uma cópia somente para o módulo se necessário
    const replica = path.join(dataDir, 'arquivo.db');
    if (!fs.existsSync(replica)) {
      fs.copyFileSync(localDb, replica);
      log('Copiado arquivo ./arquivo/arquivo.db -> data/arquivo.db');
    } else {
      log('Replica data/arquivo.db já existe. Mantido.');
    }
  }

  log('Bootstrap concluído.');
} catch (e) {
  err('Falha no bootstrap: ' + e.message);
  process.exit(1);
}
