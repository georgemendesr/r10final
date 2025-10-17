import React, { useState, useEffect } from 'react';
import { Play, Youtube, Eye, Clock, Calendar, Sparkles, X } from 'lucide-react';
import { fetchRecentVideos, getChannelStats, formatRelativeDate, getVideoCategory } from '../services/youtubeService';

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
  
  // Sempre renderizar a seção: se não houver chaves, o youtubeService usa fallback real

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        const recentVideos = await fetchRecentVideos();
        setVideos(recentVideos);
      } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  // Extrair videoId da URL do YouTube
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
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
            Conteúdo original e exclusivo do R10 Piauí
          </p>
        </div>

        {/* Grid responsivo de vídeos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="rounded-xl bg-neutral-800/50 backdrop-blur animate-pulse overflow-hidden">
                <div className="bg-neutral-700 aspect-video"></div>
                <div className="p-4 space-y-3">
                  <div className="bg-neutral-700 h-4 rounded"></div>
                  <div className="bg-neutral-700 h-3 rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="bg-neutral-700 h-3 rounded w-16"></div>
                    <div className="bg-neutral-700 h-3 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {videos.slice(0, 4).map((video, index) => (
              <div 
                key={video.id}
                className={`group cursor-pointer rounded-xl overflow-hidden bg-neutral-800/50 backdrop-blur hover:bg-neutral-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-900/30 ${
                  index === 0 ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-neutral-900' : ''
                }`}
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
                  
                  {/* Badge NOVO no primeiro vídeo */}
                  {index === 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        NOVO
                      </div>
                    </div>
                  )}
                  
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

            {/* Player YouTube Embed */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.url)}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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