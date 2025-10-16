/**
 * CORREÇÃO URGENTE: Atualizar domínio R2 no banco
 * 
 * Domínio ERRADO: https://pub-8dfe2e8cb78f4749b400fb5f8edc01cd.r2.dev
 * Domínio CORRETO: https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const DOMINIO_ERRADO = 'https://pub-8dfe2e8cb78f4749b400fb5f8edc01cd.r2.dev';
const DOMINIO_CORRETO = 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('======================================================================');
console.log('🔧 CORREÇÃO: Atualizando domínio R2 no banco de dados');
console.log('======================================================================\n');

console.log('❌ Domínio ERRADO:', DOMINIO_ERRADO);
console.log('✅ Domínio CORRETO:', DOMINIO_CORRETO);
console.log();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao arquivo.db\n');
});

// Contar quantas precisam ser corrigidas
db.get(
  `SELECT COUNT(*) as total FROM noticias WHERE imagem LIKE ?`,
  [`${DOMINIO_ERRADO}%`],
  (err, row) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      db.close();
      return;
    }

    console.log(`📊 ${row.total} notícias precisam ser corrigidas\n`);

    if (row.total === 0) {
      console.log('ℹ️  Nenhuma correção necessária');
      db.close();
      return;
    }

    console.log('🔄 Iniciando correção...\n');

    // Executar UPDATE para substituir o domínio
    db.run(
      `UPDATE noticias 
       SET imagem = REPLACE(imagem, ?, ?)
       WHERE imagem LIKE ?`,
      [DOMINIO_ERRADO, DOMINIO_CORRETO, `${DOMINIO_ERRADO}%`],
      function (err) {
        if (err) {
          console.error('❌ Erro ao atualizar:', err.message);
          db.close();
          return;
        }

        console.log('✅ Correção concluída!');
        console.log(`📝 ${this.changes} registros atualizados\n`);

        // Verificar resultado
        db.all(
          'SELECT id, titulo, imagem FROM noticias LIMIT 5',
          [],
          (err, rows) => {
            if (!err) {
              console.log('📸 Exemplos de URLs corrigidas:\n');
              rows.forEach(r => {
                console.log(`ID: ${r.id}`);
                console.log(`Título: ${r.titulo.substring(0, 50)}...`);
                console.log(`URL: ${r.imagem.substring(0, 100)}...`);
                console.log('---\n');
              });
            }
            db.close();
            console.log('🎉 Processo concluído!\n');
          }
        );
      }
    );
  }
);
