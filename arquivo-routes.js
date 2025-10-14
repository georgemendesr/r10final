/**
 * MÓDULO DE ARQUIVO - INTEGRAÇÃO AO SITE PRINCIPAL
 * 
 * Este arquivo integra o módulo de arquivo ao site principal
 * sem alterar o código existente. Totalmente isolado e seguro.
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const arquivoRouter = express.Router();

// Cache simples em memória para URLs validadas (existe -> true, inexistente -> false)
const __cloudCache = new Map(); // key = url, value = { ok:boolean, ts:number }
const CLOUD_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h
const MAX_PARALLEL_HEAD = 8;
let activeHead = 0;
const headQueue = [];
// Versões Cloudinary conhecidas observadas (podem ser expandidas dinamicamente se quisermos)
// Conjunto de versões Cloudinary observadas em URLs reais.
// Adicionadas inicialmente a partir de exemplos coletados.
const __KNOWN_VERSIONS = new Set(['1760376718','1760376717','1760377573']);
const MAX_KNOWN_VERSIONS = 8;

function scheduleHead(url, fetchImpl) {
  return new Promise((resolve) => {
    const job = async () => {
      try {
        activeHead++;
        let ok = false;
        try {
          const controller = new AbortController();
          const to = setTimeout(()=>controller.abort(), 4000);
          const res = await fetchImpl(url, { method: 'HEAD', signal: controller.signal });
          clearTimeout(to);
          ok = res.ok;
        } catch(_) { ok = false; }
        __cloudCache.set(url, { ok, ts: Date.now() });
        if (ok) {
          // Aprendizado automático: se a URL tinha /v<digits>/ memorizar versão
            const m = url.match(/\/image\/upload\/v(\d+)\//);
            if (m && m[1]) {
              if (!__KNOWN_VERSIONS.has(m[1])) {
                // Manter tamanho limitado: se exceder, remover o mais antigo (iterador)
                if (__KNOWN_VERSIONS.size >= MAX_KNOWN_VERSIONS) {
                  const first = __KNOWN_VERSIONS.values().next().value;
                  __KNOWN_VERSIONS.delete(first);
                }
                __KNOWN_VERSIONS.add(m[1]);
                console.log('[cloudinary] Nova versão aprendida v' + m[1]);
              }
            }
        }
        resolve(ok);
      } finally {
        activeHead--;
        if (headQueue.length) {
          const next = headQueue.shift();
            setTimeout(next, 10);
        }
      }
    };
    if (activeHead < MAX_PARALLEL_HEAD) job(); else headQueue.push(job);
  });
}

async function firstExistingUrl(candidates, fetchImpl) {
  for (const url of candidates) {
    const cached = __cloudCache.get(url);
    if (cached && (Date.now() - cached.ts) < CLOUD_CACHE_TTL_MS) {
      if (cached.ok) return url; else continue;
    }
    const ok = await scheduleHead(url, fetchImpl);
    if (ok) return url;
  }
  return null;
}

// Banco de dados do arquivo
const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');

/**
 * Gera candidatos de URL Cloudinary preservando subpastas e variações de versão.
 * Retorna array de strings (ordem de tentativa). Primeiro item é o "principal".
 */
function buildCloudinaryCandidates(localImagePath) {
  if (!localImagePath) return [];
  const clean = localImagePath.split('?')[0];
  if (/^https?:\/\/res\.cloudinary\.com\//.test(clean)) return [clean];
  // Qualquer coisa que contenha /uploads/ pega só o último nome (filename)
  const uploadsIdx = clean.lastIndexOf('/');
  const filename = uploadsIdx !== -1 ? clean.substring(uploadsIdx + 1) : clean;
  if (!/\.(jpe?g|png|webp|jpg)$/i.test(filename)) return [];

  const cloud = 'dd6ln5xmu';
  const base = `https://res.cloudinary.com/${cloud}/image/upload`;
  const tipos = ['imagens', 'editor'];
  const core = [];
  for (const t of tipos) {
    core.push(`${base}/arquivo/uploads/${t}/${filename}`);
  }
  // Versões conhecidas primeiro (prioridade) depois sem versão
  const withVersions = [];
  if (__KNOWN_VERSIONS.size) {
    for (const ver of __KNOWN_VERSIONS) {
      for (const url of core) {
        const idx = url.indexOf('/image/upload/');
        const prefix = url.substring(0, idx + '/image/upload'.length);
        const rest = url.substring(idx + '/image/upload'.length);
        withVersions.push(prefix + `/v${ver}` + rest);
      }
    }
  }
  const all = [...withVersions, ...core];
  return [...new Set(all)];
}

function getPrimaryCloudinaryUrl(localImagePath) {
  const list = buildCloudinaryCandidates(localImagePath);
  return list[0] || null;
}

// Versão assíncrona com verificação real (usada em endpoints de detalhe)
async function resolveCloudinaryUrl(localImagePath, fetchImpl) {
  const list = buildCloudinaryCandidates(localImagePath);
  if (!list.length) return null;
  // Tenta achar a primeira realmente existente
  try { return await firstExistingUrl(list, fetchImpl); } catch(_) { return list[0]; }
}

// Rota de debug para inspecionar construção de URLs
arquivoRouter.get('/debug/urls', (req, res) => {
  db.all(`SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != '' LIMIT 25`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const mapped = rows.map(r => {
      const candidatos = buildCloudinaryCandidates(r.imagem);
      return {
        id: r.id,
        original: r.imagem,
        candidato_principal: candidatos[0] || null,
        outros: candidatos.slice(1)
      };
    });
    res.json({ total: mapped.length, exemplos: mapped });
  });
});

// Rota de diagnóstico: ver estado atual do banco
arquivoRouter.get('/admin/diagnostic', (req, res) => {
  db.all(`SELECT id, imagem FROM noticias LIMIT 10`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const samples = rows.map(r => ({
      id: r.id,
      imagem_original: r.imagem,
      tem_https: r.imagem ? r.imagem.startsWith('https://') : false,
      filename: r.imagem ? r.imagem.split('/').pop() : null
    }));
    
    db.get(`SELECT COUNT(*) as total, 
            COUNT(CASE WHEN imagem LIKE 'https://%' THEN 1 END) as com_https,
            COUNT(CASE WHEN imagem NOT LIKE 'https://%' AND imagem IS NOT NULL AND imagem != '' THEN 1 END) as sem_https
            FROM noticias`, (err, stats) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        estatisticas: stats,
        amostras: samples
      });
    });
  });
});

// Rota administrativa: sincronizar URLs Cloudinary usando verificação HEAD
arquivoRouter.get('/admin/sync', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50; // Reduzir para evitar timeout
    
    // Buscar TODAS notícias (ignorar se já tem https, pois podem ser placeholders)
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, imagem FROM noticias 
         WHERE imagem IS NOT NULL AND imagem != '' 
         ORDER BY id ASC
         LIMIT ?`,
        [limit],
        (err, r) => err ? reject(err) : resolve(r)
      );
    });
    
    let updated = 0;
    let skipped = 0;
    const samples = [];
    
    // Helper simples de HEAD check
    async function testUrl(url) {
      try {
        const https = require('https');
        return await new Promise((resolve) => {
          const parsed = new URL(url);
          const req = https.request({
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'HEAD',
            timeout: 2000
          }, (res) => resolve(res.statusCode === 200));
          req.on('error', () => resolve(false));
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.end();
        });
      } catch (e) {
        return false;
      }
    }
    
    // Processar cada notícia
    for (const row of rows) {
      const candidatos = buildCloudinaryCandidates(row.imagem);
      
      let workingUrl = null;
      // Testar até 4 candidatos
      for (const url of candidatos.slice(0, 4)) {
        if (await testUrl(url)) {
          workingUrl = url;
          break;
        }
      }
      
      if (workingUrl && workingUrl !== row.imagem) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE noticias SET imagem = ? WHERE id = ?`,
            [workingUrl, row.id],
            (err) => err ? reject(err) : resolve()
          );
        });
        updated++;
        if (samples.length < 3) {
          samples.push({ id: row.id, url: workingUrl.substring(0, 80) + '...' });
        }
      } else {
        skipped++;
      }
    }
    
    res.json({
      success: true,
      processadas: rows.length,
      atualizadas: updated,
      ignoradas: skipped,
      amostras: samples,
      proxima: `Executar novamente para processar mais ${limit} registros`
    });
    
  } catch (error) {
    console.error('[arquivo/admin/sync] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota admin: sincroniza URLs de imagens com Cloudinary
arquivoRouter.get('/admin/sync-cloudinary', async (req, res) => {
  const cloudinary = require('cloudinary').v2;
  const https = require('https');
  
  function headCheck(url) {
    return new Promise((resolve) => {
      const parsed = new URL(url);
      https.request({
        hostname: parsed.hostname,
        path: parsed.pathname,
        method: 'HEAD',
        timeout: 3000
      }, (r) => resolve(r.statusCode === 200))
        .on('error', () => resolve(false))
        .on('timeout', function() { this.destroy(); resolve(false); })
        .end();
    });
  }
  
  async function findWorkingUrl(originalPath) {
    const filename = originalPath.split('/').pop();
    if (!/\.(jpe?g|png|webp|jpg)$/i.test(filename)) return null;
    
    const base = 'https://res.cloudinary.com/dd6ln5xmu/image/upload';
    const tipos = ['imagens', 'editor'];
    
    for (const ver of __KNOWN_VERSIONS) {
      for (const tipo of tipos) {
        const url = `${base}/v${ver}/arquivo/uploads/${tipo}/${filename}`;
        if (await headCheck(url)) return url;
      }
    }
    
    for (const tipo of tipos) {
      const url = `${base}/arquivo/uploads/${tipo}/${filename}`;
      if (await headCheck(url)) return url;
    }
    
    return null;
  }
  
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, imagem FROM noticias WHERE imagem IS NOT NULL AND imagem != '' AND imagem NOT LIKE 'https://%' LIMIT 100`,
        (err, r) => err ? reject(err) : resolve(r)
      );
    });
    
    let updated = 0;
    const results = [];
    
    for (const row of rows) {
      const cloudUrl = await findWorkingUrl(row.imagem);
      if (cloudUrl) {
        await new Promise((resolve, reject) => {
          db.run(`UPDATE noticias SET imagem = ? WHERE id = ?`, [cloudUrl, row.id], 
            (err) => err ? reject(err) : resolve());
        });
        updated++;
        results.push({ id: row.id, status: 'ok', url: cloudUrl });
      } else {
        results.push({ id: row.id, status: 'not_found', original: row.imagem });
      }
    }
    
    res.json({
      success: true,
      processed: rows.length,
      updated,
      results: results.slice(0, 20)
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Verificar se banco existe antes de conectar
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Banco de dados não encontrado:', DB_PATH);
  console.error('❌ Diretório atual:', __dirname);
  console.error('❌ Arquivos na pasta arquivo:', fs.existsSync(path.join(__dirname, 'arquivo')) ? fs.readdirSync(path.join(__dirname, 'arquivo')) : 'Pasta não existe');
} else {
  console.log('✅ Banco de dados encontrado:', DB_PATH);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar banco arquivo:', err.message);
  } else {
    console.log('✅ Banco de dados arquivo conectado com sucesso');
  }
});

// Configurar EJS para o módulo arquivo
const arquivoViewsPath = path.join(__dirname, 'arquivo', 'views');
console.log('📁 Views path:', arquivoViewsPath);

// Rota de teste/debug
arquivoRouter.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Módulo arquivo funcionando!',
    dbPath: DB_PATH,
    dbExists: fs.existsSync(DB_PATH),
    viewsPath: arquivoViewsPath,
    viewsExists: fs.existsSync(arquivoViewsPath)
  });
});

// Middleware para servir arquivos estáticos do módulo arquivo
arquivoRouter.use('/static', express.static(path.join(__dirname, 'arquivo', 'public')));

// Middleware para configurar views path em cada request
arquivoRouter.use((req, res, next) => {
  req.app.set('views', arquivoViewsPath);
  next();
});

// Rota principal - Listagem de notícias
arquivoRouter.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  const busca = req.query.busca || '';

  // Query de busca
  let query = `
    SELECT * FROM noticias 
    WHERE (imagem IS NOT NULL AND imagem != "" AND data_publicacao <= "2025-10-06 09:25:42")
  `;
  let countQuery = `
    SELECT COUNT(*) as total FROM noticias 
    WHERE (imagem IS NOT NULL AND imagem != "" AND data_publicacao <= "2025-10-06 09:25:42")
  `;
  const params = [];

  if (busca) {
    query += ` AND (titulo LIKE ? OR conteudo LIKE ? OR categoria LIKE ?)`;
    countQuery += ` AND (titulo LIKE ? OR conteudo LIKE ? OR categoria LIKE ?)`;
    const searchTerm = `%${busca}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY data_publicacao DESC LIMIT ? OFFSET ?`;

  // Obter estatísticas
  db.get(`
    SELECT 
      COUNT(*) as total_noticias,
      COUNT(DISTINCT autor) as total_autores,
      COUNT(DISTINCT DATE(data_publicacao)) as total_dias,
      MIN(data_publicacao) as data_primeira,
      MAX(data_publicacao) as data_ultima
    FROM noticias 
    WHERE imagem IS NOT NULL AND imagem != "" AND data_publicacao <= "2025-10-06 09:25:42"
  `, [], (err, stats) => {
    if (err) {
      console.error('Erro ao obter estatísticas:', err);
      return res.status(500).send('Erro ao carregar estatísticas');
    }

    // Obter total de notícias para paginação
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        console.error('Erro ao contar notícias:', err);
        return res.status(500).send('Erro ao contar notícias');
      }

      const totalNoticias = countResult.total;
      const totalPages = Math.ceil(totalNoticias / limit);

      // Obter notícias
      db.all(query, [...params, limit, offset], (err, noticias) => {
        if (err) {
          console.error('Erro ao buscar notícias:', err);
          return res.status(500).send('Erro ao buscar notícias');
        }

        // Enriquecer com URL do Cloudinary gerada dinamicamente
        const noticiasComImagem = (noticias || []).map(n => {
          let finalImg = null;
          if (n.imagem && /^\/uploads\//.test(n.imagem)) {
            // Prioriza caminho original (mais provável de existir agora)
            finalImg = n.imagem;
          } else {
            finalImg = getPrimaryCloudinaryUrl(n.imagem);
          }
          return { ...n, imagem_cloudinary: finalImg };
        });

        res.render('index', {
          title: 'Arquivo de Notícias - R10 Piauí',
          noticias: noticiasComImagem,
          stats,
          currentPage: page,
          totalPages,
          totalNoticias,
          filtroBusca: busca
        });
      });
    });
  });
});

// Rota de detalhe - Visualizar notícia individual
arquivoRouter.get('/noticia/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM noticias WHERE id = ?', [id], (err, noticia) => {
    if (err) {
      console.error('Erro ao buscar notícia:', err);
      return res.status(500).send('Erro ao buscar notícia');
    }

    if (!noticia) {
      return res.status(404).render('404');
    }

    // Função util para fetch (node18+) ou fallback dynamic import
    const fetchImpl = global.fetch ? global.fetch.bind(global) : (...args) => import('node-fetch').then(m => m.default(...args));

    const promPrincipal = (async () => {
      if (noticia && noticia.imagem) {
        if (/^\/uploads\//.test(noticia.imagem)) return noticia.imagem; // usar direto
        return await resolveCloudinaryUrl(noticia.imagem, fetchImpl);
      }
      return null;
    })();

    // Buscar notícias relacionadas (mesma categoria)
    db.all(
      `SELECT id, titulo, imagem, data_publicacao 
       FROM noticias 
       WHERE categoria = ? AND id != ? AND imagem IS NOT NULL 
       ORDER BY RANDOM() 
       LIMIT 3`,
      [noticia.categoria, id],
      (err, relacionadas) => {
        if (err) {
          console.error('Erro ao buscar relacionadas:', err);
          relacionadas = [];
        }

        // Resolver URLs Cloudinary de relacionadas em paralelo (máximo 5)
        const fetchRelated = async () => {
          const slice = (relacionadas||[]).slice(0,5);
          const promises = slice.map(r => resolveCloudinaryUrl(r.imagem, fetchImpl).then(url => ({ r, url })));
          const resolved = await Promise.all(promises);
          return resolved.map(x => ({ ...x.r, imagem_cloudinary: x.url }));
        };

        Promise.all([promPrincipal, fetchRelated()]).then(values => {
          const [imgPrincipal, rels] = values;
          if (imgPrincipal) noticia.imagem_cloudinary = imgPrincipal;
          relacionadas = rels;
          res.render('detalhe', {
            title: noticia.titulo + ' - Arquivo R10 Piauí',
            noticia,
            relacionadas: relacionadas || []
          });
        }).catch(() => {
          // fallback simples
          if (noticia && noticia.imagem && !noticia.imagem_cloudinary) {
            noticia.imagem_cloudinary = getPrimaryCloudinaryUrl(noticia.imagem);
          }
          relacionadas = (relacionadas || []).map(r => ({
            ...r,
            imagem_cloudinary: getPrimaryCloudinaryUrl(r.imagem)
          }));
          res.render('detalhe', {
            title: noticia.titulo + ' - Arquivo R10 Piauí',
            noticia,
            relacionadas: relacionadas || []
          });
        });
      }
    );
  });
});

module.exports = arquivoRouter;
