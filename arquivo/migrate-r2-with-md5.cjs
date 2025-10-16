/**
 * Script Final: Migração Inteligente com Mapeamento MD5
 * 
 * ESTRATÉGIA:
 * 1. Upload de TODAS as imagens para R2 (mantendo nomes atuais)
 * 2. Calcular MD5 de cada arquivo local
 * 3. Gerar mapeamento: MD5 → URL R2
 * 4. Atualizar banco arquivo.db com URLs corretas
 * 
 * ISSO RESOLVE O PROBLEMA:
 * - Banco tem: /uploads/noticias/1/726a7eed...jpeg (hash MD5)
 * - Arquivos são: whindersson-nunes-...png (nomes descritivos)
 * - Calculamos MD5 de cada arquivo e mapeamos!
 */

require('dotenv').config({ path: '../.env.r2-migration' });
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

// ============================================
// CONFIGURAÇÃO R2
// ============================================
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  endpoint: process.env.R2_ENDPOINT,
};

// Validar credenciais
if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey || !R2_CONFIG.bucketName) {
  console.error('❌ ERRO: Credenciais R2 não encontradas no ../.env.r2-migration');
  process.exit(1);
}

// Cliente S3 (R2 é compatível com S3)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

// ============================================
// CONSTANTES
// ============================================
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'arquivo.db');
const MD5_MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const LOG_FILE = path.join(__dirname, 'r2-migration-final.log');

// Controle
let stats = {
  total: 0,
  uploaded: 0,
  failed: 0,
  startTime: Date.now(),
};

// Mapeamento MD5 → URL R2
const md5ToUrl = {};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function getFileMD5(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function isValidImageFile(filename) {
  const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = getFileExtension(filename);
  
  // Ignorar arquivos temporários
  if (filename.includes('~')) return false;
  
  return validExts.includes(ext);
}

async function uploadToR2(localPath, r2Key, contentType) {
  try {
    const fileContent = fs.readFileSync(localPath);
    
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    log(`❌ Erro ao fazer upload de ${r2Key}: ${error.message}`);
    return false;
  }
}

function getContentType(filename) {
  const ext = getFileExtension(filename);
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

function getAllImageFiles(directory) {
  if (!fs.existsSync(directory)) {
    log(`⚠️ Diretório não encontrado: ${directory}`);
    return [];
  }

  const files = [];
  const items = fs.readdirSync(directory);

  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllImageFiles(fullPath));
    } else if (stat.isFile() && isValidImageFile(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================
// MIGRAÇÃO COM MD5
// ============================================

async function migrateWithMD5(dryRun = false) {
  log('='.repeat(70));
  log('🚀 MIGRAÇÃO INTELIGENTE: Uploads → R2 com Mapeamento MD5');
  log('='.repeat(70));
  
  if (dryRun) {
    log('⚠️ MODO DRY-RUN: Nenhum arquivo será enviado');
  }

  // Testar conexão R2
  try {
    log('🔍 Testando conexão com R2...');
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_CONFIG.bucketName }));
    log('✅ Conexão com R2 estabelecida');
  } catch (error) {
    log(`❌ ERRO: Não foi possível conectar ao bucket R2: ${error.message}`);
    process.exit(1);
  }

  // Coletar todas as imagens
  log('\n📂 Coletando arquivos de imagem...');
  const allFiles = getAllImageFiles(UPLOADS_DIR);
  stats.total = allFiles.length;
  log(`✅ Encontradas ${stats.total} imagens válidas\n`);

  if (stats.total === 0) {
    log('⚠️ Nenhuma imagem encontrada');
    return;
  }

  // Processar cada arquivo
  log('📤 Iniciando upload e cálculo de MD5...\n');

  for (let i = 0; i < allFiles.length; i++) {
    const localPath = allFiles[i];
    const relativePath = path.relative(UPLOADS_DIR, localPath);
    const r2Key = `arquivo/uploads/${relativePath.replace(/\\/g, '/')}`;
    const filename = path.basename(localPath);
    const contentType = getContentType(filename);

    // Progresso
    const progress = ((i + 1) / stats.total * 100).toFixed(1);
    process.stdout.write(`\r[${progress}%] ${i + 1}/${stats.total} - ${filename.substring(0, 60)}`);

    if (!dryRun) {
      // Upload para R2
      const success = await uploadToR2(localPath, r2Key, contentType);
      
      if (success) {
        stats.uploaded++;
        
        // Calcular MD5 do arquivo
        const md5Hash = getFileMD5(localPath);
        const ext = getFileExtension(filename);
        
        // URL final R2 (atualizar após configurar domínio)
        const r2Url = `https://pub-XXXXX.r2.dev/${r2Key}`;
        
        // Mapear MD5 para URL
        md5ToUrl[`${md5Hash}${ext}`] = r2Url;
        md5ToUrl[md5Hash] = r2Url; // Sem extensão também
        
      } else {
        stats.failed++;
      }
    }

    // Log a cada 500 arquivos
    if ((i + 1) % 500 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
      const rate = ((i + 1) / elapsed).toFixed(1);
      log(`\n   ⏱️ ${i + 1} arquivos processados em ${elapsed}s (${rate} arquivos/s)`);
      log(`   MD5s mapeados: ${Object.keys(md5ToUrl).length / 2}`); // Dividido por 2 porque tem com e sem extensão
    }
  }

  // Salvar mapeamento MD5
  if (!dryRun) {
    log('\n\n💾 Salvando mapeamento MD5 → R2...');
    fs.writeFileSync(MD5_MAPPING_FILE, JSON.stringify(md5ToUrl, null, 2));
    log(`✅ Mapeamento salvo em: ${MD5_MAPPING_FILE}`);
    log(`   Total de MD5s: ${Object.keys(md5ToUrl).length / 2}`);
  }

  // Relatório final
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  log('\n' + '='.repeat(70));
  log('📊 RELATÓRIO FINAL');
  log('='.repeat(70));
  log(`✅ Total processado: ${stats.total} arquivos`);
  log(`✅ Enviados com sucesso: ${stats.uploaded}`);
  log(`⚠️ Falhas: ${stats.failed}`);
  log(`⏱️ Tempo total: ${elapsed} minutos`);
  log('='.repeat(70));

  if (dryRun) {
    log('\n⚠️ Este foi um DRY-RUN. Execute sem --dry-run para fazer upload real.');
  } else {
    log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    log('\n📋 PRÓXIMOS PASSOS:');
    log('1. Configure domínio público R2 no dashboard Cloudflare');
    log('2. Atualize a URL pública no ../.env.r2-migration');
    log('3. Execute: node update-db-with-md5.cjs para atualizar o banco');
  }
}

// ============================================
// EXECUÇÃO
// ============================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

migrateWithMD5(dryRun).catch((error) => {
  log(`❌ ERRO FATAL: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
