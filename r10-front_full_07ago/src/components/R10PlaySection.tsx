import React, { useState, useEffect } from 'react';
import { Play, Youtube, Eye, Clock, Calendar, Sparkles, TrendingUp } from 'lucide-react';
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
  
  // Verificar se temos as chaves do YouTube
  const hasYT = import.meta.env.VITE_YT_API_KEY && import.meta.env.VITE_YT_CHANNEL_ID;
  
  // Se não temos as chaves, não renderizar nada
  if (!hasYT) return null;

  useEffect(() => {
    const loadVideos = async () => {
      const hasYT = import.meta.env.VITE_YT_API_KEY && import.meta.env.VITE_YT_CHANNEL_ID;
      if (!hasYT) return;
      
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

  const openVideo = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-6 font-body">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header da Seção compacto */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <img 
              src="/uploads/imagens/logor10play.png" 
              alt="R10 Play" 
              className="h-10 w-auto" 
            />
          </div>
        </div>

        {/* Vídeos em linha única com destaque sutil no primeiro */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="flex-shrink-0 w-60 rounded-lg bg-neutral-800 animate-pulse">
                <div className="bg-neutral-700 h-32 rounded-t-lg"></div>
                <div className="p-3">
                  <div className="bg-neutral-700 h-4 rounded mb-2"></div>
                  <div className="bg-neutral-700 h-3 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {videos.slice(0, 4).map((video, index) => (
              <div 
                key={video.id}
                className={`flex-shrink-0 w-60 cursor-pointer rounded-lg overflow-hidden bg-neutral-800 hover:bg-neutral-700 transition-colors ${
                  index === 0 ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => openVideo(video.url)}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center">
                      <Play className="text-white ml-1 w-5 h-5" />
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                      NOVO
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm font-medium line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">{video.viewCount} • {video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão Ver Mais */}
        <div className="text-center mt-6">
          <a 
            href="/r10-play"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Youtube className="w-4 h-4" />
            Ver Todos os Vídeos
          </a>
        </div>
      </div>
    </section>
  );
};

export default R10PlaySection;