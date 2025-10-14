const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'arquivo', 'arquivo.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco arquivo.db\n');
});

// Verificar quantas têm URLs do Cloudinary
db.get(`
  SELECT 
    COUNT(*) as total,
    COUNT(imagem_cloudinary) as com_cloudinary,
    COUNT(imagem) as com_imagem_local
  FROM noticias
`, (err, row) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Total de notícias: ${row.total}`);
    console.log(`   Com imagem local: ${row.com_imagem_local}`);
    console.log(`   Com URL Cloudinary: ${row.com_cloudinary}`);
    console.log('');
  }
});

// Mostrar 5 exemplos
db.all(`
  SELECT id, titulo, imagem, imagem_cloudinary 
  FROM noticias 
  WHERE imagem IS NOT NULL
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log('📋 EXEMPLOS DE REGISTROS:\n');
    rows.forEach(row => {
      console.log(`ID ${row.id}: ${row.titulo.substring(0, 50)}...`);
      console.log(`   Imagem local: ${row.imagem ? row.imagem.substring(0, 60) : 'NULL'}`);
      console.log(`   Cloudinary: ${row.imagem_cloudinary || 'NULL'}`);
      console.log('');
    });
  }
  
  db.close();
});
