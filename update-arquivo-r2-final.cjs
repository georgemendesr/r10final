/**
 * ATUALIZAÇÃO FINAL: Banco arquivo.db → URLs R2
 * 
 * ESTRATÉGIA:
 * 1. Carregar mapeamento MD5 → URL R2
 * 2. Para cada notícia no banco /arquivo:
 *    - Pegar o nome do arquivo da coluna 'imagem'
 *    - Buscar no mapeamento R2
 *    - Atualizar com URL R2 final
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PATHS
const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'arquivo', 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('='.repeat(80));
console.log('🔄 ATUALIZAÇÃO FINAL: arquivo.db → URLs R2');
console.log('='.repeat(80));
console.log();

// Verificar arquivos
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Banco não encontrado:', DB_PATH);
  process.exit(1);
}

if (!fs.existsSync(MAPPING_FILE)) {
  console.error('❌ Mapeamento não encontrado:', MAPPING_FILE);
  process.exit(1);
}

// Carregar mapeamento
console.log('📖 Carregando mapeamento MD5...');
const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
console.log(`✅ ${Object.keys(mapping).length} entradas carregadas\n`);

// Conectar ao banco
const db = new sqlite3.Database(DB_PATH);

console.log('🔍 Buscando notícias no banco...\n');

db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`✅ Encontradas ${rows.length} notícias com imagens\n`);
  console.log('📝 Processando atualizações...\n');

  let updated = 0;
  let notFound = 0;
  let alreadyR2 = 0;

  const updates = [];

  rows.forEach(row => {
    // Já é URL R2?
    if (row.imagem.includes('r2.cloudflarestorage.com')) {
      alreadyR2++;
      return;
    }

    // Extrair nome do arquivo
    const filename = row.imagem.split('/').pop();
    
    // Buscar no mapeamento (testar com e sem extensão)
    let r2URL = null;
    
    // Tentar nome completo
    if (mapping[filename]) {
      r2URL = mapping[filename];
    }
    
    // Tentar sem extensão
    if (!r2URL) {
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      for (const key in mapping) {
        if (key.startsWith(nameWithoutExt)) {
          r2URL = mapping[key];
          break;
        }
      }
    }

    if (r2URL) {
      // Substituir placeholder pela URL real
      r2URL = r2URL.replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);
      updates.push({ id: row.id, titulo: row.titulo, newURL: r2URL });
    } else {
      notFound++;
      if (notFound <= 10) {
        console.log(`⚠️  Não encontrado: ${filename} (ID: ${row.id})`);
      }
    }
  });

  console.log(`\n📊 ESTATÍSTICAS:`);
  console.log(`   Total de notícias: ${rows.length}`);
  console.log(`   Para atualizar: ${updates.length}`);
  console.log(`   Já R2: ${alreadyR2}`);
  console.log(`   Não encontrados: ${notFound}`);

  if (updates.length === 0) {
    console.log('\n⚠️  Nenhuma atualização necessária');
    db.close();
    return;
  }

  console.log(`\n💾 Executando ${updates.length} atualizações...`);

  const stmt = db.prepare('UPDATE noticias SET imagem = ? WHERE id = ?');

  let processed = 0;
  updates.forEach((update, idx) => {
    stmt.run([update.newURL, update.id], (err) => {
      if (err) {
        console.error(`❌ Erro ID ${update.id}:`, err.message);
      } else {
        processed++;
        if (processed % 500 === 0) {
          console.log(`   Processados: ${processed}/${updates.length}`);
        }
      }
    });
  });

  stmt.finalize(() => {
    console.log(`\n✅ ${processed} URLs atualizadas com sucesso!`);
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('='.repeat(80));
    
    // Verificar algumas atualizações
    console.log('\n🔍 Verificando atualizações (primeiras 5):');
    db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem LIKE "%r2.cloudflarestorage.com%" LIMIT 5', [], (err, rows) => {
      if (!err) {
        rows.forEach((r, i) => {
          console.log(`\n${i + 1}. ID ${r.id}: ${r.titulo.substring(0, 50)}...`);
          console.log(`   ${r.imagem.substring(0, 100)}...`);
        });
      }
      db.close();
    });
  });
});
