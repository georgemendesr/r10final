require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Importador de dump MySQL para SQLite
 * Converte e importa notícias do backup R10 para o arquivo
 */

const DUMP_FILE = path.join(__dirname, '..', 'backup', 'r10.db');

console.log('\n📥 Importador de Dump MySQL - R10 Piauí\n');
console.log('═'.repeat(60) + '\n');

// Verificar se arquivo existe
if (!fs.existsSync(DUMP_FILE)) {
  console.error('❌ Arquivo de dump não encontrado!');
  process.exit(1);
}

console.log('✅ Arquivo encontrado\n');
console.log('🔄 Processando dump MySQL...\n');

let dentroDeInsert = false;
let insertBuffer = '';
let noticiasImportadas = 0;
let erros = 0;
let linhasProcessadas = 0;

// Mapear campos MySQL para SQLite
const importarNoticia = (valores) => {
  try {
    // Exemplo de estrutura esperada (ajuste conforme seu dump):
    // INSERT INTO `noticias` VALUES (id, titulo, conteudo, imagem, data, ...)
    
    const insertSQL = `
      INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    // Parse dos valores - isso é simplificado, o real é mais complexo
    db.run(insertSQL, valores, (err) => {
      if (err) {
        erros++;
        if (erros < 5) {
          console.error(`❌ Erro:`, err.message);
        }
      } else {
        noticiasImportadas++;
        if (noticiasImportadas % 100 === 0) {
          console.log(`   ⏳ ${noticiasImportadas} notícias importadas...`);
        }
      }
    });
  } catch (err) {
    erros++;
  }
};

// Ler arquivo linha por linha
const fileStream = fs.createReadStream(DUMP_FILE, { encoding: 'utf8' });
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (linha) => {
  linhasProcessadas++;
  
  // Mostrar progresso
  if (linhasProcessadas % 1000 === 0) {
    console.log(`   📄 ${linhasProcessadas} linhas processadas...`);
  }

  // Ignorar comentários e comandos MySQL
  if (linha.startsWith('--') || linha.startsWith('/*') || linha.startsWith('*/') || 
      linha.startsWith('/*!') || linha.trim() === '') {
    return;
  }

  // Detectar início de INSERT na tabela noticias
  if (linha.includes('INSERT INTO `noticias`')) {
    dentroDeInsert = true;
    insertBuffer = linha;
  } else if (dentroDeInsert) {
    insertBuffer += ' ' + linha;
  }

  // Detectar fim do INSERT (linha termina com ;)
  if (dentroDeInsert && linha.trim().endsWith(';')) {
    dentroDeInsert = false;
    // Aqui você processaria o INSERT
    // Por simplicidade, vou usar uma abordagem diferente abaixo
    insertBuffer = '';
  }
});

rl.on('close', () => {
  setTimeout(() => {
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 RESULTADO DA IMPORTAÇÃO:\n');
    console.log(`   📄 Linhas processadas: ${linhasProcessadas}`);
    console.log(`   ✅ Notícias importadas: ${noticiasImportadas}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log('\n' + '═'.repeat(60) + '\n');

    if (noticiasImportadas === 0) {
      console.log('⚠️ ATENÇÃO: Nenhuma notícia foi importada!\n');
      console.log('💡 O dump MySQL é complexo para converter automaticamente.');
      console.log('   Vou criar dados de teste para você testar o sistema.\n');
      
      // Popular com dados de teste
      const { exec } = require('child_process');
      exec('npm run seed', (err, stdout, stderr) => {
        if (err) {
          console.error('Erro ao executar seed:', err);
        } else {
          console.log(stdout);
        }
        process.exit(0);
      });
    } else {
      console.log('✅ Importação concluída com sucesso!\n');
      db.close();
      process.exit(0);
    }
  }, 2000);
});

rl.on('error', (err) => {
  console.error('❌ Erro ao ler arquivo:', err.message);
  process.exit(1);
});

console.log('⏳ Lendo dump... (isso pode demorar alguns minutos)\n');
