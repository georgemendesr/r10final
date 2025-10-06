// 🧹 Script para limpar imagens Base64 antigas e corrigir URLs
// Executa limpeza no banco de dados para remover Base64 enormes

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco (Render ou local)
const DATA_DIR = process.env.RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'r10piaui.db');

console.log('🧹 [FIX IMAGES] Iniciando limpeza de imagens...');
console.log('📁 [FIX IMAGES] Banco de dados:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ [FIX IMAGES] Erro ao conectar ao banco:', err);
    process.exit(1);
  }
  console.log('✅ [FIX IMAGES] Conectado ao banco');
});

db.serialize(() => {
  // 1. Contar quantas imagens Base64 existem
  db.get(`
    SELECT COUNT(*) as total 
    FROM noticias 
    WHERE imagem LIKE 'data:image%' 
       OR imagem_destaque LIKE 'data:image%'
       OR imagem_url LIKE 'data:image%'
  `, (err, row) => {
    if (!err) {
      console.log(`📊 [FIX IMAGES] Total de imagens Base64 encontradas: ${row.total}`);
    }
  });
  
  // 2. Remover imagens Base64 do campo 'imagem'
  db.run(`
    UPDATE noticias 
    SET imagem = NULL 
    WHERE imagem LIKE 'data:image%'
  `, function(err) {
    if (err) {
      console.error('❌ [FIX IMAGES] Erro ao limpar campo imagem:', err);
    } else {
      console.log(`✅ [FIX IMAGES] ${this.changes} imagens Base64 removidas do campo 'imagem'`);
    }
  });
  
  // 3. Remover imagens Base64 do campo 'imagem_destaque'
  db.run(`
    UPDATE noticias 
    SET imagem_destaque = NULL 
    WHERE imagem_destaque LIKE 'data:image%'
  `, function(err) {
    if (err) {
      console.error('❌ [FIX IMAGES] Erro ao limpar campo imagem_destaque:', err);
    } else {
      console.log(`✅ [FIX IMAGES] ${this.changes} imagens Base64 removidas do campo 'imagem_destaque'`);
    }
  });
  
  // 4. Remover imagens Base64 do campo 'imagem_url'
  db.run(`
    UPDATE noticias 
    SET imagem_url = NULL 
    WHERE imagem_url LIKE 'data:image%'
  `, function(err) {
    if (err) {
      console.error('❌ [FIX IMAGES] Erro ao limpar campo imagem_url:', err);
    } else {
      console.log(`✅ [FIX IMAGES] ${this.changes} imagens Base64 removidas do campo 'imagem_url'`);
    }
  });
  
  // 5. Corrigir URLs relativas antigas (adicionar domínio completo se necessário)
  db.run(`
    UPDATE noticias 
    SET imagem = 'https://r10piaui.onrender.com' || imagem
    WHERE imagem LIKE '/uploads/%'
    AND imagem NOT LIKE 'http%'
  `, function(err) {
    if (err) {
      console.error('❌ [FIX IMAGES] Erro ao corrigir URLs relativas (imagem):', err);
    } else if (this.changes > 0) {
      console.log(`✅ [FIX IMAGES] ${this.changes} URLs relativas corrigidas no campo 'imagem'`);
    }
  });
  
  db.run(`
    UPDATE noticias 
    SET imagem_destaque = 'https://r10piaui.onrender.com' || imagem_destaque
    WHERE imagem_destaque LIKE '/uploads/%'
    AND imagem_destaque NOT LIKE 'http%'
  `, function(err) {
    if (err) {
      console.error('❌ [FIX IMAGES] Erro ao corrigir URLs relativas (imagem_destaque):', err);
    } else if (this.changes > 0) {
      console.log(`✅ [FIX IMAGES] ${this.changes} URLs relativas corrigidas no campo 'imagem_destaque'`);
    }
  });
  
  // 6. Estatísticas finais
  setTimeout(() => {
    db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN imagem IS NOT NULL THEN 1 END) as com_imagem,
        COUNT(CASE WHEN imagem_destaque IS NOT NULL THEN 1 END) as com_imagem_destaque
      FROM noticias
    `, (err, row) => {
      if (!err) {
        console.log('\n📊 [FIX IMAGES] Estatísticas finais:');
        console.log(`   Total de posts: ${row.total}`);
        console.log(`   Posts com imagem: ${row.com_imagem}`);
        console.log(`   Posts com imagem_destaque: ${row.com_imagem_destaque}`);
      }
      
      // Fechar conexão
      db.close((err) => {
        if (err) {
          console.error('❌ [FIX IMAGES] Erro ao fechar banco:', err);
        } else {
          console.log('\n✅ [FIX IMAGES] Limpeza concluída com sucesso!');
        }
      });
    });
  }, 1000); // Aguardar 1 segundo para garantir que todos os UPDATEs terminaram
});
