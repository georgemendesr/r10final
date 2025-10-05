#!/usr/bin/env node
/**
 * Script de inicialização para Render.com
 * Garante que pastas críticas existem no disco persistente
 */

const fs = require('fs');
const path = require('path');

console.log('[init-render] Preparando ambiente...');

// Diretório base do disco persistente (montado em /opt/render/project/src/data)
const DATA_DIR = process.env.DATA_DIR || '/opt/render/project/src/data';
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'imagens');
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'noticias.db');

// Criar diretórios se não existirem
const dirs = [DATA_DIR, UPLOADS_DIR, IMAGES_DIR];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`[init-render] Criando diretório: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`[init-render] ✓ Diretório existe: ${dir}`);
  }
});

// Verificar permissões de escrita
try {
  const testFile = path.join(DATA_DIR, '.write-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('[init-render] ✓ Disco persistente com permissão de escrita');
} catch (err) {
  console.error('[init-render] ⚠️ ERRO: Sem permissão de escrita no disco:', err.message);
  process.exit(1);
}

// Verificar se banco existe (se não, será criado no primeiro start)
if (fs.existsSync(DB_PATH)) {
  const stats = fs.statSync(DB_PATH);
  console.log(`[init-render] ✓ Banco SQLite encontrado: ${DB_PATH} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.log(`[init-render] ℹ️ Banco será criado em: ${DB_PATH}`);
}

// Criar symlink de uploads para a pasta do disco (se não existir)
const projectUploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(projectUploadsPath)) {
  try {
    // Em ambiente Linux (Render), criar symlink
    if (process.platform !== 'win32') {
      fs.symlinkSync(UPLOADS_DIR, projectUploadsPath, 'dir');
      console.log(`[init-render] ✓ Symlink criado: ${projectUploadsPath} -> ${UPLOADS_DIR}`);
    } else {
      console.log('[init-render] ℹ️ Windows detectado, symlink pulado (dev local)');
    }
  } catch (err) {
    console.warn('[init-render] ⚠️ Não foi possível criar symlink:', err.message);
    console.warn('[init-render] Use UPLOADS_PATH env var no código para apontar direto');
  }
}

console.log('[init-render] ✅ Inicialização completa');
console.log('[init-render] Estrutura:');
console.log(`  - Data dir: ${DATA_DIR}`);
console.log(`  - Uploads: ${UPLOADS_DIR}`);
console.log(`  - Database: ${DB_PATH}`);
