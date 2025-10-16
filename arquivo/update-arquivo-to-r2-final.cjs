/**
 * ATUALIZAÇÃO DEFINITIVA: arquivo.db → URLs R2
 * 
 * Este script:
 * 1. Lê o mapeamento MD5 → URL R2
 * 2. Para cada notícia do arquivo:
 *    - Extrai o hash MD5 do caminho da imagem
 *    - Busca URL R2 correspondente
 *    - Atualiza campo 'imagem' com URL R2
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = path.join(__dirname, 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('🚀 ATUALIZANDO BANCO arquivo.db COM URLs R2\n');

// Carregar mapeamento
if (!fs.existsSync(MAPPING_FILE)) {
  console.error('❌ Arquivo de mapeamento não encontrado!');
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} entradas\n`);

// Conectar ao banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco arquivo.db\n');
});

// Buscar todas as notícias
db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro ao buscar notícias:', err);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Total de notícias com imagem: ${rows.length}\n`);

  let updated = 0;
  let notFound = 0;
  let alreadyR2 = 0;

  const updatePromises = rows.map((row, index) => {
    return new Promise((resolve) => {
      const currentUrl = row.imagem;

      // Já é URL R2?
      if (currentUrl.includes('r2.cloudflarestorage.com') || currentUrl.includes('.r2.dev')) {
        alreadyR2++;
        resolve();
        return;
      }

      // Extrair hash MD5 do caminho
      // Ex: /uploads/noticias/1/726a7eed49b74936676e205eca9f4d11.jpeg
      const filename = currentUrl.split('/').pop();
      const hashMatch = filename.match(/^([a-f0-9]{32})\.(jpg|jpeg|png|gif|webp)$/i);

      if (!hashMatch) {
        notFound++;
        console.log(`⚠️  [${index + 1}/${rows.length}] Formato inválido: ${filename}`);
        resolve();
        return;
      }

      const hash = hashMatch[1];
      const ext = hashMatch[2];
      const key = `${hash}.${ext}`;

      // Buscar no mapeamento
      const r2Url = mapping[key] || mapping[hash];

      if (r2Url) {
        // Substituir placeholder pela URL real
        const finalUrl = r2Url.replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);

        db.run('UPDATE noticias SET imagem = ? WHERE id = ?', [finalUrl, row.id], (err) => {
          if (err) {
            console.error(`❌ Erro ao atualizar ID ${row.id}:`, err);
          } else {
            updated++;
            if (updated % 1000 === 0) {
              console.log(`✅ ${updated} notícias atualizadas...`);
            }
          }
          resolve();
        });
      } else {
        notFound++;
        console.log(`⚠️  [${index + 1}/${rows.length}] MD5 não encontrado: ${hash}`);
        resolve();
      }
    });
  });

  Promise.all(updatePromises).then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Total processado: ${rows.length}`);
    console.log(`✅ Atualizadas com sucesso: ${updated}`);
    console.log(`⏭️  Já eram R2: ${alreadyR2}`);
    console.log(`⚠️  Não encontradas: ${notFound}`);
    console.log('='.repeat(60));
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!\n');
    
    db.close();
  });
});
