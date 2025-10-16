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
console.log('🔍 MAPEAMENTO CORRETO: Arquivos Locais → R2');
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
  // Tenta com e sem extensão
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

// Buscar todas as notícias com imagens
db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem IS NOT NULL LIMIT 50', async (err, rows) => {
  if (err) {
    console.error('❌ Erro ao consultar:', err);
    db.close();
    return;
  }

  console.log(`📊 Processando ${rows.length} notícias (amostra)...\n`);

  const updates = [];
  let found = 0;
  let notFound = 0;

  for (const row of rows) {
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
        updates.push({ id: row.id, oldImage: imageName, newImage: r2url });
        found++;
        console.log(`✅ ID ${row.id}: ${imageName.substring(0, 40)}...`);
        console.log(`   MD5: ${md5hash}`);
        console.log(`   R2: ${r2url.split('/').pop()}`);
        console.log();
      } else {
        notFound++;
        console.log(`❌ ID ${row.id}: ${imageName.substring(0, 40)}... (não encontrado no R2)`);
        console.log(`   MD5: ${md5hash}`);
        console.log();
      }
    } else {
      notFound++;
      console.log(`❌ ID ${row.id}: ${imageName.substring(0, 40)}... (arquivo não existe localmente)`);
      console.log();
    }
  }

  console.log('='.repeat(70));
  console.log('📊 RESULTADO DA AMOSTRA:');
  console.log('='.repeat(70));
  console.log(`✅ Encontrados: ${found}`);
  console.log(`❌ Não encontrados: ${notFound}`);
  console.log();

  if (found > 0) {
    console.log('💡 PRÓXIMO PASSO:');
    console.log('Se os resultados estão corretos, posso processar TODAS as 15.903 notícias.');
    console.log('Isso pode demorar alguns minutos (precisa calcular MD5 de milhares de arquivos).');
    console.log();
    console.log('Execute: node map-images-to-r2-full.cjs');
  } else {
    console.log('⚠️  PROBLEMA:');
    console.log('Nenhuma correspondência encontrada. Possíveis causas:');
    console.log('1. Os nomes no banco não batem com os nomes locais');
    console.log('2. O mapeamento JSON tem estrutura diferente');
    console.log('3. Os arquivos locais não são os mesmos que foram enviados ao R2');
  }
  console.log();

  db.close();
});
