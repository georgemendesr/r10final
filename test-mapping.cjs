#!/usr/bin/env node
/**
 * TESTE DE MAPEAMENTO MD5 → R2
 * Verifica se o mapeamento está correto comparando arquivos locais
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'arquivo', 'uploads');
const MAPPING_PATH = path.join(__dirname, 'arquivo', 'md5-to-r2-mapping.json');

console.log('\n' + '='.repeat(70));
console.log('🔍 TESTE DE MAPEAMENTO MD5 → R2');
console.log('='.repeat(70) + '\n');

// Carregar mapeamento
const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
console.log(`📊 Mapeamento carregado: ${Object.keys(mapping).length} entradas\n`);

// Função para calcular MD5
function calculateMD5(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Listar alguns arquivos para teste
const testFiles = [
  'whatsapp-image-2022-04-08-at-12_cafb68c84ab3108025276e40fcf386544dcd4eb0.jpeg', // Problema conhecido
  '0-17032025144559_aefdddd4ff157f0a4b84f1af81bccdb5b0fb68ec.png',
  '02bc1980-5651-4aee-8140-f74394617005_5088b8145185c014b86448011861e17528308192.jpeg',
  '0-27062025085950-1751030922.jpeg'
];

console.log('📋 Testando arquivos específicos:\n');

let correct = 0;
let incorrect = 0;
let notFound = 0;

testFiles.forEach((fileName, index) => {
  console.log(`${index + 1}. ${fileName}`);
  
  // Procurar arquivo em /editor ou /imagens
  let localPath = path.join(UPLOADS_DIR, 'editor', fileName);
  if (!fs.existsSync(localPath)) {
    localPath = path.join(UPLOADS_DIR, 'imagens', fileName);
  }
  
  if (!fs.existsSync(localPath)) {
    console.log('   ❌ Arquivo NÃO encontrado localmente\n');
    notFound++;
    return;
  }
  
  // Calcular MD5 do arquivo local
  const md5 = calculateMD5(localPath);
  console.log(`   MD5: ${md5}`);
  
  // Buscar no mapeamento
  const ext = path.extname(fileName).slice(1);
  const mappedUrl = mapping[md5 + '.' + ext] || mapping[md5];
  
  if (!mappedUrl) {
    console.log('   ❌ MD5 NÃO encontrado no mapeamento\n');
    incorrect++;
    return;
  }
  
  // Extrair nome do arquivo da URL mapeada
  const mappedFileName = mappedUrl.split('/').pop();
  
  console.log(`   Mapeado para: ${mappedFileName}`);
  
  if (mappedFileName === fileName) {
    console.log('   ✅ CORRETO - Nome bate!\n');
    correct++;
  } else {
    console.log(`   ❌ ERRADO - Deveria ser: ${fileName}\n`);
    incorrect++;
  }
});

console.log('='.repeat(70));
console.log('📊 RESULTADO DO TESTE:');
console.log('='.repeat(70));
console.log(`✅ Corretos: ${correct}`);
console.log(`❌ Incorretos: ${incorrect}`);
console.log(`❓ Não encontrados: ${notFound}`);
console.log();

if (incorrect > 0) {
  console.log('⚠️  ATENÇÃO: Há arquivos com mapeamento incorreto!');
  console.log('Isso significa que o md5-to-r2-mapping.json está errado.');
  console.log();
  console.log('🔧 SOLUÇÃO:');
  console.log('1. O mapeamento foi criado ANTES do upload');
  console.log('2. Mas os arquivos no R2 foram renomeados DURANTE o upload');
  console.log('3. Precisamos REFAZER o mapeamento baseado no que está no R2');
  console.log();
} else if (correct === testFiles.length) {
  console.log('🎉 TUDO CERTO! O mapeamento está correto.');
  console.log('O problema pode ser no upload para o R2.');
  console.log();
}

console.log('💡 Próximo passo: Confirme se quer continuar com mais testes');
console.log();
