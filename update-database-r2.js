/**
 * Script de Atualização do Banco: arquivo.db → URLs R2
 * 
 * Este script:
 * 1. Lê o mapeamento gerado por migrate-to-r2.js
 * 2. Atualiza todas as URLs de imagens no banco arquivo.db
 * 3. Gera relatório de quantas URLs foram atualizadas
 */

require('dotenv').config({ path: '.env.r2-migration' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ============================================
// CONFIGURAÇÃO
// ============================================
const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'r2-migration-mapping.json');
const LOG_FILE = path.join(__dirname, 'r2-database-update.log');

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-XXXXX.r2.dev';

// Estatísticas
let stats = {
  total: 0,
  updated: 0,
  notFound: 0,
  alreadyR2: 0,
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function loadMapping() {
  if (!fs.existsSync(MAPPING_FILE)) {
    log(`❌ ERRO: Arquivo de mapeamento não encontrado: ${MAPPING_FILE}`);
    log('Execute primeiro: node migrate-to-r2.js');
    process.exit(1);
  }

  const content = fs.readFileSync(MAPPING_FILE, 'utf-8');
  return JSON.parse(content);
}

function extractFilename(imagePath) {
  if (!imagePath) return null;
  
  // Remover protocolo se existir
  imagePath = imagePath.replace(/^https?:\/\/[^\/]+/, '');
  
  // Pegar apenas o nome do arquivo
  const parts = imagePath.split('/');
  return parts[parts.length - 1];
}

function findR2Url(imagePath, mapping) {
  if (!imagePath) return null;
  
  // Já é URL R2?
  if (imagePath.includes('.r2.dev') || imagePath.includes('r2.cloudflarestorage.com')) {
    return imagePath;
  }

  // Tentar mapear diretamente
  if (mapping[imagePath]) {
    return mapping[imagePath];
  }

  // Tentar sem barra inicial
  const withoutSlash = imagePath.replace(/^\/+/, '');
  if (mapping[withoutSlash]) {
    return mapping[withoutSlash];
  }

  // Tentar apenas o filename
  const filename = extractFilename(imagePath);
  if (filename && mapping[filename]) {
    return mapping[filename];
  }

  return null;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function updateDatabase(dryRun = false) {
  log('='.repeat(60));
  log('🔄 INICIANDO ATUALIZAÇÃO DO BANCO DE DADOS');
  log('='.repeat(60));

  if (dryRun) {
    log('⚠️ MODO DRY-RUN: Nenhuma alteração será feita no banco');
  }

  // Carregar mapeamento
  log('\n📂 Carregando mapeamento R2...');
  const mapping = loadMapping();
  log(`✅ ${Object.keys(mapping).length} entradas carregadas`);

  // Conectar ao banco
  log('\n🔌 Conectando ao banco de dados...');
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      log(`❌ ERRO ao conectar: ${err.message}`);
      process.exit(1);
    }
  });

  log('✅ Conectado ao banco arquivo.db');

  return new Promise((resolve, reject) => {
    // Buscar todas as notícias com imagens
    log('\n🔍 Buscando notícias com imagens...');
    
    db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ""', [], (err, rows) => {
      if (err) {
        log(`❌ ERRO na query: ${err.message}`);
        db.close();
        reject(err);
        return;
      }

      stats.total = rows.length;
      log(`✅ Encontradas ${stats.total} notícias com imagens`);

      if (stats.total === 0) {
        log('⚠️ Nenhuma notícia para atualizar');
        db.close();
        resolve();
        return;
      }

      // Processar cada notícia
      log('\n📝 Atualizando URLs...\n');

      const updates = [];
      
      for (const row of rows) {
        const currentUrl = row.imagem;
        
        // Já é URL R2?
        if (currentUrl.includes('.r2.dev') || currentUrl.includes('r2.cloudflarestorage.com')) {
          stats.alreadyR2++;
          continue;
        }

        // Buscar nova URL
        let newUrl = findR2Url(currentUrl, mapping);
        
        if (newUrl) {
          // Substituir placeholder pela URL pública real
          newUrl = newUrl.replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);
          
          updates.push({
            id: row.id,
            oldUrl: currentUrl,
            newUrl: newUrl,
          });
          stats.updated++;
        } else {
          stats.notFound++;
          log(`⚠️ Não encontrado mapeamento para: ${currentUrl} (ID: ${row.id})`);
        }
      }

      log(`\n📊 Estatísticas:`);
      log(`   Total analisado: ${stats.total}`);
      log(`   Para atualizar: ${updates.length}`);
      log(`   Já R2: ${stats.alreadyR2}`);
      log(`   Não encontrado: ${stats.notFound}`);

      // Executar updates
      if (!dryRun && updates.length > 0) {
        log('\n💾 Executando atualizações...');
        
        const stmt = db.prepare('UPDATE noticias SET imagem = ? WHERE id = ?');
        
        let processed = 0;
        for (const update of updates) {
          stmt.run([update.newUrl, update.id], (err) => {
            if (err) {
              log(`❌ Erro ao atualizar ID ${update.id}: ${err.message}`);
            } else {
              processed++;
              if (processed % 100 === 0) {
                process.stdout.write(`\r   Processado: ${processed}/${updates.length}`);
              }
            }
          });
        }
        
        stmt.finalize(() => {
          log(`\n✅ ${processed} URLs atualizadas com sucesso!`);
          
          // Relatório final
          log('\n' + '='.repeat(60));
          log('📊 RELATÓRIO FINAL');
          log('='.repeat(60));
          log(`✅ Total de notícias: ${stats.total}`);
          log(`✅ URLs atualizadas: ${processed}`);
          log(`✅ Já eram R2: ${stats.alreadyR2}`);
          log(`⚠️ Não encontrados: ${stats.notFound}`);
          log('='.repeat(60));
          log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
          
          db.close();
          resolve();
        });
      } else {
        if (dryRun) {
          log('\n⚠️ DRY-RUN: Nenhuma alteração foi feita');
          log('\nEXEMPLOS de atualizações que seriam feitas:');
          updates.slice(0, 5).forEach((update, i) => {
            log(`\n${i + 1}. ID ${update.id}:`);
            log(`   DE: ${update.oldUrl}`);
            log(`   PARA: ${update.newUrl}`);
          });
        }
        db.close();
        resolve();
      }
    });
  });
}

// ============================================
// EXECUÇÃO
// ============================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Verificar se URL pública está configurada
if (R2_PUBLIC_URL === 'https://pub-XXXXX.r2.dev') {
  log('⚠️ AVISO: URL pública R2 não configurada no .env.r2-migration');
  log('Configure R2_PUBLIC_URL antes de executar sem --dry-run');
  if (!dryRun) {
    process.exit(1);
  }
}

updateDatabase(dryRun).catch((error) => {
  log(`❌ ERRO FATAL: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
