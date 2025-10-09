#!/usr/bin/env node
/**
 * Script de migração: Limpar cache TTS antigo (filesystem local)
 * 
 * Remove todos os registros da tabela tts_cache que usavam filesystem local
 * (antes da migração para Cloudinary)
 * 
 * Execute: node limpar-cache-tts-antigo.cjs
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'server', 'database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🧹 Limpando cache TTS antigo (filesystem local)...\n');

// Verificar registros existentes
db.all('SELECT * FROM tts_cache WHERE cloudinary_public_id IS NULL', (err, registrosAntigos) => {
  if (err) {
    console.error('❌ Erro ao consultar cache:', err);
    process.exit(1);
  }

  if (registrosAntigos.length === 0) {
    console.log('✅ Nenhum registro antigo encontrado. Cache já migrado!');
    db.close();
    process.exit(0);
  }

  console.log(`📊 Encontrados ${registrosAntigos.length} registros antigos:`);
  registrosAntigos.forEach(r => {
    console.log(`  - Post ${r.post_id}: ${r.audio_filename || r.audio_url} (${r.provider})`);
  });

  console.log('\n🗑️ Removendo registros antigos...');

  // Deletar registros sem cloudinary_public_id (filesystem local)
  db.run('DELETE FROM tts_cache WHERE cloudinary_public_id IS NULL', function(err) {
    if (err) {
      console.error('❌ Erro ao deletar:', err);
      process.exit(1);
    }

    console.log(`\n✅ ${this.changes} registros removidos com sucesso!`);
    console.log('📝 Próximas gerações de TTS usarão Cloudinary automaticamente.');
    
    db.close();
  });
});
