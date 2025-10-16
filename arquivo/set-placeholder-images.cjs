#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');

// Placeholder padrão - você pode substituir por uma imagem do seu site
const PLACEHOLDER_URL = 'https://placehold.co/400x200?text=Not%C3%ADcia+Arquivada';

console.log('='.repeat(70));
console.log('🖼️  SOLUÇÃO: Placeholder para Notícias Arquivadas');
console.log('='.repeat(70));
console.log();
console.log('❓ PROBLEMA:');
console.log('As imagens no banco têm nomes originais, mas no R2 foram renomeadas');
console.log('com MD5 do conteúdo. Sem os arquivos originais, não podemos calcular');
console.log('o MD5 para fazer o mapeamento correto.');
console.log();
console.log('✅ SOLUÇÃO:');
console.log('Usar NULL para todas as imagens - o sistema já tem fallback:');
console.log('onerror="this.src=\'https://placehold.co/400x200?text=Sem+Imagem\'"');
console.log();
console.log('─'.repeat(70));
console.log();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Contar quantas notícias têm imagens
db.get('SELECT COUNT(*) as total FROM noticias WHERE imagem IS NOT NULL', (err, row) => {
  if (err) {
    console.error('❌ Erro ao contar:', err);
    db.close();
    return;
  }

  console.log(`📊 Notícias com imagens: ${row.total}`);
  console.log();
  console.log('🔄 Atualizando para NULL (usa placeholder automático)...');
  console.log();

  // Atualizar todas as imagens para NULL
  db.run('UPDATE noticias SET imagem = NULL WHERE imagem IS NOT NULL', function(err) {
    if (err) {
      console.error('❌ Erro ao atualizar:', err);
      db.close();
      return;
    }

    console.log(`✅ Atualizados ${this.changes} registros`);
    console.log();
    console.log('📸 Agora todas as notícias usarão o placeholder padrão:');
    console.log('   https://placehold.co/400x200?text=Sem+Imagem');
    console.log();
    console.log('💡 ALTERNATIVA:');
    console.log('Se quiser, você pode criar uma imagem personalizada no Canva');
    console.log('(400x200px) com "Notícia Arquivada" e fazer upload para o R2.');
    console.log('Depois, atualize todas as imagens para essa URL.');
    console.log();
    console.log('🎉 Processo concluído!');
    console.log();

    db.close();
  });
});
