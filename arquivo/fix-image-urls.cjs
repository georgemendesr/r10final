#!/usr/bin/env node
/**
 * Script simples: atualiza URLs do banco usando padrão conhecido do Cloudinary
 * (sem precisar de API - usa inferência + HEAD check)
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, 'arquivo.db');
const CLOUD_NAME = 'dd6ln5xmu';
const KNOWN_VERSIONS = ['1760376718', '1760376717', '1760377573'];

function log(msg) { console.log('[fix-urls]', msg); }

function headCheck(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'HEAD',
      timeout: 3000
    };
    
    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function findWorkingUrl(originalPath) {
  const filename = originalPath.split('/').pop();
  if (!/\.(jpe?g|png|webp|jpg)$/i.test(filename)) return null;
  
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const tipos = ['imagens', 'editor'];
  
  // Testar com versões primeiro
  for (const ver of KNOWN_VERSIONS) {
    for (const tipo of tipos) {
      const url = `${base}/v${ver}/arquivo/uploads/${tipo}/${filename}`;
      const ok = await headCheck(url);
      if (ok) return url;
    }
  }
  
  // Testar sem versão
  for (const tipo of tipos) {
    const url = `${base}/arquivo/uploads/${tipo}/${filename}`;
    const ok = await headCheck(url);
    if (ok) return url;
  }
  
  return null;
}

async function updateDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) return reject(err);
      
      log('Conectado ao banco arquivo.db');
      
      db.all(`SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != '' AND imagem NOT LIKE 'https://%' LIMIT 50`, async (err, rows) => {
        if (err) {
          db.close();
          return reject(err);
        }

        log(`Processando ${rows.length} notícias (limite 50 para teste)...`);
        let updated = 0;

        for (const row of rows) {
          const cloudUrl = await findWorkingUrl(row.imagem);
          
          if (cloudUrl) {
            await new Promise((res, rej) => {
              db.run(
                `UPDATE noticias SET imagem = ? WHERE id = ?`,
                [cloudUrl, row.id],
                (err) => {
                  if (err) rej(err);
                  else {
                    updated++;
                    log(`✓ ${row.id}: ${cloudUrl}`);
                    res();
                  }
                }
              );
            });
          } else {
            log(`✗ ${row.id}: nenhuma URL encontrada para ${row.imagem}`);
          }
        }

        log(`✅ ${updated}/${rows.length} notícias atualizadas`);
        db.close(() => resolve(updated));
      });
    });
  });
}

// Execução
(async () => {
  try {
    await updateDatabase();
    log('Concluído!');
    process.exit(0);
  } catch (e) {
    console.error('[fix-urls][ERROR]', e.message);
    process.exit(1);
  }
})();
