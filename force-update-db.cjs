#!/usr/bin/env node
/**
 * SCRIPT DE ATUALIZAÇÃO FORÇADA DO BANCO DE DADOS
 * Executa no build do Render para garantir que o banco está atualizado
 */

const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');
const UPLOADS_DIR = path.join(__dirname, 'arquivo', 'uploads');
const R2_MAPPING_PATH = path.join(__dirname, 'arquivo', 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';

console.log('\n' + '='.repeat(70));
console.log('🚀 ATUALIZAÇÃO FORÇADA: Banco de Dados do Arquivo');
console.log('='.repeat(70) + '\n');

// Verificar se arquivos necessários existem
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ ERRO: arquivo.db não encontrado em:', DB_PATH);
  process.exit(1);
}

if (!fs.existsSync(R2_MAPPING_PATH)) {
  console.error('❌ ERRO: md5-to-r2-mapping.json não encontrado');
  process.exit(1);
}

console.log('✅ Arquivo encontrado:', DB_PATH);
console.log('✅ Mapeamento encontrado:', R2_MAPPING_PATH);
console.log();

// Carregar mapeamento
const R2_MAPPING = JSON.parse(fs.readFileSync(R2_MAPPING_PATH, 'utf8'));
console.log(`📊 Mapeamento carregado: ${Object.keys(R2_MAPPING).length} entradas`);
console.log();

// Funções auxiliares
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

// Abrir banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Configurar para gravação imediata
db.run('PRAGMA journal_mode = DELETE');
db.run('PRAGMA synchronous = FULL');

console.log('🔄 Iniciando atualização...\n');

// Verificar estado atual
db.get(`SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN imagem LIKE '${R2_PUBLIC_URL}%' THEN 1 END) as com_r2
FROM noticias WHERE imagem IS NOT NULL`, (err, stats) => {
  
  if (err) {
    console.error('❌ Erro ao verificar estado:', err);
    db.close();
    process.exit(1);
  }
  
  console.log(`📊 Estado atual:`);
  console.log(`   Total com imagens: ${stats.total}`);
  console.log(`   Com R2 público: ${stats.com_r2} (${((stats.com_r2/stats.total)*100).toFixed(1)}%)`);
  console.log();
  
  if (stats.com_r2 === stats.total) {
    console.log('✅ Banco JÁ ESTÁ ATUALIZADO!');
    console.log();
    db.close();
    process.exit(0);
  }
  
  console.log('🔧 Banco PRECISA ser atualizado!');
  console.log('🔄 Processando TODAS as notícias...\n');
  
  // Buscar todas as notícias
  db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL ORDER BY id', (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar notícias:', err);
      db.close();
      process.exit(1);
    }
    
    let updated = 0;
    let notFound = 0;
    const startTime = Date.now();
    
    // Processar em transação única
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE TRANSACTION');
      
      rows.forEach((row, index) => {
        const imageName = row.imagem.split('/').pop();
        
        // Verificar se já é URL R2 pública
        if (row.imagem.startsWith(R2_PUBLIC_URL)) {
          return; // Já está correto
        }
        
        // Tentar encontrar arquivo local
        let localPath = path.join(UPLOADS_DIR, 'editor', imageName);
        let md5hash = null;
        
        if (fs.existsSync(localPath)) {
          md5hash = calculateMD5(localPath);
        } else {
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
          } else {
            notFound++;
          }
        } else {
          notFound++;
        }
        
        if ((index + 1) % 1000 === 0) {
          process.stdout.write(`\r📝 ${index + 1}/${rows.length} (${((index+1)/rows.length*100).toFixed(1)}%)`);
        }
      });
      
      console.log(`\n\n🔄 Fazendo COMMIT...`);
      
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('❌ Erro no COMMIT:', err);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ COMMIT concluído!\n');
        console.log('🔄 Executando VACUUM...');
        
        db.run('VACUUM', (err) => {
          if (err) {
            console.error('❌ Erro no VACUUM:', err);
          } else {
            console.log('✅ VACUUM concluído!\n');
          }
          
          console.log('='.repeat(70));
          console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
          console.log('='.repeat(70));
          console.log();
          console.log(`📊 Resultado:`);
          console.log(`   Total processado: ${rows.length}`);
          console.log(`   Atualizados: ${updated}`);
          console.log(`   Não encontrados: ${notFound}`);
          console.log(`   Tempo: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
          console.log();
          
          // Calcular novo hash
          const newHash = crypto.createHash('md5')
            .update(fs.readFileSync(DB_PATH))
            .digest('hex')
            .substring(0, 12);
          const newSize = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2);
          
          console.log(`📦 Hash do banco: ${newHash}...`);
          console.log(`📦 Tamanho: ${newSize} MB`);
          console.log();
          
          db.close(() => {
            console.log('🎉 Script concluído com sucesso!\n');
            process.exit(0);
          });
        });
      });
    });
  });
});
