/**
 * ATUALIZAÇÃO INTELIGENTE: Banco arquivo.db → URLs R2
 * 
 * Este script:
 * 1. Lê o mapeamento MD5 → URL R2 (md5-to-r2-mapping.json)
 * 2. Para cada registro no banco com imagem local
 * 3. Calcula MD5 do caminho da imagem
 * 4. Busca URL R2 correspondente no mapeamento
 * 5. Atualiza o registro com a nova URL
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// =======================================
// CONFIGURAÇÕES
// =======================================

const DB_PATH = path.join(__dirname, 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_PUBLIC_URL) {
  console.error('❌ ERRO: R2_PUBLIC_URL não configurada no .env');
  process.exit(1);
}

// =======================================
// FUNÇÕES AUXILIARES
// =======================================

/**
 * Calcula MD5 de uma string (caminho de arquivo)
 */
function calculateMD5(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Extrai o nome do arquivo de uma URL
 * Ex: "/uploads/noticias/1/726a7eed49b74936676e205eca9f4d11.jpeg" → "726a7eed49b74936676e205eca9f4d11.jpeg"
 */
function extractImagePath(url) {
  if (!url) return null;
  
  // Pegar apenas o nome do arquivo (última parte do path)
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  return filename || null;
}

/**
 * Verifica se URL já é do R2
 */
function isR2URL(url) {
  return url && (
    url.includes('r2.cloudflarestorage.com') ||
    url.includes('r2.dev') ||
    url.includes('cloudflare')
  );
}

// =======================================
// MAIN
// =======================================

async function updateDatabase() {
  console.log('======================================================================');
  console.log('🔄 ATUALIZAÇÃO BANCO DE DADOS → URLs R2');
  console.log('======================================================================\n');

  // 1. Carregar mapeamento MD5
  console.log('📖 Carregando mapeamento MD5...');
  
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`❌ Arquivo não encontrado: ${MAPPING_FILE}`);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} MD5s\n`);

  // 2. Conectar ao banco
  console.log('🔌 Conectando ao banco de dados...');
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar:', err.message);
      process.exit(1);
    }
  });

  console.log('✅ Conectado ao banco\n');

  // 3. Buscar todos os registros com imagens
  console.log('🔍 Buscando registros com imagens...');

  db.all(
    `SELECT id, imagem 
     FROM noticias 
     WHERE imagem IS NOT NULL AND imagem != ''`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar registros:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`✅ Encontrados ${rows.length} registros com imagens\n`);

      // 4. Processar cada registro
      let updatedCount = 0;
      let skippedCount = 0;
      let notFoundCount = 0;

      const updatePromises = rows.map((row, index) => {
        return new Promise((resolve) => {
          const currentURL = row.imagem;
          
          if (!currentURL) {
            resolve();
            return;
          }

          // Pular se já for URL R2
          if (isR2URL(currentURL)) {
            skippedCount++;
            resolve();
            return;
          }

          // Extrair caminho da imagem
          const imagePath = extractImagePath(currentURL);
          if (!imagePath) {
            resolve();
            return;
          }

          // Calcular MD5
          const md5 = calculateMD5(imagePath);

          // Buscar no mapeamento
          const r2URL = mapping[md5];

          if (r2URL) {
            // Executar UPDATE
            db.run(
              `UPDATE noticias SET imagem = ? WHERE id = ?`,
              [r2URL, row.id],
              function (err) {
                if (err) {
                  console.error(`❌ Erro ao atualizar registro ${row.id}:`, err.message);
                } else {
                  updatedCount++;
                  if ((index + 1) % 100 === 0) {
                    console.log(`[${((index + 1) / rows.length * 100).toFixed(1)}%] ${index + 1}/${rows.length} registros processados`);
                  }
                }
                resolve();
              }
            );
          } else {
            notFoundCount++;
            console.log(`⚠️  MD5 não encontrado: ${imagePath} (${md5})`);
            resolve();
          }
        });
      });

      // 5. Aguardar todas as atualizações
      Promise.all(updatePromises).then(() => {
        console.log('\n======================================================================');
        console.log('📊 RELATÓRIO FINAL');
        console.log('======================================================================');
        console.log(`✅ Registros atualizados: ${updatedCount}`);
        console.log(`⏭️  Registros pulados (já R2): ${skippedCount}`);
        console.log(`⚠️  Imagens não encontradas: ${notFoundCount}`);
        console.log('======================================================================\n');
        console.log('🎉 ATUALIZAÇÃO CONCLUÍDA!\n');

        db.close();
      });
    }
  );
}

// Executar
updateDatabase().catch(console.error);
