/**
 * Script de Migração: arquivo/uploads → Cloudflare R2
 * 
 * Este script:
 * 1. Lê todas as imagens de arquivo/uploads/editor e arquivo/uploads/imagens
 * 2. Faz upload para Cloudflare R2 mantendo estrutura
 * 3. Gera mapeamento: nome_arquivo → URL_R2_final
 * 4. Salva mapeamento em JSON para posterior atualização do banco
 */

require('dotenv').config({ path: '.env.r2-migration' });
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

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
  console.error('❌ ERRO: Credenciais R2 não encontradas no .env.r2-migration');
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
const UPLOADS_DIR = path.join(__dirname, 'arquivo', 'uploads');
const EDITOR_DIR = path.join(UPLOADS_DIR, 'editor');
const IMAGENS_DIR = path.join(UPLOADS_DIR, 'imagens');
const MAPPING_FILE = path.join(__dirname, 'r2-migration-mapping.json');
const LOG_FILE = path.join(__dirname, 'r2-migration.log');

// Controle de progresso
let stats = {
  total: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  startTime: Date.now(),
};

// Mapeamento: filename → R2 URL
const urlMapping = {};

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
  
  // Ignorar arquivos temporários (~, ~~, ~~~)
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
      CacheControl: 'public, max-age=31536000', // Cache por 1 ano
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    log(`❌ Erro ao fazer upload de ${r2Key}: ${error.message}`);
    return false;
  }
}

async function uploadToR2WithMD5Alias(localPath, r2Key, contentType, md5Hash, ext) {
  try {
    const fileContent = fs.readFileSync(localPath);
    
    // Upload 1: Com o nome original descritivo
    const command1 = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });
    await r2Client.send(command1);

    // Upload 2: Com o hash MD5 (para compatibilidade com banco)
    // Estrutura: arquivo/uploads/noticias/hash/HASH.ext
    const md5Key = `arquivo/uploads/noticias/hash/${md5Hash}${ext}`;
    const command2 = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: md5Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });
    await r2Client.send(command2);

    return { original: r2Key, md5: md5Key };
  } catch (error) {
    log(`❌ Erro ao fazer upload duplo de ${r2Key}: ${error.message}`);
    return null;
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
      // Recursivo para subdiretórios
      files.push(...getAllImageFiles(fullPath));
    } else if (stat.isFile() && isValidImageFile(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================
// FUNÇÃO PRINCIPAL DE MIGRAÇÃO
// ============================================

async function migrateImages(dryRun = false) {
  log('='.repeat(60));
  log('🚀 INICIANDO MIGRAÇÃO: arquivo/uploads → Cloudflare R2');
  log('='.repeat(60));
  
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
  const editorFiles = getAllImageFiles(EDITOR_DIR);
  const imagensFiles = getAllImageFiles(IMAGENS_DIR);
  const allFiles = [...editorFiles, ...imagensFiles];

  stats.total = allFiles.length;
  log(`✅ Encontradas ${stats.total} imagens válidas`);
  log(`   - editor/: ${editorFiles.length} arquivos`);
  log(`   - imagens/: ${imagensFiles.length} arquivos`);

  if (stats.total === 0) {
    log('⚠️ Nenhuma imagem encontrada para migrar');
    return;
  }

  // Processar cada arquivo
  log('\n📤 Iniciando upload para R2...\n');

  for (let i = 0; i < allFiles.length; i++) {
    const localPath = allFiles[i];
    const relativePath = path.relative(UPLOADS_DIR, localPath);
    
    // Estrutura R2: arquivo/uploads/editor/nome.jpg ou arquivo/uploads/imagens/nome.jpg
    const r2Key = `arquivo/uploads/${relativePath.replace(/\\/g, '/')}`;
    
    const filename = path.basename(localPath);
    const contentType = getContentType(filename);
    const fileSize = fs.statSync(localPath).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    // Progresso
    const progress = ((i + 1) / stats.total * 100).toFixed(1);
    process.stdout.write(`\r[${progress}%] ${i + 1}/${stats.total} - ${filename} (${fileSizeMB}MB)`);

    if (!dryRun) {
      const success = await uploadToR2(localPath, r2Key, contentType);
      
      if (success) {
        stats.uploaded++;
        
        // URL final R2 (será ajustada quando configurar domínio público)
        const r2Url = `https://pub-XXXXX.r2.dev/${r2Key}`;
        
        // Mapear TODOS os formatos possíveis que podem estar no banco:
        // 1. Nome original do arquivo
        urlMapping[filename] = r2Url;
        
        // 2. Caminho relativo completo
        urlMapping[relativePath.replace(/\\/g, '/')] = r2Url;
        
        // 3. Caminho com /uploads/
        urlMapping[`/uploads/${relativePath.replace(/\\/g, '/')}`] = r2Url;
        
        // 4. Hash MD5 (caso o banco tenha hash ao invés do nome)
        const md5Hash = getFileMD5(localPath);
        const ext = getFileExtension(filename);
        urlMapping[`${md5Hash}${ext}`] = r2Url;
        urlMapping[`/uploads/noticias/1/${md5Hash}${ext}`] = r2Url;
        urlMapping[`/uploads/noticias/3/${md5Hash}${ext}`] = r2Url;
        
      } else {
        stats.failed++;
      }
    } else {
      stats.skipped++;
    }

    // Log a cada 100 arquivos
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
      const rate = ((i + 1) / elapsed).toFixed(1);
      log(`\n   ⏱️ ${i + 1} arquivos processados em ${elapsed}s (${rate} arquivos/s)`);
    }
  }

  // Salvar mapeamento
  if (!dryRun) {
    log('\n\n💾 Salvando mapeamento...');
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(urlMapping, null, 2));
    log(`✅ Mapeamento salvo em: ${MAPPING_FILE}`);
    log(`   Total de entradas: ${Object.keys(urlMapping).length}`);
  }

  // Relatório final
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  log('\n' + '='.repeat(60));
  log('📊 RELATÓRIO FINAL');
  log('='.repeat(60));
  log(`✅ Total processado: ${stats.total} arquivos`);
  log(`✅ Enviados com sucesso: ${stats.uploaded}`);
  log(`⚠️ Falhas: ${stats.failed}`);
  log(`⏱️ Tempo total: ${elapsed} minutos`);
  log('='.repeat(60));

  if (dryRun) {
    log('\n⚠️ Este foi um DRY-RUN. Execute sem --dry-run para fazer upload real.');
  } else {
    log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    log('\n📋 PRÓXIMOS PASSOS:');
    log('1. Configure domínio público R2 no dashboard Cloudflare');
    log('2. Atualize a URL pública no arquivo .env.r2-migration');
    log('3. Execute: node update-database-r2.js para atualizar o banco');
  }
}

// ============================================
// EXECUÇÃO
// ============================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const testMode = args.includes('--test');

if (testMode) {
  log('🧪 MODO TESTE: Processando apenas 10 imagens');
  // TODO: Implementar limitação para teste
}

migrateImages(dryRun).catch((error) => {
  log(`❌ ERRO FATAL: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
