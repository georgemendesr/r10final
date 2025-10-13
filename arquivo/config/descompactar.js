const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'backup', 'r10.db');
const outputFile = path.join(__dirname, '..', 'backup', 'r10-descompactado.db');

console.log('🔄 Tentando descompactar arquivo...\n');

// Ler primeiros bytes para verificar
const buffer = fs.readFileSync(inputFile);
const header = buffer.toString('hex', 0, 2);

if (header === '1f8b') {
  console.log('✅ Arquivo está compactado com GZIP\n');
  console.log('📦 Descompactando...\n');
  
  const gunzip = zlib.createGunzip();
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  input.pipe(gunzip).pipe(output);

  output.on('finish', () => {
    console.log('✅ Descompactação concluída!\n');
    console.log(`📁 Arquivo salvo em: ${outputFile}\n`);
    console.log('🔄 Agora execute: node config/verificar-backup.js\n');
  });

  output.on('error', (err) => {
    console.error('❌ Erro ao descompactar:', err.message);
  });
} else {
  console.log('⚠️ Arquivo não está compactado com GZIP');
  console.log(`   Header: ${header}`);
  console.log('\n🔍 Tentando ler como texto...\n');
  
  const text = buffer.toString('utf8', 0, 100);
  console.log('Primeiros 100 caracteres:');
  console.log(text);
  console.log('\n💡 O arquivo pode estar em outro formato.');
}
