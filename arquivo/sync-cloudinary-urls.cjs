#!/usr/bin/env node
/**
 * Script automático: busca todas as imagens na pasta arquivo/uploads do Cloudinary
 * e atualiza o banco arquivo.db com as URLs corretas.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Carregar .env se existir
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch(_) {}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dd6ln5xmu',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const DB_PATH = path.join(__dirname, 'arquivo.db');

function log(msg) { console.log('[sync-cloudinary]', msg); }
function err(msg) { console.error('[sync-cloudinary][ERROR]', msg); }

// Função para buscar recursos do Cloudinary via SDK
async function fetchCloudinaryResources(prefix = 'arquivo/uploads') {
  try {
    log('Buscando recursos do Cloudinary...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: prefix,
      max_results: 500
    });
    return result.resources || [];
  } catch (e) {
    throw new Error(`Cloudinary API error: ${e.message}`);
  }
}

// Mapeamento de filename → URL completa
async function buildFilenameMap() {
  log('Buscando recursos do Cloudinary...');
  const resources = await fetchCloudinaryResources('arquivo/uploads');
  log(`Encontrados ${resources.length} recursos`);

  const map = new Map();
  for (const r of resources) {
    // r.public_id exemplo: "arquivo/uploads/imagens/xcv-1683054792"
    // r.secure_url: URL completa com versão
    const parts = r.public_id.split('/');
    const filename = parts[parts.length - 1];
    // Adicionar extensões comuns se não tiver
    const formats = [r.format, 'jpg', 'jpeg', 'png', 'webp'];
    for (const ext of formats) {
      if (!ext) continue;
      const key = `${filename}.${ext}`;
      if (!map.has(key)) {
        map.set(key, r.secure_url);
      }
    }
  }
  log(`Mapeamento criado: ${map.size} entradas`);
  return map;
}

// Atualizar banco de dados
async function updateDatabase(filenameMap) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
      
      log('Conectado ao banco arquivo.db');
      
      db.all(`SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != ''`, (err, rows) => {
        if (err) {
          db.close();
          return reject(err);
        }

        log(`Processando ${rows.length} notícias...`);
        let updated = 0;
        let promises = [];

        for (const row of rows) {
          // Extrair filename do caminho /uploads/.../arquivo.ext
          const filename = row.imagem.split('/').pop();
          const cloudUrl = filenameMap.get(filename);
          
          if (cloudUrl && cloudUrl !== row.imagem) {
            const p = new Promise((res, rej) => {
              db.run(
                `UPDATE noticias SET imagem = ? WHERE id = ?`,
                [cloudUrl, row.id],
                (err) => {
                  if (err) rej(err);
                  else {
                    updated++;
                    res();
                  }
                }
              );
            });
            promises.push(p);
          }
        }

        Promise.all(promises).then(() => {
          log(`✅ ${updated} notícias atualizadas com URLs Cloudinary`);
          db.close(() => resolve(updated));
        }).catch(e => {
          db.close();
          reject(e);
        });
      });
    });
  });
}

// Execução principal
(async () => {
  try {
    const map = await buildFilenameMap();
    const count = await updateDatabase(map);
    log('Sincronização concluída!');
    process.exit(0);
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
})();
