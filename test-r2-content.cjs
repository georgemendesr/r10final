#!/usr/bin/env node
/**
 * TESTE COMPLETO: Compara arquivos locais com R2
 * Baixa amostras do R2 e verifica se o conteúdo está correto
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, 'arquivo', 'uploads');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';
const TEMP_DIR = path.join(__dirname, 'temp-r2-test');

console.log('\n' + '='.repeat(70));
console.log('🔍 TESTE COMPLETO: Local vs R2');
console.log('='.repeat(70) + '\n');

// Criar diretório temporário
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Função para calcular MD5
function calculateMD5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Função para baixar arquivo do R2
function downloadFromR2(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Arquivos para testar (incluindo o problema conhecido)
const testFiles = [
  { 
    name: 'whatsapp-image-2022-04-08-at-12_cafb68c84ab3108025276e40fcf386544dcd4eb0.jpeg',
    folder: 'editor',
    issue: 'Mostra ponte ao invés de prefeita'
  },
  { 
    name: '02bc1980-5651-4aee-8140-f74394617005_5088b8145185c014b86448011861e17528308192.jpeg',
    folder: 'editor',
    issue: null
  },
  { 
    name: '0-17032025144559_aefdddd4ff157f0a4b84f1af81bccdb5b0fb68ec.png',
    folder: 'editor',
    issue: null
  },
  { 
    name: '0-27062025085950-1751030922.jpeg',
    folder: 'imagens',
    issue: null
  },
  { 
    name: '000-9q77ja_9eb238502adca450511fb28605e3767122c15639.jpg',
    folder: 'editor',
    issue: null
  }
];

async function testFile(file) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📄 ${file.name}`);
  if (file.issue) {
    console.log(`⚠️  Problema conhecido: ${file.issue}`);
  }
  console.log(`${'─'.repeat(70)}\n`);
  
  // 1. Ler arquivo local
  const localPath = path.join(UPLOADS_DIR, file.folder, file.name);
  if (!fs.existsSync(localPath)) {
    console.log('❌ Arquivo NÃO encontrado localmente!\n');
    return { status: 'not_found' };
  }
  
  const localBuffer = fs.readFileSync(localPath);
  const localMD5 = calculateMD5(localBuffer);
  const localSize = (localBuffer.length / 1024).toFixed(2);
  
  console.log(`📁 LOCAL:`);
  console.log(`   Caminho: ${file.folder}/${file.name}`);
  console.log(`   Tamanho: ${localSize} KB`);
  console.log(`   MD5: ${localMD5}`);
  console.log();
  
  // 2. Baixar arquivo do R2
  const r2Url = `${R2_PUBLIC_URL}/arquivo/uploads/${file.folder}/${file.name}`;
  console.log(`🌐 Baixando do R2...`);
  
  try {
    const r2Buffer = await downloadFromR2(r2Url);
    const r2MD5 = calculateMD5(r2Buffer);
    const r2Size = (r2Buffer.length / 1024).toFixed(2);
    
    console.log(`☁️  R2:`);
    console.log(`   URL: ${r2Url.substring(0, 60)}...`);
    console.log(`   Tamanho: ${r2Size} KB`);
    console.log(`   MD5: ${r2MD5}`);
    console.log();
    
    // 3. Comparar
    if (localMD5 === r2MD5) {
      console.log(`✅ CORRETO - MD5 bate! Conteúdo é o mesmo.`);
      return { status: 'correct', localMD5, r2MD5 };
    } else {
      console.log(`❌ ERRADO - MD5 diferente! Conteúdo foi trocado!`);
      console.log(`   Local:  ${localMD5}`);
      console.log(`   R2:     ${r2MD5}`);
      
      // Salvar arquivo do R2 para análise
      const tempPath = path.join(TEMP_DIR, `R2_${file.name}`);
      fs.writeFileSync(tempPath, r2Buffer);
      console.log(`   💾 Arquivo do R2 salvo em: ${tempPath}`);
      
      return { status: 'incorrect', localMD5, r2MD5 };
    }
    
  } catch (error) {
    console.log(`❌ ERRO ao baixar do R2: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function runTests() {
  const results = [];
  
  for (const file of testFiles) {
    const result = await testFile(file);
    results.push({ ...file, ...result });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DOS TESTES:');
  console.log('='.repeat(70) + '\n');
  
  const correct = results.filter(r => r.status === 'correct').length;
  const incorrect = results.filter(r => r.status === 'incorrect').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Corretos: ${correct}/${testFiles.length}`);
  console.log(`❌ Incorretos: ${incorrect}/${testFiles.length}`);
  console.log(`❓ Não encontrados: ${notFound}/${testFiles.length}`);
  console.log(`⚠️  Erros: ${errors}/${testFiles.length}`);
  console.log();
  
  if (incorrect > 0) {
    console.log('🚨 CONFIRMADO: Arquivos no R2 estão com CONTEÚDO TROCADO!');
    console.log();
    console.log('📁 Arquivos do R2 salvos em:', TEMP_DIR);
    console.log('   Compare visualmente com os arquivos locais');
    console.log();
    console.log('🔧 SOLUÇÃO NECESSÁRIA:');
    console.log('   Re-fazer upload de TODOS os arquivos para o R2');
    console.log();
  } else if (correct === testFiles.length) {
    console.log('✅ TUDO CORRETO! Conteúdo local = conteúdo R2');
    console.log('   O problema pode estar em outro lugar...');
    console.log();
  }
  
  console.log('💡 Verifique os arquivos em:', TEMP_DIR);
  console.log();
}

runTests().catch(console.error);
