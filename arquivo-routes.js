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

// Banco de dados do arquivo
const DB_PATH = path.join(__dirname, 'arquivo', 'arquivo.db');

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

        res.render('index', {
          noticias,
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

        res.render('detalhe', {
          noticia,
          relacionadas: relacionadas || []
        });
      }
    );
  });
});

module.exports = arquivoRouter;
