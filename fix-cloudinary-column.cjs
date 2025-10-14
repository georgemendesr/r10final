const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'arquivo', 'arquivo.db');

console.log('🔧 Corrigindo estrutura do banco de dados...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco arquivo.db');
});

// Passo 1: Adicionar coluna imagem_cloudinary se não existir
db.run(`
  ALTER TABLE noticias ADD COLUMN imagem_cloudinary TEXT
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️  Coluna imagem_cloudinary já existe');
      atualizarURLs();
    } else {
      console.error('❌ Erro ao adicionar coluna:', err);
      db.close();
      process.exit(1);
    }
  } else {
    console.log('✅ Coluna imagem_cloudinary adicionada');
    atualizarURLs();
  }
});

function atualizarURLs() {
  console.log('\n📝 Atualizando URLs do Cloudinary...');
  
  // Buscar todas as notícias que têm imagem local
  db.all(`
    SELECT id, imagem 
    FROM noticias 
    WHERE imagem IS NOT NULL AND imagem != ''
  `, (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar notícias:', err);
      db.close();
      return;
    }
    
    console.log(`📊 Encontradas ${rows.length} notícias com imagens\n`);
    
    let updated = 0;
    let processed = 0;
    
    rows.forEach((row, index) => {
      // Extrair nome do arquivo da URL local
      // Ex: uploads/2024/05/image.jpg -> image.jpg
      const filename = row.imagem.split('/').pop().split('?')[0];
      
      // Construir URL do Cloudinary usando o padrão que usamos no upload
      // A pasta no Cloudinary é "r10-arquivo-antigo"
      const cloudinaryUrl = `https://res.cloudinary.com/dlogsw1hy/image/upload/v1/r10-arquivo-antigo/${filename}`;
      
      db.run(`
        UPDATE noticias 
        SET imagem_cloudinary = ? 
        WHERE id = ?
      `, [cloudinaryUrl, row.id], (err) => {
        processed++;
        
        if (err) {
          console.error(`❌ Erro ao atualizar ID ${row.id}:`, err.message);
        } else {
          updated++;
        }
        
        // Quando terminar todos
        if (processed === rows.length) {
          console.log(`\n✅ Atualização concluída!`);
          console.log(`   ${updated} registros atualizados de ${rows.length} total`);
          
          // Verificar resultados
          verificarResultados();
        }
      });
    });
  });
}

function verificarResultados() {
  console.log('\n🔍 Verificando resultados...\n');
  
  db.all(`
    SELECT id, titulo, imagem_cloudinary 
    FROM noticias 
    WHERE imagem_cloudinary IS NOT NULL 
    LIMIT 5
  `, (err, rows) => {
    if (err) {
      console.error('❌ Erro:', err);
    } else {
      console.log('📋 EXEMPLOS DE REGISTROS ATUALIZADOS:\n');
      rows.forEach(row => {
        console.log(`ID ${row.id}: ${row.titulo.substring(0, 50)}...`);
        console.log(`   URL: ${row.imagem_cloudinary}`);
        console.log('');
      });
    }
    
    db.get(`
      SELECT COUNT(*) as total
      FROM noticias
      WHERE imagem_cloudinary IS NOT NULL
    `, (err, row) => {
      if (err) {
        console.error('❌ Erro:', err);
      } else {
        console.log(`📊 TOTAL: ${row.total} notícias com URLs do Cloudinary`);
      }
      
      db.close();
      console.log('\n✅ Processo concluído!');
      console.log('\n⚠️  PRÓXIMO PASSO: Fazer upload do arquivo.db atualizado para o Render');
    });
  });
}
