#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';

console.log('='.repeat(70));
console.log('🔧 CORREÇÃO: Caminhos R2 com /arquivo/uploads/');
console.log('='.repeat(70));
console.log();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Primeiro, vamos ver o estado atual
db.all(`SELECT id, titulo, imagem FROM noticias WHERE imagem LIKE '%${R2_PUBLIC_URL}%' LIMIT 5`, (err, rows) => {
  if (err) {
    console.error('❌ Erro ao consultar:', err);
    db.close();
    return;
  }

  console.log('📋 Estado ATUAL das URLs:');
  console.log();
  rows.forEach(row => {
    console.log(`ID ${row.id}: ${row.imagem}`);
  });
  console.log();
  console.log('🔄 Corrigindo caminhos...');
  console.log();

  // Corrigir URLs que perderam o /arquivo/uploads/
  // De: https://pub-XXX.r2.dev/editor/file.jpg
  // Para: https://pub-XXX.r2.dev/arquivo/uploads/editor/file.jpg
  db.run(
    `UPDATE noticias 
     SET imagem = REPLACE(imagem, 
       '${R2_PUBLIC_URL}/editor/', 
       '${R2_PUBLIC_URL}/arquivo/uploads/editor/'
     )
     WHERE imagem LIKE '${R2_PUBLIC_URL}/editor/%'`,
    function(err) {
      if (err) {
        console.error('❌ Erro ao atualizar /editor/:', err);
      } else {
        console.log(`✅ Atualizados ${this.changes} registros com /editor/`);
      }

      // Corrigir /imagens/
      db.run(
        `UPDATE noticias 
         SET imagem = REPLACE(imagem, 
           '${R2_PUBLIC_URL}/imagens/', 
           '${R2_PUBLIC_URL}/arquivo/uploads/imagens/'
         )
         WHERE imagem LIKE '${R2_PUBLIC_URL}/imagens/%'`,
        function(err) {
          if (err) {
            console.error('❌ Erro ao atualizar /imagens/:', err);
          } else {
            console.log(`✅ Atualizados ${this.changes} registros com /imagens/`);
          }

          // Mostrar exemplos após correção
          db.all(`SELECT id, titulo, imagem FROM noticias WHERE imagem LIKE '%${R2_PUBLIC_URL}%' LIMIT 10`, (err, rows) => {
            if (err) {
              console.error('❌ Erro ao consultar exemplos:', err);
              db.close();
              return;
            }

            console.log();
            console.log('📸 URLs CORRIGIDAS (exemplos):');
            console.log();
            rows.forEach(row => {
              console.log(`ID: ${row.id}`);
              console.log(`Título: ${row.titulo.substring(0, 50)}...`);
              console.log(`URL: ${row.imagem}`);
              console.log('---');
            });

            console.log();
            console.log('🎉 Processo concluído!');
            console.log();
            console.log('🌐 Teste agora: https://r10piaui.onrender.com/arquivo');
            console.log();

            db.close();
          });
        }
      );
    }
  );
});
