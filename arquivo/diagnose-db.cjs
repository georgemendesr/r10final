#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const R2_PUBLIC_URL = 'https://pub-9dd576330b004101943425aed2436078.r2.dev';

console.log('='.repeat(70));
console.log('🔍 DIAGNÓSTICO: Verificando URLs no Banco');
console.log('='.repeat(70));
console.log();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err);
    process.exit(1);
  }
});

// Verificar URLs atuais
db.all(`SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN imagem LIKE '${R2_PUBLIC_URL}%' THEN 1 ELSE 0 END) as com_url_publica,
  SUM(CASE WHEN imagem LIKE 'https://pub-%' THEN 1 ELSE 0 END) as com_qualquer_r2,
  SUM(CASE WHEN imagem LIKE '%cloudinary%' THEN 1 ELSE 0 END) as com_cloudinary
FROM noticias 
WHERE imagem IS NOT NULL`, (err, rows) => {
  if (err) {
    console.error('❌ Erro ao consultar:', err);
    db.close();
    return;
  }

  const stats = rows[0];
  console.log('📊 Estatísticas das URLs:');
  console.log();
  console.log(`   Total com imagens: ${stats.total}`);
  console.log(`   Com URL pública R2 (${R2_PUBLIC_URL}): ${stats.com_url_publica}`);
  console.log(`   Com qualquer URL R2 (https://pub-*): ${stats.com_qualquer_r2}`);
  console.log(`   Com Cloudinary: ${stats.com_cloudinary}`);
  console.log();

  // Mostrar exemplos
  db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem IS NOT NULL ORDER BY id DESC LIMIT 5', (err, rows) => {
    if (err) {
      console.error('❌ Erro ao consultar exemplos:', err);
      db.close();
      return;
    }

    console.log('📸 Exemplos de URLs (últimas 5):');
    console.log();
    rows.forEach(r => {
      console.log(`ID ${r.id}:`);
      console.log(`   ${r.imagem}`);
      console.log();
    });

    console.log('='.repeat(70));
    
    if (stats.com_url_publica === stats.total) {
      console.log('✅ TODAS as URLs estão corretas!');
    } else {
      console.log('⚠️  URLs NÃO estão atualizadas!');
      console.log();
      console.log('Possíveis causas:');
      console.log('1. Transações SQLite não foram commitadas');
      console.log('2. Banco de dados tem lock');
      console.log('3. Script tem bug na lógica de UPDATE');
    }
    console.log('='.repeat(70));

    db.close();
  });
});
