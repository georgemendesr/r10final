require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * Importador melhorado - extrai dados dos INSERTs do MySQL
 */

const DUMP_FILE = path.join(__dirname, '..', 'backup', 'r10.db');

console.log('\n📥 Importador R10 Piauí - Versão Melhorada\n');
console.log('═'.repeat(60) + '\n');

if (!fs.existsSync(DUMP_FILE)) {
  console.error('❌ Arquivo não encontrado');
  process.exit(1);
}

console.log('✅ Lendo arquivo...\n');

// Limpar banco
console.log('🗑️  Limpando banco...\n');
db.run('DELETE FROM noticias', (err) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Banco limpo\n');
  console.log('🔄 Processando INSERTs...\n');
  
  const conteudo = fs.readFileSync(DUMP_FILE, 'utf8');
  
  // Encontrar todos os INSERTs da tabela noticias
  const regexInsert = /INSERT INTO `noticias` VALUES \((.*?)\);/gs;
  let match;
  let total = 0;
  let importados = 0;
  let erros = 0;
  
  while ((match = regexInsert.exec(conteudo)) !== null) {
    total++;
    
    if (total % 100 === 0) {
      process.stdout.write(`\r   📦 Processando: ${total} registros...`);
    }
    
    try {
      const valores = match[1];
      
      // Parse mais inteligente dos valores
      const campos = parseValoresMySQL(valores);
      
      if (campos.length >= 20) {
        // Estrutura: 0=id, 1=secao, 2=destaque, 3=acompanhe, 4=chapeu,
        // 5=titulo, 6=subtitulo, 7=foto, 8=fotodestaque_id, 9=visualizacoes,
        // 10=texto, ...
        
        const titulo = campos[5] || null;
        let texto = campos[10] || '';
        const foto = campos[7] || null;
        const chapeu = campos[4] || 'Geral';
        const redator = campos[13] || 'Redação R10';
        const dataEntrada = campos[20] || new Date().toISOString();
        
        // Se texto estiver vazio ou for muito curto, pular
        if (!titulo || titulo.length < 5) {
          continue;
        }
        
        // Limpar texto se tiver caracteres estranhos
        if (texto) {
          texto = texto.replace(/\\n/g, '\n').replace(/\\r/g, '');
        }
        
        // Inserir
        const sql = `INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views) 
                     VALUES (?, ?, ?, ?, ?, ?, 0)`;
        
        db.run(sql, [titulo, texto, foto, dataEntrada, redator, chapeu], (err) => {
          if (err) {
            erros++;
            if (erros <= 5) console.error(`\n❌ Erro: ${err.message}`);
          } else {
            importados++;
            if (importados % 100 === 0) {
              process.stdout.write(`\r   ✅ Importados: ${importados}...`);
            }
          }
        });
      }
    } catch (e) {
      erros++;
    }
  }
  
  setTimeout(() => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('\n📊 RESULTADO:\n');
    console.log(`   📦 Total processados: ${total}`);
    console.log(`   ✅ Importados: ${importados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log('\n' + '═'.repeat(60) + '\n');
    
    if (importados > 0) {
      console.log('🎉 Concluído! Acesse: http://localhost:5050\n');
    }
    
    db.close();
    process.exit(0);
  }, 3000);
});

function parseValoresMySQL(str) {
  const campos = [];
  let atual = '';
  let dentroString = false;
  let i = 0;
  
  while (i < str.length) {
    const char = str[i];
    const nextChar = str[i + 1];
    
    // Início de string
    if (char === "'" && !dentroString) {
      dentroString = true;
      i++;
      continue;
    }
    
    // Fim de string
    if (char === "'" && dentroString && nextChar !== "'") {
      dentroString = false;
      campos.push(atual);
      atual = '';
      i++;
      // Pular vírgula e espaço
      if (str[i] === ',' || str[i] === ' ') i++;
      continue;
    }
    
    // String escapada ''
    if (char === "'" && nextChar === "'" && dentroString) {
      atual += "'";
      i += 2;
      continue;
    }
    
    // Separador de campo (fora de string)
    if (char === ',' && !dentroString) {
      if (atual.trim() === 'NULL' || atual.trim() === '') {
        campos.push(null);
      } else {
        campos.push(atual.trim());
      }
      atual = '';
      i++;
      continue;
    }
    
    // Acumular caractere
    if (dentroString) {
      atual += char;
    } else if (char !== ' ' || atual.length > 0) {
      atual += char;
    }
    
    i++;
  }
  
  // Último campo
  if (atual.trim() && atual.trim() !== 'NULL') {
    campos.push(atual.trim());
  } else if (atual.trim() === 'NULL') {
    campos.push(null);
  }
  
  return campos;
}
