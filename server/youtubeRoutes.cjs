// Rotas para API do YouTube
const express = require('express');
const router = express.Router();
const youtubeService = require('./youtubeService.cjs');

/**
 * GET /api/youtube/stats
 * Retorna estatísticas reais do canal do YouTube
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('[YouTube API] Buscando estatísticas do canal...');
    const stats = await youtubeService.getChannelStats();
    
    res.json({
      success: true,
      data: stats,
      isFallback: stats.isFallback || false
    });
  } catch (error) {
    console.error('[YouTube API] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas do canal'
    });
  }
});

/**
 * GET /api/youtube/videos
 * Retorna vídeos recentes do canal
 */
router.get('/videos', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults) || 8;
    console.log(`[YouTube API] Buscando ${maxResults} vídeos recentes...`);
    
    const videos = await youtubeService.getRecentVideos(maxResults);
    
    res.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('[YouTube API] Erro ao buscar vídeos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar vídeos do canal'
    });
  }
});

/**
 * GET /api/youtube/health
 * Verifica se a API do YouTube está configurada
 */
router.get('/health', (req, res) => {
  const isConfigured = !!process.env.YOUTUBE_API_KEY;
  
  res.json({
    success: true,
    configured: isConfigured,
    channelId: process.env.YOUTUBE_CHANNEL_ID || '@r10piaui',
    message: isConfigured 
      ? 'YouTube API configurada e pronta para uso' 
      : 'YouTube API Key não configurada. Usando dados de fallback.'
  });
});

module.exports = router;
