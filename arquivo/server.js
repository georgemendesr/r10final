require('dotenv').config();
const express = require('express');
const path = require('path');
const noticiasRoutes = require('./routes/noticiasRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

// Configurar EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir pastas de uploads de imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para parsing de body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/', noticiasRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).render('404', { 
    title: '404 - Página não encontrada',
    mensagem: 'A página que você procura não existe.'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   📰 Arquivo de Notícias R10 Piauí                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📁 Banco de dados: ${process.env.DB_PATH || './arquivo.db'}`);
  console.log('\n💡 Pressione Ctrl+C para parar o servidor\n');
});
