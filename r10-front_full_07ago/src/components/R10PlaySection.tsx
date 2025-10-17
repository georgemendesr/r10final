import React, { useState, useEffect } from 'react';
import { Play, Youtube, Eye, Clock, Calendar, Sparkles, X } from 'lucide-react';
import { fetchRecentVideos, fetchChannelStats, getChannelStats, formatRelativeDate, getVideoCategory } from '../services/youtubeService';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
  url: string;
  description: string;
}

const R10PlaySection = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(getChannelStats());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Carregar vídeos e estatísticas reais do backend

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Carregar vídeos e estatísticas em paralelo
        const [recentVideos, channelStats] = await Promise.all([
          fetchRecentVideos(4), // Apenas 4 vídeos para a seção
          fetchChannelStats()
        ]);
        
        setVideos(recentVideos);
        setStats(channelStats);
        
        console.log('📺 R10 Play Section carregada:', {
          videos: recentVideos.length,
          subscribers: channelStats.totalSubscribers,
          views: channelStats.totalViews
        });
      } catch (error) {
        console.error('Erro ao carregar dados do YouTube:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const openVideo = (video: Video) => {
    console.log('🎬 R10Play: Abrindo vídeo:', video.title);
    console.log('🔗 R10Play: URL:', video.url);
    
    const videoId = getYouTubeVideoId(video.url);
    console.log('📺 R10Play: VideoID extraído:', videoId);
    
    if (!videoId) {
      console.error('❌ R10Play: Falha ao extrair videoId da URL:', video.url);
      alert('Erro: URL do vídeo inválida. Não foi possível extrair o ID do YouTube.');
      return;
    }
    
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    console.log('🔚 R10Play: Fechando modal de vídeo');
    setSelectedVideo(null);
  };

  // Extrair videoId da URL do YouTube
  const getYouTubeVideoId = (url: string) => {
    if (!url) {
      console.warn('⚠️ R10Play: URL vazia fornecida');
      return null;
    }
    
    // Suporta múltiplos formatos de URL do YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,        // youtube.com/watch?v=ID
      /(?:youtu\.be\/)([^?]+)/,                    // youtu.be/ID
      /(?:youtube\.com\/embed\/)([^?]+)/,          // youtube.com/embed/ID
      /(?:youtube\.com\/v\/)([^?]+)/               // youtube.com/v/ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log(`✅ R10Play: VideoId extraído com sucesso: ${match[1]}`);
        return match[1];
      }
    }
    
    console.warn('⚠️ R10Play: Nenhum padrão correspondeu para URL:', url);
    return null;
  };

  return (
    <section className="relative bg-gradient-to-br from-red-950 via-neutral-900 to-neutral-950 py-8 md:py-12 font-body overflow-hidden">
      {/* Efeito de luz de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 max-w-[1250px] relative z-10">
        {/* Header da Seção aprimorado */}
        <div className="text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/imagens/logor10play.png" 
              alt="R10 Play" 
              className="h-12 md:h-14 w-auto drop-shadow-2xl" 
            />
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Conteúdo exclusivo do R10 Piauí
          </p>
        </div>

        {/* Layout Moderno: Vídeo em Destaque + Grid */}
        {loading ? (
          <div className="space-y-6">
            {/* Destaque loading */}
            <div className="rounded-2xl bg-neutral-800/50 backdrop-blur animate-pulse overflow-hidden">
              <div className="bg-neutral-700 aspect-video lg:aspect-[21/9]"></div>
              <div className="p-6 space-y-4">
                <div className="bg-neutral-700 h-6 rounded w-3/4"></div>
                <div className="bg-neutral-700 h-4 rounded w-1/2"></div>
              </div>
            </div>
            {/* Grid loading */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="rounded-xl bg-neutral-800/50 backdrop-blur animate-pulse overflow-hidden">
                  <div className="bg-neutral-700 aspect-video"></div>
                  <div className="p-4 space-y-3">
                    <div className="bg-neutral-700 h-4 rounded"></div>
                    <div className="bg-neutral-700 h-3 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-6">
            {/* VÍDEO EM DESTAQUE - Último/Mais Recente */}
            <div 
              className="group cursor-pointer rounded-2xl overflow-hidden bg-neutral-800/50 backdrop-blur hover:bg-neutral-800 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/50 ring-2 ring-red-500/30 hover:ring-red-500"
              onClick={() => openVideo(videos[0])}
            >
              <div className="relative w-full h-[280px] md:h-[350px] lg:h-[420px] overflow-hidden">
                <img 
                  src={videos[0].thumbnail}
                  alt={videos[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                {/* Badge MAIS RECENTE */}
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-xl animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    MAIS RECENTE
                  </div>
                </div>
                
                {/* Duração */}
                <div className="absolute top-4 right-4 bg-black/80 text-white text-sm px-3 py-1.5 rounded-lg font-semibold">
                  {videos[0].duration}
                </div>
                
                {/* Botão Play Grande */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 rounded-full w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-red-900/80">
                    <Play className="text-white ml-2 w-10 h-10 lg:w-12 lg:h-12 fill-current" />
                  </div>
                </div>
                
                {/* Informações sobre o vídeo (bottom overlay) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <h3 className="text-white text-xl lg:text-3xl font-bold mb-3 leading-tight drop-shadow-lg">
                    {videos[0].title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base text-gray-200">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-red-400" />
                      <span className="font-semibold">{videos[0].viewCount} visualizações</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-red-400" />
                      <span>{formatRelativeDate(videos[0].publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GRID DE VÍDEOS RECENTES (próximos 3) */}
            {videos.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {videos.slice(1, 4).map((video) => (
                  <div 
                    key={video.id}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-neutral-800/50 backdrop-blur hover:bg-neutral-800 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-900/30"
                    onClick={() => openVideo(video)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Overlay gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* Botão play centralizado */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-900/50">
                          <Play className="text-white ml-1 w-6 h-6 fill-current" />
                        </div>
                      </div>
                      
                      {/* Duração no canto inferior direito */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-medium">
                        {video.duration}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-white text-sm md:text-base font-semibold line-clamp-2 group-hover:text-red-500 transition-colors leading-tight">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {video.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRelativeDate(video.publishedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Botão Ver Mais aprimorado */}
        <div className="text-center mt-8 md:mt-10">
          <a 
            href="/r10-play"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 shadow-lg shadow-red-900/50 hover:shadow-xl hover:shadow-red-900/70 hover:scale-105"
          >
            <Youtube className="w-5 h-5" />
            <span>Ver Todos os Vídeos</span>
            <Play className="w-4 h-4 fill-current" />
          </a>
          
          {/* Stats do canal */}
          {stats && (
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-xs md:text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-white">{stats.totalSubscribers}</span>
                <span className="hidden sm:inline">inscritos</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-white">{stats.totalViews}</span>
                <span className="hidden sm:inline">visualizações</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-white">{stats.totalVideos}</span>
                <span className="hidden sm:inline">vídeos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup de Vídeo */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn"
          onClick={closeVideo}
        >
          <div 
            className="relative w-full max-w-5xl bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              onClick={closeVideo}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-black text-white rounded-full transition-all hover:scale-110"
              aria-label="Fechar vídeo"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Player YouTube Embed - Otimizado para performance */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {getYouTubeVideoId(selectedVideo.url) ? (
                <iframe
                  key={selectedVideo.id}
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.url)}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                  <div className="text-center p-6">
                    <Youtube className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-white text-lg mb-2">Erro ao carregar vídeo</p>
                    <p className="text-gray-400 text-sm">URL inválida ou videoId não encontrado</p>
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      Abrir no YouTube
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Informações do Vídeo */}
            <div className="p-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                {selectedVideo.title}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-red-500" />
                  <span>{selectedVideo.viewCount} visualizações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>{formatRelativeDate(selectedVideo.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>{selectedVideo.duration}</span>
                </div>
              </div>
              {selectedVideo.description && (
                <p className="mt-4 text-gray-300 text-sm line-clamp-3">
                  {selectedVideo.description}
                </p>
              )}
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-sm font-semibold"
              >
                <Youtube className="w-4 h-4" />
                Assistir no YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default R10PlaySection;