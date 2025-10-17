// Serviço para integração com YouTube Data API v3
// Busca dados REAIS do canal R10 Piauí

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || '@r10piaui';
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Busca estatísticas reais do canal do YouTube
 */
async function getChannelStats() {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] API Key não configurada. Retornando dados de fallback.');
    return getFallbackStats();
  }

  try {
    // Se CHANNEL_ID é um handle (@r10piaui), precisamos buscar o ID real primeiro
    let channelId = CHANNEL_ID;
    
    if (CHANNEL_ID.startsWith('@')) {
      const handleResponse = await fetch(
        `${API_BASE_URL}/search?part=snippet&q=${CHANNEL_ID}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      
      if (handleResponse.ok) {
        const handleData = await handleResponse.json();
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].snippet.channelId;
        }
      }
    }

    // Buscar estatísticas do canal
    const response = await fetch(
      `${API_BASE_URL}/channels?part=statistics,snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      console.error('[YouTube] Erro na API:', response.status, response.statusText);
      return getFallbackStats();
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn('[YouTube] Canal não encontrado. Usando fallback.');
      return getFallbackStats();
    }

    const stats = data.items[0].statistics;
    const snippet = data.items[0].snippet;

    console.log('[YouTube] ✅ Estatísticas reais carregadas:', {
      subscribers: stats.subscriberCount,
      views: stats.viewCount,
      videos: stats.videoCount
    });

    return {
      totalVideos: parseInt(stats.videoCount),
      totalViews: formatNumber(stats.viewCount),
      totalSubscribers: formatNumber(stats.subscriberCount),
      averageViews: Math.round(parseInt(stats.viewCount) / parseInt(stats.videoCount)),
      channelTitle: snippet.title,
      channelDescription: snippet.description,
      channelThumbnail: snippet.thumbnails.high.url,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('[YouTube] Erro ao buscar estatísticas:', error.message);
    return getFallbackStats();
  }
}

/**
 * Busca vídeos recentes do canal
 */
async function getRecentVideos(maxResults = 8) {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube] API Key não configurada. Retornando dados de fallback.');
    return getFallbackVideos();
  }

  try {
    // Se CHANNEL_ID é um handle (@r10piaui), precisamos buscar o ID real primeiro
    let channelId = CHANNEL_ID;
    
    if (CHANNEL_ID.startsWith('@')) {
      const handleResponse = await fetch(
        `${API_BASE_URL}/search?part=snippet&q=${CHANNEL_ID}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
      );
      
      if (handleResponse.ok) {
        const handleData = await handleResponse.json();
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].snippet.channelId;
        }
      }
    }

    // Buscar vídeos do canal
    const searchResponse = await fetch(
      `${API_BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );

    if (!searchResponse.ok) {
      console.error('[YouTube] Erro ao buscar vídeos:', searchResponse.status);
      return getFallbackVideos();
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      console.warn('[YouTube] Nenhum vídeo encontrado. Usando fallback.');
      return getFallbackVideos();
    }

    // Buscar detalhes dos vídeos (duração, visualizações)
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `${API_BASE_URL}/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    const detailsData = await detailsResponse.json();

    // Combinar dados
    const videos = detailsData.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.maxresdefault?.url || video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      viewCount: formatNumber(video.statistics.viewCount),
      likeCount: formatNumber(video.statistics.likeCount || '0'),
      commentCount: formatNumber(video.statistics.commentCount || '0'),
      duration: formatDuration(video.contentDetails.duration),
      url: `https://www.youtube.com/watch?v=${video.id}`,
      description: video.snippet.description.substring(0, 200)
    }));

    console.log(`[YouTube] ✅ ${videos.length} vídeos carregados`);
    return videos;
  } catch (error) {
    console.error('[YouTube] Erro ao buscar vídeos:', error.message);
    return getFallbackVideos();
  }
}

/**
 * Formata números para exibição (1234567 -> 1.2M)
 */
function formatNumber(numStr) {
  const num = parseInt(numStr);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
}

/**
 * Formata duração do YouTube (PT4M13S -> 4:13)
 */
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1]?.replace('H', '') || '0');
  const minutes = parseInt(match[2]?.replace('M', '') || '0');
  const seconds = parseInt(match[3]?.replace('S', '') || '0');
  
  return hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Dados de fallback quando API não está configurada
 */
function getFallbackStats() {
  return {
    totalVideos: 245,
    totalViews: '1.2M',
    totalSubscribers: '12.5K',
    averageViews: 4800,
    channelTitle: 'R10 Piauí',
    channelDescription: 'Canal oficial de notícias do R10 Piauí',
    channelThumbnail: '/imagens/logor10play.png',
    lastUpdate: new Date().toISOString(),
    isFallback: true
  };
}

/**
 * Vídeos de fallback
 */
function getFallbackVideos() {
  return [
    {
      id: '2dskbUBoV8A',
      title: 'R10 Piauí - Últimas Notícias',
      thumbnail: 'https://i.ytimg.com/vi/2dskbUBoV8A/maxresdefault.jpg',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      viewCount: '2.1K',
      likeCount: '150',
      commentCount: '45',
      duration: '15:32',
      url: 'https://www.youtube.com/watch?v=2dskbUBoV8A',
      description: 'Confira as principais notícias do Piauí'
    },
    {
      id: 'itpEYTO5abE',
      title: 'R10 Piauí - Política',
      thumbnail: 'https://i.ytimg.com/vi/itpEYTO5abE/maxresdefault.jpg',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: '1.8K',
      likeCount: '120',
      commentCount: '38',
      duration: '12:20',
      url: 'https://www.youtube.com/watch?v=itpEYTO5abE',
      description: 'Cobertura política do Piauí'
    },
    {
      id: 'qKQbJPHiOBw',
      title: 'R10 Piauí - Cultura',
      thumbnail: 'https://i.ytimg.com/vi/qKQbJPHiOBw/maxresdefault.jpg',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: '1.5K',
      likeCount: '95',
      commentCount: '28',
      duration: '08:45',
      url: 'https://www.youtube.com/watch?v=qKQbJPHiOBw',
      description: 'Cultura e eventos no Piauí'
    },
    {
      id: 'BFfW7wCVDW8',
      title: 'R10 Piauí - Esportes',
      thumbnail: 'https://i.ytimg.com/vi/BFfW7wCVDW8/maxresdefault.jpg',
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: '1.2K',
      likeCount: '78',
      commentCount: '22',
      duration: '10:15',
      url: 'https://www.youtube.com/watch?v=BFfW7wCVDW8',
      description: 'Esportes do Piauí'
    }
  ];
}

module.exports = {
  getChannelStats,
  getRecentVideos,
  formatNumber,
  formatDuration
};
