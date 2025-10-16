const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const R2_PUBLIC_URL = 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('🚀 ATUALIZANDO BANCO ARQUIVO.DB COM URLs R2\n');

// Carregar mapeamento
const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} entradas\n`);

const db = new sqlite3.Database(DB_PATH);

// Buscar todas notícias
db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }

  console.log(`📊 Total de notícias com imagem: ${rows.length}\n`);

  let updated = 0;
  let notFound = 0;

  const stmt = db.prepare('UPDATE noticias SET imagem = ? WHERE id = ?');

  rows.forEach((row, i) => {
    // Extrair nome do arquivo
    const filename = row.imagem.split('/').pop();
    
    // Buscar no mapeamento
    const r2URL = mapping[filename];
    
    if (r2URL) {
      // Atualizar com URL pública
      const finalURL = r2URL.replace('https://pub-XXXXX.r2.dev', R2_PUBLIC_URL);
      stmt.run([finalURL, row.id]);
      updated++;
      
      if ((i + 1) % 1000 === 0) {
        console.log(`[${((i + 1) / rows.length * 100).toFixed(1)}%] ${i + 1}/${rows.length} processados`);
      }
    } else {
      notFound++;
    }
  });

  stmt.finalize(() => {
    console.log('\n✅ CONCLUÍDO!\n');
    console.log(`📊 Resultado:`);
    console.log(`   - Atualizados: ${updated}`);
    console.log(`   - Não encontrados: ${notFound}`);
    db.close();
  });
});
