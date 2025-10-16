const Database = require('better-sqlite3');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('=== CORRIGINDO IMAGENS DO ARQUIVO.DB USANDO DUMP MYSQL ===\n');

// Carregar o dump MySQL
const dumpPath = 'backup/r10.db';
console.log(`Lendo dump MySQL de: ${dumpPath}\n`);

const dumpContent = fs.readFileSync(dumpPath, 'utf8');

// Abrir banco SQLite
const db = new Database('arquivo.db');

// Extrair registros do dump MySQL usando regex
// Formato: (id, ..., '/uploads/imagens/xxx.jpg', ...)
const regex = /\((\d+),\s+[^,]+,\s+[^,]+,\s+[^,]+,\s+[^,]+,\s+[^,]+,\s+'([^']+)',\s+/g;

let match;
let found = 0;
let updated = 0;
let notFound = 0;

const mapping = new Map(); // MySQL ID -> Imagem

// Primeiro, mapear todos os IDs do MySQL com suas imagens
console.log('Parseando dump MySQL...\n');
while ((match = regex.exec(dumpContent)) !== null) {
  const mysqlId = parseInt(match[1]);
  const imagePath = match[2];
  
  if (imagePath && imagePath.includes('/uploads/imagens/')) {
    mapping.set(mysqlId, imagePath);
    found++;
  }
}

console.log(`✓ ${found} registros encontrados no dump MySQL\n`);

// Agora, tentar mapear por título (já que os IDs mudaram)
console.log('Buscando correspondências por título...\n');

// Extrair títulos do MySQL
const titleRegex = /\(\d+,\s+'[^']*',\s+'[^']*',\s+\d+,\s+'[^']*',\s+'([^']+)',/g;
const mysqlData = [];

const lines = dumpContent.split('\n');
for (const line of lines) {
  if (line.trim().startsWith('(') && line.includes('/uploads/imagens/')) {
    // Tentar extrair dados
    const parts = line.split(',');
    if (parts.length > 7) {
      const id = parts[0].replace('(', '').trim();
      // Título está em alguma posição, vamos procurar
      const titleMatch = line.match(/'([^']{20,})',\s+'[^']*',\s+'\/uploads\/imagens/);
      const imgMatch = line.match(/'(\/uploads\/imagens\/[^']+)'/);
      
      if (titleMatch && imgMatch) {
        mysqlData.push({
          id: parseInt(id),
          titulo: titleMatch[1],
          imagem: imgMatch[1]
        });
      }
    }
  }
}

console.log(`✓ ${mysqlData.length} notícias parseadas do MySQL\n`);

// Agora mapear com SQLite por título
const sqliteNoticias = db.prepare('SELECT id, titulo, imagem FROM noticias').all();

console.log('Mapeando por título...\n');

db.exec('BEGIN TRANSACTION');

for (const sqliteNoticia of sqliteNoticias) {
  // Procurar no MySQL por título similar
  const mysqlNoticia = mysqlData.find(m => 
    m.titulo.toLowerCase().trim() === sqliteNoticia.titulo.toLowerCase().trim()
  );
  
  if (mysqlNoticia) {
    // Verificar se as imagens são diferentes
    const sqliteImg = sqliteNoticia.imagem || '';
    const mysqlImg = mysqlNoticia.imagem || '';
    
    // Extrair apenas o nome do arquivo (sem path/domínio)
    const sqliteFilename = path.basename(sqliteImg.split('?')[0]);
    const mysqlFilename = path.basename(mysqlImg);
    
    if (sqliteFilename !== mysqlFilename) {
      console.log(`\nID ${sqliteNoticia.id}: "${sqliteNoticia.titulo.substring(0, 50)}..."`);
      console.log(`  SQLite: ${sqliteFilename}`);
      console.log(`  MySQL:  ${mysqlFilename}`);
      
      // Verificar se o arquivo MySQL existe localmente
      const localPath = `uploads/imagens/${mysqlFilename}`;
      if (fs.existsSync(localPath)) {
        console.log(`  ✓ Arquivo existe localmente`);
        
        // Calcular MD5 do arquivo correto
        const fileBuffer = fs.readFileSync(localPath);
        const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
        
        // Procurar no mapeamento R2
        const mappingFile = JSON.parse(fs.readFileSync('md5-to-r2-mapping.json', 'utf8'));
        const r2Url = mappingFile[md5];
        
        if (r2Url) {
          console.log(`  ✓ URL R2 encontrada: ${r2Url}`);
          
          // Atualizar banco
          db.prepare('UPDATE noticias SET imagem = ? WHERE id = ?').run(r2Url, sqliteNoticia.id);
          updated++;
          console.log(`  ✓ ATUALIZADO!`);
        } else {
          console.log(`  ✗ URL R2 não encontrada para MD5: ${md5}`);
        }
      } else {
        console.log(`  ✗ Arquivo não existe: ${localPath}`);
        notFound++;
      }
    }
  }
}

db.exec('COMMIT');
db.close();

console.log(`\n=== RESUMO ===`);
console.log(`Registros MySQL: ${mysqlData.length}`);
console.log(`Registros SQLite: ${sqliteNoticias.length}`);
console.log(`Atualizados: ${updated}`);
console.log(`Não encontrados: ${notFound}`);
