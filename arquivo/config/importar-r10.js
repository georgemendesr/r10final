require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Importador específico para o dump MySQL do R10 Piauí
 * Extrai INSERTs da tabela noticias e converte para SQLite
 */

const DUMP_FILE = path.join(__dirname, '..', 'backup', 'r10.db');

console.log('\n📥 Importador R10 Piauí - MySQL para SQLite\n');
console.log('═'.repeat(60) + '\n');

if (!fs.existsSync(DUMP_FILE)) {
  console.error('❌ Arquivo não encontrado:', DUMP_FILE);
  process.exit(1);
}

console.log('✅ Arquivo encontrado\n');

// Perguntar se quer limpar o banco
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  Limpar banco antes de importar? (s/N): ', (resposta) => {
  rl.close();
  
  const limpar = resposta.toLowerCase() === 's';
  
  if (limpar) {
    console.log('\n🗑️  Limpando banco...\n');
    db.run('DELETE FROM noticias', (err) => {
      if (err) {
        console.error('❌ Erro ao limpar:', err.message);
        process.exit(1);
      }
      console.log('✅ Banco limpo\n');
      iniciarImportacao();
    });
  } else {
    console.log('\n📥 Mantendo dados existentes...\n');
    iniciarImportacao();
  }
});

function iniciarImportacao() {
  console.log('🔄 Lendo arquivo SQL...\n');
  
  let linhasProcessadas = 0;
  let noticiasImportadas = 0;
  let erros = 0;
  let bufferInsert = '';
  let dentroInsertNoticias = false;

  const fileStream = fs.createReadStream(DUMP_FILE, { encoding: 'utf8' });
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  lineReader.on('line', (linha) => {
    linhasProcessadas++;
    
    if (linhasProcessadas % 1000 === 0) {
      process.stdout.write(`\r   📄 ${linhasProcessadas} linhas lidas...`);
    }

    // Detectar INSERT INTO `noticias`
    if (linha.includes('INSERT INTO `noticias`') || linha.includes('INSERT INTO noticias')) {
      dentroInsertNoticias = true;
      bufferInsert = linha;
      return;
    }

    // Acumular linhas do INSERT
    if (dentroInsertNoticias) {
      bufferInsert += ' ' + linha.trim();
      
      // Se termina com ; , processar
      if (linha.trim().endsWith(';')) {
        processarInsert(bufferInsert);
        bufferInsert = '';
        dentroInsertNoticias = false;
      }
    }
  });

  lineReader.on('close', () => {
    setTimeout(() => {
      console.log('\n\n' + '═'.repeat(60));
      console.log('\n📊 RESULTADO:\n');
      console.log(`   📄 Linhas lidas: ${linhasProcessadas.toLocaleString()}`);
      console.log(`   ✅ Notícias importadas: ${noticiasImportadas}`);
      console.log(`   ❌ Erros: ${erros}`);
      console.log('\n' + '═'.repeat(60) + '\n');
      
      if (noticiasImportadas > 0) {
        console.log('🎉 Importação concluída com sucesso!');
        console.log('\n💡 Acesse: http://localhost:5050\n');
      } else {
        console.log('⚠️  Nenhuma notícia foi importada.');
        console.log('💡 O dump pode ter uma estrutura diferente.\n');
      }
      
      db.close();
      process.exit(0);
    }, 1000);
  });

  function processarInsert(sqlInsert) {
    try {
      // Extrair valores entre VALUES (...);
      const matchValues = sqlInsert.match(/VALUES\s*\((.*)\);?$/is);
      if (!matchValues) return;

      const valoresStr = matchValues[1];
      
      // Dividir por ), ( para múltiplas linhas
      const registros = valoresStr.split(/\),\s*\(/);
      
      registros.forEach(registro => {
        try {
          // Limpar parênteses extras
          let valores = registro.replace(/^\(|\)$/g, '').trim();
          
          // Parse simples de valores SQL
          const campos = parseSQLValues(valores);
          
          if (campos.length >= 20) {
            // Mapear campos conforme estrutura real do R10:
            // 0=id_noticia, 1=secao_id, 2=destaque, 3=acompanhe, 4=chapeu, 
            // 5=titulo, 6=subtitulo, 7=foto, 8=fotodestaque_id, 9=visualizacoes,
            // 10=texto, 11=keywords, 12=idstopicos, 13=redator, 14=editor,
            // 15=fonte, 16=permalink, 17=slug, 18=pub_fb, 19=pub_tw, 20=data_entrada
            
            const titulo = campos[5]; // titulo
            let conteudo = campos[10]; // texto (LONGBLOB - vem como hex ou base64)
            const imagem = campos[7]; // foto
            const data = campos[20]; // data_entrada
            const autor = campos[13] || 'Redação R10'; // redator
            const categoria = campos[4] || 'Geral'; // chapeu
            
            // Decodificar LONGBLOB se estiver em formato especial
            if (conteudo && conteudo.startsWith('0x')) {
              // Hexadecimal
              conteudo = Buffer.from(conteudo.slice(2), 'hex').toString('utf8');
            } else if (conteudo && /^[A-Fa-f0-9]+$/.test(conteudo) && conteudo.length > 100) {
              // Pode ser hex sem 0x
              try {
                conteudo = Buffer.from(conteudo, 'hex').toString('utf8');
              } catch (e) {
                // Manter original se falhar
              }
            }
            
            // Limpar imagem (pode ter caminho relativo)
            let imagemUrl = imagem;
            if (imagem && !imagem.startsWith('http')) {
              imagemUrl = null; // Ou construir URL completo se souber o domínio
            }
            
            // Inserir no SQLite
            const insertSQL = `
              INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views)
              VALUES (?, ?, ?, ?, ?, ?, 0)
            `;
            
            db.run(insertSQL, [
              titulo || 'Sem título',
              conteudo || '',
              imagemUrl,
              data || new Date().toISOString(),
              autor,
              categoria
            ], (err) => {
              if (err) {
                erros++;
                if (erros <= 3) {
                  console.error(`\n❌ Erro: ${err.message}`);
                }
              } else {
                noticiasImportadas++;
                if (noticiasImportadas % 50 === 0) {
                  process.stdout.write(`\r   ✅ ${noticiasImportadas} notícias importadas...`);
                }
              }
            });
          }
        } catch (e) {
          erros++;
        }
      });
    } catch (error) {
      // Ignorar erros de parse
    }
  }

  function parseSQLValues(str) {
    const valores = [];
    let atual = '';
    let dentroString = false;
    let escape = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (escape) {
        atual += char;
        escape = false;
        continue;
      }
      
      if (char === '\\') {
        escape = true;
        continue;
      }
      
      if (char === "'" && !dentroString) {
        dentroString = true;
        continue;
      }
      
      if (char === "'" && dentroString) {
        dentroString = false;
        valores.push(atual);
        atual = '';
        continue;
      }
      
      if (char === ',' && !dentroString) {
        if (atual.trim() && atual.trim() !== 'NULL') {
          valores.push(atual.trim());
        } else {
          valores.push(null);
        }
        atual = '';
        continue;
      }
      
      if (dentroString) {
        atual += char;
      } else if (char !== ' ' || atual.length > 0) {
        atual += char;
      }
    }
    
    // Último valor
    if (atual.trim() && atual.trim() !== 'NULL') {
      valores.push(atual.trim());
    } else if (atual.trim() === 'NULL') {
      valores.push(null);
    }
    
    return valores;
  }
}
