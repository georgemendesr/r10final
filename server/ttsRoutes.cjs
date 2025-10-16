/**
 * Rotas de Text-to-Speech (Azure)
 * Endpoints para gerar áudio de matérias
 */

const express = require('express');
const router = express.Router();
const azureTts = require('./azureTtsService.cjs');
const path = require('path');
const fs = require('fs');

// Middleware de autenticação (assumindo que você já tem)
const authMiddleware = (req, res, next) => {
  // Implementar verificação de token aqui
  // Por enquanto, permitir acesso
  next();
};

/**
 * POST /api/tts/generate
 * Gera áudio para um texto específico
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { text, titulo, postId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    if (!azureTts.isConfigured()) {
      return res.status(503).json({ 
        error: 'Serviço TTS não configurado',
        message: 'Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION no .env'
      });
    }

    // Diretório de saída
    const audioDir = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Nome do arquivo
    const filename = postId 
      ? `post-${postId}-${Date.now()}.mp3`
      : `audio-${Date.now()}.mp3`;
    const outputPath = path.join(audioDir, filename);

    // Gerar áudio
    console.log(`[TTS API] Gerando áudio para texto de ${text.length} caracteres...`);
    const result = await azureTts.generateAudio(text, outputPath, { titulo });

    // Retornar URL relativa
    res.json({
      success: true,
      audioUrl: `/uploads/audio/${filename}`,
      duration: result.duration,
      fileSize: result.fileSize,
      message: 'Áudio gerado com sucesso'
    });

  } catch (error) {
    console.error('[TTS API] Erro ao gerar áudio:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar áudio',
      details: error.message 
    });
  }
});

/**
 * POST /api/tts/generate-post/:id
 * Gera áudio para uma matéria completa (título + subtítulo + conteúdo)
 */
router.post('/generate-post/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!azureTts.isConfigured()) {
      return res.status(503).json({ 
        error: 'Serviço TTS não configurado'
      });
    }

    // Buscar matéria do banco de dados
    // Você precisa adaptar isso para sua implementação de banco
    const db = req.app.locals.db; // Assumindo que o DB está disponível aqui
    
    db.get('SELECT id, titulo, subtitulo, conteudo FROM noticias WHERE id = ?', [id], async (err, post) => {
      if (err) {
        console.error('[TTS API] Erro no banco:', err);
        return res.status(500).json({ error: 'Erro ao buscar matéria' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Matéria não encontrada' });
      }

      try {
        // Gerar áudio
        console.log(`[TTS API] Gerando áudio para matéria ${id}: "${post.titulo}"`);
        const result = await azureTts.generatePostAudio(post);

        // Atualizar banco com URL do áudio
        db.run(
          'UPDATE noticias SET audio_url = ?, audio_duration = ? WHERE id = ?',
          [result.relativeUrl, result.duration, id],
          (updateErr) => {
            if (updateErr) {
              console.error('[TTS API] Erro ao atualizar banco:', updateErr);
            }
          }
        );

        res.json({
          success: true,
          audioUrl: result.relativeUrl,
          duration: result.duration,
          fileSize: result.fileSize,
          message: `Áudio gerado para "${post.titulo}"`
        });

      } catch (genError) {
        console.error('[TTS API] Erro ao gerar áudio:', genError);
        res.status(500).json({ 
          error: 'Erro ao gerar áudio',
          details: genError.message 
        });
      }
    });

  } catch (error) {
    console.error('[TTS API] Erro:', error);
    res.status(500).json({ 
      error: 'Erro ao processar requisição',
      details: error.message 
    });
  }
});

/**
 * GET /api/tts/voices
 * Lista vozes disponíveis em português do Brasil
 */
router.get('/voices', authMiddleware, async (req, res) => {
  try {
    if (!azureTts.isConfigured()) {
      return res.status(503).json({ 
        error: 'Serviço TTS não configurado'
      });
    }

    const voices = await azureTts.listAvailableVoices();
    res.json({
      success: true,
      voices: voices,
      currentVoice: process.env.AZURE_SPEECH_VOICE || 'pt-BR-AntonioNeural'
    });

  } catch (error) {
    console.error('[TTS API] Erro ao listar vozes:', error);
    res.status(500).json({ 
      error: 'Erro ao listar vozes',
      details: error.message 
    });
  }
});

/**
 * GET /api/tts/status
 * Verifica se o serviço TTS está configurado e funcionando
 */
router.get('/status', (req, res) => {
  const configured = azureTts.isConfigured();
  
  res.json({
    configured: configured,
    region: process.env.AZURE_SPEECH_REGION || 'não configurada',
    voice: process.env.AZURE_SPEECH_VOICE || 'pt-BR-AntonioNeural',
    message: configured 
      ? 'Serviço TTS configurado e pronto' 
      : 'Configure AZURE_SPEECH_KEY no .env'
  });
});

/**
 * DELETE /api/tts/audio/:filename
 * Remove um arquivo de áudio gerado
 */
router.delete('/audio/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '../uploads/audio', filename);

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    fs.unlinkSync(audioPath);
    
    res.json({
      success: true,
      message: 'Áudio removido com sucesso'
    });

  } catch (error) {
    console.error('[TTS API] Erro ao remover áudio:', error);
    res.status(500).json({ 
      error: 'Erro ao remover áudio',
      details: error.message 
    });
  }
});

module.exports = router;
