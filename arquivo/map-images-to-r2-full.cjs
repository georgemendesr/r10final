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
console.log('🚀 MAPEAMENTO COMPLETO: Todas as 15.903 Notícias');
console.log('='.repeat(70));
console.log();
console.log('⏳ Isso pode demorar alguns minutos...');
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

// Buscar TODAS as notícias com imagens
db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem IS NOT NULL ORDER BY id', async (err, rows) => {
  if (err) {
    console.error('❌ Erro ao consultar:', err);
    db.close();
    return;
  }

  console.log(`📊 Total de notícias com imagens: ${rows.length}`);
  console.log();

  let found = 0;
  let notFound = 0;
  let updated = 0;
  const batchSize = 100;
  let currentBatch = [];

  const startTime = Date.now();

  // Processar em lotes para melhor performance
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
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
        currentBatch.push({ id: row.id, url: r2url });
        found++;
      } else {
        notFound++;
      }
    } else {
      notFound++;
    }

    // Atualizar em lotes de 100
    if (currentBatch.length >= batchSize || i === rows.length - 1) {
      await new Promise((resolve) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          currentBatch.forEach(item => {
            db.run('UPDATE noticias SET imagem = ? WHERE id = ?', [item.url, item.id], (err) => {
              if (!err) updated++;
            });
          });
          
          db.run('COMMIT', () => {
            const progress = ((i + 1) / rows.length * 100).toFixed(1);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`\r🔄 Processando: ${progress}% (${i + 1}/${rows.length}) | ✅ ${found} | ❌ ${notFound} | Tempo: ${elapsed}s`);
            currentBatch = [];
            resolve();
          });
        });
      });
    }
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('✅ PROCESSO CONCLUÍDO!');
  console.log('='.repeat(70));
  console.log();
  console.log(`📊 Estatísticas:`);
  console.log(`   - Total processado: ${rows.length}`);
  console.log(`   - Encontrados e mapeados: ${found} (${(found/rows.length*100).toFixed(1)}%)`);
  console.log(`   - Não encontrados: ${notFound} (${(notFound/rows.length*100).toFixed(1)}%)`);
  console.log(`   - Atualizados no banco: ${updated}`);
  console.log();
  console.log(`⏱️  Tempo total: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log();
  console.log('🎉 Próximos passos:');
  console.log('   1. Commit e push: git add arquivo.db && git commit -m "fix: Imagens R2 mapeadas corretamente"');
  console.log('   2. Aguardar deploy no Render (3-5 minutos)');
  console.log('   3. Testar: https://r10piaui.onrender.com/arquivo');
  console.log();

  db.close();
});
