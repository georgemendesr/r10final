require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== RE-UPLOAD COMPLETO DE IMAGENS CORRETAS PARA R2 ===\n');

// Configurar cliente R2
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'arquivo-r10-imagens';

// Ler dump MySQL
console.log('Lendo dump MySQL original...\n');
const dumpContent = fs.readFileSync('backup/r10.db', 'utf8');

// Parsear imagens do MySQL
const mysqlImages = new Set();
const lines = dumpContent.split('\n');

for (const line of lines) {
  if (line.includes('/uploads/imagens/')) {
    const imgMatch = line.match(/\/uploads\/imagens\/([^'",\s]+)/g);
    if (imgMatch) {
      imgMatch.forEach(img => {
        const filename = img.replace('/uploads/imagens/', '');
        mysqlImages.add(filename);
      });
    }
  }
}

console.log(`✓ ${mysqlImages.size} imagens únicas encontradas no MySQL\n`);

// Verificar quantas existem localmente
let existLocally = 0;
let notFound = 0;
const toUpload = [];

for (const filename of mysqlImages) {
  const localPath = `uploads/imagens/${filename}`;
  if (fs.existsSync(localPath)) {
    existLocally++;
    toUpload.push({ filename, localPath });
  } else {
    notFound++;
    console.log(`⚠️  Não encontrado: ${filename}`);
  }
}

console.log(`\n✓ ${existLocally} arquivos existem localmente`);
console.log(`✗ ${notFound} não encontrados\n`);

// Função para fazer upload
async function uploadToR2(filename, localPath) {
  const fileBuffer = fs.readFileSync(localPath);
  const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
  
  const key = `arquivo/uploads/imagens/${filename}`;
  
  try {
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: getContentType(filename),
      Metadata: {
        'original-filename': filename,
        'md5': md5
      }
    }));
    return { success: true, md5, key };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

// Processar em lotes
async function processInBatches(items, batchSize = 10) {
  let uploaded = 0;
  let failed = 0;
  const newMapping = {};
  
  console.log(`\nIniciando upload de ${items.length} imagens...\n`);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(item => uploadToR2(item.filename, item.localPath));
    const results = await Promise.all(promises);
    
    results.forEach((result, idx) => {
      const item = batch[idx];
      if (result.success) {
        uploaded++;
        const r2Url = `https://pub-9dd576330b004101943425aed2436078.r2.dev/${result.key}`;
        newMapping[result.md5] = r2Url;
        if (uploaded % 100 === 0) {
          console.log(`✓ ${uploaded}/${items.length} uploadados...`);
        }
      } else {
        failed++;
        console.log(`✗ Erro em ${item.filename}: ${result.error}`);
      }
    });
  }
  
  return { uploaded, failed, newMapping };
}

// Executar
(async () => {
  const result = await processInBatches(toUpload, 10);
  
  console.log(`\n=== RESUMO ===`);
  console.log(`Uploadados com sucesso: ${result.uploaded}`);
  console.log(`Falharam: ${result.failed}`);
  
  // Salvar novo mapeamento
  console.log('\nSalvando novo mapeamento MD5...');
  fs.writeFileSync('md5-to-r2-mapping-NEW.json', JSON.stringify(result.newMapping, null, 2));
  console.log('✓ Salvo em md5-to-r2-mapping-NEW.json');
  
  console.log('\n✅ CONCLUÍDO!');
  console.log('\nPróximos passos:');
  console.log('1. Renomear md5-to-r2-mapping-NEW.json para md5-to-r2-mapping.json');
  console.log('2. Rodar novamente fix-images-from-mysql-dump.cjs');
  console.log('3. Fazer commit e push');
})();
