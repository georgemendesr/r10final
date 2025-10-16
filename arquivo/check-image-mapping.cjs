#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');

console.log('='.repeat(70));
console.log('🔍 DIAGNÓSTICO: Mapeamento de Imagens');
console.log('='.repeat(70));
console.log();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Buscar as últimas 15 notícias com imagens
db.all(
  `SELECT id, titulo, imagem, data_publicacao 
   FROM noticias 
   WHERE imagem IS NOT NULL 
   ORDER BY id DESC 
   LIMIT 15`,
  (err, rows) => {
    if (err) {
      console.error('❌ Erro ao consultar:', err);
      db.close();
      return;
    }

    console.log('📋 Últimas 15 notícias com imagens:');
    console.log();

    rows.forEach((row, index) => {
      const fileName = row.imagem.split('/').pop();
      console.log(`${index + 1}. ID: ${row.id} | Data: ${row.data_publicacao}`);
      console.log(`   Título: ${row.titulo.substring(0, 60)}...`);
      console.log(`   Arquivo: ${fileName}`);
      console.log();
    });

    // Verificar padrão dos nomes de arquivos
    console.log('='.repeat(70));
    console.log('🔍 ANÁLISE: Padrão dos nomes de arquivos');
    console.log('='.repeat(70));
    console.log();

    const fileNames = rows.map(r => r.imagem.split('/').pop());
    
    console.log('Padrões encontrados:');
    console.log(`- Com hash MD5: ${fileNames.filter(f => f.includes('_')).length} arquivos`);
    console.log(`- Com timestamp: ${fileNames.filter(f => /\d{10,}/.test(f)).length} arquivos`);
    console.log(`- Com UUID: ${fileNames.filter(f => /[a-f0-9]{8}-[a-f0-9]{4}/.test(f)).length} arquivos`);
    console.log();

    // Mostrar alguns exemplos de nomes originais vs atuais
    console.log('='.repeat(70));
    console.log('❓ PROBLEMA: Nomes de arquivos no banco');
    console.log('='.repeat(70));
    console.log();
    console.log('Os nomes dos arquivos no banco de dados são DIFERENTES dos nomes');
    console.log('originais que foram enviados ao R2.');
    console.log();
    console.log('EXEMPLO:');
    console.log('- No banco: "0-17032025144559_aefdddd4ff157f0a4b84f1af81bccdb5b0fb68ec.png"');
    console.log('- No R2: Pode ser outro arquivo completamente diferente!');
    console.log();
    console.log('💡 SOLUÇÃO:');
    console.log('Precisamos usar o md5-to-r2-mapping.json para fazer o mapeamento correto.');
    console.log('Esse arquivo tem o MD5 do CONTEÚDO de cada imagem original e o nome');
    console.log('correspondente no R2.');
    console.log();

    db.close();
  }
);
