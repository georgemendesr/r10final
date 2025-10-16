#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const R2_MAPPING = require('./md5-to-r2-mapping.json');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';

console.log('='.repeat(70));
console.log('🚀 ATUALIZAÇÃO FORÇADA: Arquivo DB com VACUUM');
console.log('='.repeat(70));
console.log();

// Função para calcular MD5 do conteúdo
function calculateMD5(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (err) {
    return null;
  }
}

// Função para buscar URL no mapeamento
function findR2URL(md5hash, ext) {
  const withExt = `${md5hash}.${ext}`;
  const withoutExt = md5hash;
  
  if (R2_MAPPING[withExt]) {
    return R2_MAPPING[withExt].replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);
  }
  if (R2_MAPPING[withoutExt]) {
    return R2_MAPPING[withoutExt].replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);
  }
  return null;
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Desabilitar auto-commit e usar modo WAL
db.run('PRAGMA journal_mode = DELETE');
db.run('PRAGMA synchronous = FULL');

// Buscar TODAS as notícias com imagens
db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem IS NOT NULL ORDER BY id', (err, rows) => {
  if (err) {
    console.error('❌ Erro ao consultar:', err);
    db.close();
    return;
  }

  console.log(`📊 Total de notícias: ${rows.length}`);
  console.log();
  console.log('🔄 Processando...');

  let updated = 0;
  const startTime = Date.now();

  // Processar TODAS de uma vez em uma transação única
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE TRANSACTION');

    rows.forEach((row, index) => {
      const imageName = row.imagem.split('/').pop();
      
      // Tentar em /uploads/editor
      let localPath = path.join(UPLOADS_DIR, 'editor', imageName);
      let md5hash = null;
      
      if (fs.existsSync(localPath)) {
        md5hash = calculateMD5(localPath);
      } else {
        // Tentar em /uploads/imagens
        localPath = path.join(UPLOADS_DIR, 'imagens', imageName);
        if (fs.existsSync(localPath)) {
          md5hash = calculateMD5(localPath);
        }
      }

      if (md5hash) {
        const ext = path.extname(imageName).slice(1);
        const r2url = findR2URL(md5hash, ext);
        
        if (r2url) {
          db.run('UPDATE noticias SET imagem = ? WHERE id = ?', [r2url, row.id], (err) => {
            if (!err) updated++;
          });
        }
      }

      if ((index + 1) % 1000 === 0) {
        process.stdout.write(`\r📝 Processados: ${index + 1}/${rows.length}`);
      }
    });

    console.log(`\n\n🔄 Fazendo COMMIT...`);
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('❌ Erro no COMMIT:', err);
        db.close();
        return;
      }

      console.log('✅ COMMIT concluído!');
      console.log();
      console.log('🔄 Fazendo VACUUM para forçar gravação...');
      
      db.run('VACUUM', (err) => {
        if (err) {
          console.error('❌ Erro no VACUUM:', err);
          db.close();
          return;
        }

        console.log('✅ VACUUM concluído!');
        console.log();
        console.log('='.repeat(70));
        console.log('✅ PROCESSO CONCLUÍDO!');
        console.log('='.repeat(70));
        console.log();
        console.log(`📊 Atualizados: ${updated}`);
        console.log(`⏱️  Tempo: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        console.log();
        console.log('🎯 Próximos passos:');
        console.log('   1. Verificar hash: git hash-object arquivo/arquivo.db');
        console.log('   2. Add forçado: git add -f arquivo/arquivo.db');
        console.log('   3. Commit: git commit -m "fix: Banco atualizado com URLs R2 corretas"');
        console.log('   4. Push: git push origin master');
        console.log();

        db.close();
      });
    });
  });
});
