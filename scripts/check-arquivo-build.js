const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('\n🔧 [BUILD] Verificando módulo arquivo...\n');

const dbPath = path.join(__dirname, '..', 'arquivo', 'arquivo.db');

// Verificar se arquivo existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ [BUILD] ERRO: arquivo/arquivo.db não encontrado!');
  console.error('   Path esperado:', dbPath);
  process.exit(1);
}

console.log('✅ [BUILD] Banco encontrado:', dbPath);

// Verificar tamanho
const stats = fs.statSync(dbPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`📊 [BUILD] Tamanho: ${sizeMB} MB`);

// Conectar e verificar estrutura
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ [BUILD] Erro ao conectar:', err);
    process.exit(1);
  }
});

// Verificar se coluna imagem_cloudinary existe
db.all(`PRAGMA table_info(noticias)`, (err, columns) => {
  if (err) {
    console.error('❌ [BUILD] Erro ao verificar colunas:', err);
    db.close();
    process.exit(1);
  }
  
  const hasColumn = columns.some(col => col.name === 'imagem_cloudinary');
  
  if (!hasColumn) {
    console.error('❌ [BUILD] ERRO: Coluna imagem_cloudinary não existe!');
    db.close();
    process.exit(1);
  }
  
  console.log('✅ [BUILD] Coluna imagem_cloudinary existe');
  
  // Contar registros com URLs
  db.get(`
    SELECT COUNT(*) as total 
    FROM noticias 
    WHERE imagem_cloudinary IS NOT NULL
  `, (err, row) => {
    if (err) {
      console.error('❌ [BUILD] Erro ao contar registros:', err);
      db.close();
      process.exit(1);
    }
    
    console.log(`📊 [BUILD] Registros com Cloudinary URLs: ${row.total}`);
    
    if (row.total < 1000) {
      console.error(`⚠️  [BUILD] AVISO: Apenas ${row.total} registros com URLs!`);
    }
    
    // Mostrar alguns exemplos
    db.all(`
      SELECT id, imagem_cloudinary 
      FROM noticias 
      WHERE imagem_cloudinary IS NOT NULL 
      LIMIT 3
    `, (err, examples) => {
      if (err) {
        console.error('❌ [BUILD] Erro ao buscar exemplos:', err);
        db.close();
        process.exit(1);
      }
      
      console.log('\n📋 [BUILD] Exemplos de URLs:');
      examples.forEach(ex => {
        console.log(`   ID ${ex.id}: ${ex.imagem_cloudinary}`);
      });
      
      console.log('\n✅ [BUILD] Módulo arquivo verificado com sucesso!\n');
      
      db.close();
      process.exit(0);
    });
  });
});
