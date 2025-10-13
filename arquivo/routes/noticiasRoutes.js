const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticiasController');

// Rotas de visualização
router.get('/', noticiasController.listarNoticias);
router.get('/noticia/:id', noticiasController.verNoticia);

// Rotas de API (para uso futuro)
router.get('/api/noticias', noticiasController.apiListarNoticias);

module.exports = router;
