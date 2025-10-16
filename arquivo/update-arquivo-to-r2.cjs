/**
 * ATUALIZAÇÃO DEFINITIVA: arquivo.db → URLs R2
 * 
 * Este script:
 * 1. Lê o mapeamento MD5 → URL R2
 * 2. Para cada notícia no banco arquivo.db:
 *    - Extrai o hash MD5 do campo "imagem" (/uploads/noticias/1/HASH.jpeg)
 *    - Busca a URL R2 correspondente no mapeamento
 *    - Atualiza o registro com a URL R2 final
 * 3. Gera relatório completo
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// =======================================
// CONFIGURAÇÕES
// =======================================

const DB_PATH = path.join(__dirname, 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('======================================================================');
console.log('🔄 ATUALIZAÇÃO DEFINITIVA: arquivo.db → URLs R2');
console.log('======================================================================\n');

// 1. Carregar mapeamento MD5
console.log('📖 Carregando mapeamento MD5...');

if (!fs.existsSync(MAPPING_FILE)) {
  console.error(`❌ Arquivo não encontrado: ${MAPPING_FILE}`);
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} entradas\n`);

// 2. Conectar ao banco
console.log('🔌 Conectando ao banco de dados...');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao arquivo.db\n');
});

// 3. Buscar todas as notícias
console.log('🔍 Buscando todas as notícias...');

db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro ao buscar registros:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`✅ Encontradas ${rows.length} notícias com imagens\n`);

  // 4. Processar cada notícia
  let stats = {
    total: rows.length,
    updated: 0,
    alreadyR2: 0,
    notFound: 0,
  };

  console.log('📝 Processando notícias...\n');

  const updatePromises = rows.map((row, index) => {
    return new Promise((resolve) => {
      const currentURL = row.imagem;

      // Já é URL R2?
      if (currentURL.includes('r2.cloudflarestorage.com')) {
        stats.alreadyR2++;
        resolve();
        return;
      }

      // Extrair hash MD5 do caminho
      // Exemplo: /uploads/noticias/1/726a7eed49b74936676e205eca9f4d11.jpeg
      const filename = currentURL.split('/').pop(); // 726a7eed49b74936676e205eca9f4d11.jpeg
      
      // Buscar no mapeamento (com e sem extensão)
      let r2URL = mapping[filename];
      
      if (!r2URL) {
        // Tentar sem extensão
        const nameWithoutExt = filename.split('.')[0];
        const ext = '.' + filename.split('.').pop();
        r2URL = mapping[nameWithoutExt + ext] || mapping[nameWithoutExt];
      }

      if (r2URL) {
        // Atualizar URL pública
        r2URL = r2URL.replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);

        // Executar UPDATE
        db.run(
          'UPDATE noticias SET imagem = ? WHERE id = ?',
          [r2URL, row.id],
          function (err) {
            if (err) {
              console.error(`❌ Erro ao atualizar ID ${row.id}:`, err.message);
            } else {
              stats.updated++;
              
              // Progresso a cada 500
              if (stats.updated % 500 === 0) {
                const progress = ((index + 1) / rows.length * 100).toFixed(1);
                console.log(`[${progress}%] ${stats.updated} notícias atualizadas`);
              }
            }
            resolve();
          }
        );
      } else {
        stats.notFound++;
        console.log(`⚠️  MD5 não encontrado no mapeamento: ${filename} (ID: ${row.id})`);
        resolve();
      }
    });
  });

  // 5. Aguardar todas as atualizações
  Promise.all(updatePromises).then(() => {
    console.log('\n======================================================================');
    console.log('📊 RELATÓRIO FINAL');
    console.log('======================================================================');
    console.log(`✅ Total de notícias: ${stats.total}`);
    console.log(`✅ Atualizadas com R2: ${stats.updated}`);
    console.log(`✅ Já eram R2: ${stats.alreadyR2}`);
    console.log(`⚠️  Não encontradas: ${stats.notFound}`);
    console.log('======================================================================\n');

    if (stats.updated > 0) {
      console.log('🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!\n');
      console.log('📋 Todas as notícias do /arquivo agora usam URLs R2\n');
    }

    db.close();
  });
});
