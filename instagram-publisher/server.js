const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API simples para status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'OK',
        service: 'Instagram Publisher',
        timestamp: new Date().toISOString()
    });
});

// Rota para publicar no Instagram (placeholder)
app.post('/api/publish', (req, res) => {
    const { image, caption } = req.body;
    
    // TODO: Implementar lógica de publicação no Instagram
    res.json({
        success: true,
        message: 'Post enviado para fila de publicação',
        data: { image, caption }
    });
});

app.listen(PORT, () => {
    console.log(`📸 Instagram Publisher rodando na porta ${PORT}`);
    console.log(`🏠 Interface: http://127.0.0.1:${PORT}/`);
    console.log(`📍 Status: http://127.0.0.1:${PORT}/api/status`);
});
