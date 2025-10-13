const db = require('../config/db');

// Configuração de paginação
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE) || 10;

// Listar notícias com paginação
exports.listarNoticias = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Buscar filtros
  const categoria = req.query.categoria || '';
  const busca = req.query.busca || '';

  // Construir query base
  // Filtrar apenas notícias com imagens disponíveis no backup (até 06/10/2025 09:25)
  // Timestamp: 1759753542 = 06/10/2025 09:25:42
  let whereClause = 'WHERE 1=1 AND imagem IS NOT NULL AND imagem != "" AND data_publicacao <= "2025-10-06 09:25:42"';
  let params = [];

  if (categoria) {
    whereClause += ' AND categoria = ?';
    params.push(categoria);
  }

  if (busca) {
    whereClause += ' AND (titulo LIKE ? OR conteudo LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  // Contar total de notícias
  const countSQL = `SELECT COUNT(*) as total FROM noticias ${whereClause}`;
  
  db.get(countSQL, params, (err, countResult) => {
    if (err) {
      console.error('Erro ao contar notícias:', err.message);
      return res.status(500).render('erro', { 
        mensagem: 'Erro ao buscar notícias',
        erro: err.message 
      });
    }

    const totalNoticias = countResult.total;
    const totalPages = Math.ceil(totalNoticias / ITEMS_PER_PAGE);

    // Buscar estatísticas do arquivo
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
        console.error('Erro ao buscar estatísticas:', err.message);
      }

      // Buscar notícias da página atual
      const selectSQL = `
        SELECT id, titulo, conteudo, imagem, data_publicacao, autor, categoria, views
        FROM noticias 
        ${whereClause}
        ORDER BY data_publicacao DESC
        LIMIT ? OFFSET ?
      `;

      db.all(selectSQL, [...params, ITEMS_PER_PAGE, offset], (err, noticias) => {
        if (err) {
          console.error('Erro ao buscar notícias:', err.message);
          return res.status(500).render('erro', { 
            mensagem: 'Erro ao buscar notícias',
            erro: err.message 
          });
        }

        res.render('index', {
          title: 'Arquivo de Notícias - R10 Piauí',
          noticias: noticias,
          currentPage: page,
          totalPages: totalPages,
          totalNoticias: totalNoticias,
          stats: stats || {},
          filtroBusca: busca
        });
      });
    });
  });
};

// Visualizar notícia individual
exports.verNoticia = (req, res) => {
  const id = req.params.id;

  // Incrementar visualizações
  db.run('UPDATE noticias SET views = views + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Erro ao atualizar views:', err.message);
    }
  });

  // Buscar notícia
  const selectSQL = `
    SELECT id, titulo, conteudo, imagem, data_publicacao, autor, categoria, views
    FROM noticias 
    WHERE id = ?
  `;

  db.get(selectSQL, [id], (err, noticia) => {
    if (err) {
      console.error('Erro ao buscar notícia:', err.message);
      return res.status(500).render('erro', { 
        mensagem: 'Erro ao buscar notícia',
        erro: err.message 
      });
    }

    if (!noticia) {
      return res.status(404).render('404', { 
        title: '404 - Notícia não encontrada',
        mensagem: 'A notícia que você procura não existe ou foi removida.'
      });
    }

    // Buscar notícias relacionadas (mesma categoria)
    const relatedSQL = `
      SELECT id, titulo, imagem, data_publicacao
      FROM noticias 
      WHERE categoria = ? AND id != ?
      ORDER BY RANDOM()
      LIMIT 4
    `;

    db.all(relatedSQL, [noticia.categoria, id], (err, relacionadas) => {
      res.render('detalhe', {
        title: noticia.titulo + ' - Arquivo R10 Piauí',
        noticia: noticia,
        relacionadas: relacionadas || []
      });
    });
  });
};

// API: Buscar notícias (para uso futuro)
exports.apiListarNoticias = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const selectSQL = `
    SELECT id, titulo, conteudo, imagem, data_publicacao, autor, categoria, views
    FROM noticias 
    ORDER BY data_publicacao DESC
    LIMIT ? OFFSET ?
  `;

  db.all(selectSQL, [limit, offset], (err, noticias) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }

    res.json({
      success: true,
      data: noticias,
      limit: limit,
      offset: offset
    });
  });
};
