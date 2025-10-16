const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const MAPPING_FILE = path.join(__dirname, 'md5-to-r2-mapping.json');
const R2_DOMAIN = 'https://5f0b85f2c85c5b4a036bb93c338176b2.r2.cloudflarestorage.com/arquivo-r10-imagens';

console.log('======================================================================');
console.log('🔄 CORREÇÃO FINAL: URLs R2 com domínio correto');
console.log('======================================================================\n');

// Carregar mapeamento
const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
console.log(`✅ Mapeamento carregado: ${Object.keys(mapping).length} entradas\n`);

// Atualizar todas as URLs no mapeamento para usar o domínio correto
const mappingCorrigido = {};
for (const [key, url] of Object.entries(mapping)) {
  // Substituir pub-XXXXX.r2.dev pelo domínio correto
  const urlCorrigida = url.replace(
    'https://pub-XXXXX.r2.dev',
    R2_DOMAIN
  );
  mappingCorrigido[key] = urlCorrigida;
}

console.log('📝 Atualizando banco de dados...\n');

const db = new sqlite3.Database(DB_PATH);

// Pegar todas as notícias
db.all('SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    return;
  }

  console.log(`📊 ${rows.length} notícias para processar\n`);

  let updated = 0;
  let notFound = 0;

  const promises = rows.map(row => {
    return new Promise(resolve => {
      // Extrair apenas o caminho relativo
      // De: https://5f0b85f2c85c5b4a...com/arquivo-r10-imagens/uploads/editor/nome.png
      // Para: arquivo/uploads/editor/nome.png
      
      let relativePath = row.imagem;
      if (relativePath.includes('/arquivo-r10-imagens/')) {
        relativePath = relativePath.split('/arquivo-r10-imagens/')[1];
      } else if (relativePath.includes('/arquivo/uploads/')) {
        relativePath = relativePath.split('/arquivo/uploads/').pop();
        relativePath = 'arquivo/uploads/' + relativePath;
      }

      // Montar a URL correta
      const urlCorreta = `${R2_DOMAIN}/${relativePath}`;

      // Atualizar
      db.run(
        'UPDATE noticias SET imagem = ? WHERE id = ?',
        [urlCorreta, row.id],
        err => {
          if (!err) {
            updated++;
            if (updated % 1000 === 0) {
              console.log(`✅ ${updated} notícias atualizadas...`);
            }
          }
          resolve();
        }
      );
    });
  });

  Promise.all(promises).then(() => {
    console.log('\n======================================================================');
    console.log('📊 RESULTADO');
    console.log('======================================================================');
    console.log(`✅ Atualizadas: ${updated}`);
    console.log('======================================================================\n');

    // Mostrar exemplos
    db.all('SELECT id, titulo, imagem FROM noticias LIMIT 3', [], (err, examples) => {
      if (!err) {
        console.log('📸 Exemplos:\n');
        examples.forEach(ex => {
          console.log(`ID: ${ex.id}`);
          console.log(`Título: ${ex.titulo.substring(0, 40)}...`);
          console.log(`URL: ${ex.imagem}`);
          console.log('---\n');
        });
      }
      db.close();
      console.log('🎉 Concluído!\n');
    });
  });
});
