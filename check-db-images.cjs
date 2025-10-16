const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
});

console.log('🔍 VERIFICANDO FORMATO DAS IMAGENS NO BANCO\n');

// Análise geral
db.all(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN imagem LIKE 'https://%' THEN 1 ELSE 0 END) as com_https,
    SUM(CASE WHEN imagem LIKE '/uploads/%' THEN 1 ELSE 0 END) as com_uploads,
    SUM(CASE WHEN imagem IS NULL OR imagem = '' THEN 1 ELSE 0 END) as sem_imagem
  FROM noticias
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    return;
  }

  const stats = rows[0];
  console.log('📊 ESTATÍSTICAS GERAIS:');
  console.log(`   Total de notícias: ${stats.total}`);
  console.log(`   Com HTTPS: ${stats.com_https}`);
  console.log(`   Com /uploads/: ${stats.com_uploads}`);
  console.log(`   Sem imagem: ${stats.sem_imagem}`);
  console.log('');

  // Exemplos de cada tipo
  console.log('📋 EXEMPLOS DE URLs NO BANCO:\n');

  db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem LIKE "/uploads/%" LIMIT 5', [], (err, rows) => {
    if (!err && rows.length > 0) {
      console.log('1️⃣ URLs com /uploads/ (caminhos locais):');
      rows.forEach(r => {
        console.log(`   ID ${r.id}: ${r.imagem.substring(0, 80)}`);
      });
      console.log('');
    }

    db.all('SELECT id, titulo, imagem FROM noticias WHERE imagem LIKE "https://%" LIMIT 5', [], (err, rows) => {
      if (!err && rows.length > 0) {
        console.log('2️⃣ URLs com HTTPS:');
        rows.forEach(r => {
          console.log(`   ID ${r.id}: ${r.imagem.substring(0, 80)}`);
        });
        console.log('');
      }

      // Verificar se tem hash MD5
      db.all(`
        SELECT id, imagem 
        FROM noticias 
        WHERE imagem LIKE '%/%.jpeg' 
           OR imagem LIKE '%/%.jpg'
           OR imagem LIKE '%/%.png'
        LIMIT 10
      `, [], (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('3️⃣ Formato dos caminhos (verificar se são hashes MD5 ou nomes descritivos):\n');
          rows.forEach(r => {
            const filename = r.imagem.split('/').pop();
            const isHash = /^[a-f0-9]{32}\.(jpg|jpeg|png)$/i.test(filename);
            console.log(`   ID ${r.id}:`);
            console.log(`   Caminho: ${r.imagem}`);
            console.log(`   Arquivo: ${filename}`);
            console.log(`   É hash MD5? ${isHash ? '✅ SIM' : '❌ NÃO (nome descritivo)'}`);
            console.log('');
          });
        }

        db.close();
        
        console.log('\n⚠️ IMPORTANTE: O script de migração criará múltiplos mapeamentos:');
        console.log('   - Nome do arquivo → URL R2');
        console.log('   - Caminho completo → URL R2');
        console.log('   - Hash MD5 → URL R2');
        console.log('\nIsso DEVE resolver o problema de mapeamento! ✅');
      });
    });
  });
});
