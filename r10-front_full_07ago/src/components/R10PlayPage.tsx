import React, { useState, useEffect } from 'react';
import { Play, Youtube, Eye, Clock, Calendar, TrendingUp, Users, BarChart3, Trash2, Edit3, MoreVertical, Filter, Search, Sparkles, X } from 'lucide-react';
import { fetchRecentVideos, fetchChannelStats, getChannelStats, formatRelativeDate, getVideoCategory } from '../services/youtubeService';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
  url: string;
  category: string;
  status: 'active' | 'hidden' | 'deleted';
}

interface Stats {
  totalVideos: number;
  totalViews: string;  // API retorna como string formatada
  totalSubscribers: string;  // API retorna como string formatada
  averageViews: number;
  channelTitle?: string;
  channelDescription?: string;
}

const R10PlayPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<Stats>(getChannelStats());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados REAIS do canal via backend
    const loadData = async () => {
      setLoading(true);
      try {
        const [recentVideos, channelStats] = await Promise.all([
          fetchRecentVideos(12), // Reduzido de 20 para 12 para melhor performance
          fetchChannelStats()
        ]);
        
        const videosWithMeta = recentVideos.map(video => ({
          ...video,
          category: getVideoCategory(video.title),
          status: 'active' as const
        }));
        
        setVideos(videosWithMeta);
        setStats(channelStats as any);
        
        console.log('📺 R10 Play Page carregada:', {
          videos: videosWithMeta.length,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const deleteVideo = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este vídeo?')) {
      setVideos(videos.filter(video => video.id !== id));
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return parseInt(b.viewCount.replace(/[^\d]/g, '')) - parseInt(a.viewCount.replace(/[^\d]/g, ''));
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 font-body">
      {/* Header Moderno */}
      <div className="relative bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 shadow-xl border-b border-red-900/30">
        <div className="absolute inset-0 bg-gradient-radial from-red-900/20 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 max-w-[1250px] py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/imagens/logor10play.png" 
                  alt="R10 Play - Canal Oficial" 
                  className="h-14 w-auto drop-shadow-lg" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">R10 Play</h1>
                  <TrendingUp className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <p className="text-gray-300 text-sm">Conteúdo exclusivo do R10 Piauí</p>
              </div>
            </div>
            <a 
              href="/"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-red-900/50 hover:scale-105"
            >
              Voltar ao Portal
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-[1250px] py-8">
        {/* Estatísticas Modernizadas - SEM Crescimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-6 shadow-lg border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total de Vídeos</p>
                <p className="text-3xl font-bold text-white">{stats.totalVideos}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-6 shadow-lg border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total de Visualizações</p>
                <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-6 shadow-lg border border-red-900/30 hover:border-red-700/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Inscritos</p>
                <p className="text-3xl font-bold text-white">{stats.totalSubscribers}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca Modernos */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-6 shadow-lg border border-red-900/30 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar vídeos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500 transition-all"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Filtrar por categoria"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Notícias">Notícias</option>
              <option value="Política">Política</option>
              <option value="Esporte">Esporte</option>
              <option value="Cultura">Cultura</option>
              <option value="Turismo">Turismo</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Ordenar vídeos"
            >
              <option value="date">Mais Recentes</option>
              <option value="views">Mais Visualizados</option>
            </select>
          </div>
        </div>

        {/* Lista de Vídeos - Grid Moderno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedVideos.map((video, index) => (
            <article 
              key={video.id}
              className="group bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden shadow-lg border border-red-900/30 hover:border-red-700/50 hover:scale-105 hover:shadow-2xl hover:shadow-red-900/30 transition-all duration-300"
            >
              {/* Thumbnail com Efeitos */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Overlay Gradiente no Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => openVideo(video)}
                    className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform hover:bg-red-700"
                    aria-label={`Reproduzir vídeo: ${video.title}`}
                  >
                    <Play className="w-6 h-6 text-white ml-1" aria-hidden="true" />
                  </button>
                </div>

                {/* Badge NOVO no primeiro vídeo */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    NOVO
                  </div>
                )}

                {/* Duração */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded backdrop-blur-sm">
                  {video.duration}
                </div>

                {/* Menu de Ações */}
                <div className="absolute top-2 right-2">
                  <div className="relative group/menu">
                    <button 
                      className="w-8 h-8 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                      aria-label="Opções do vídeo"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 rounded-lg shadow-2xl border border-neutral-700 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-neutral-800 flex items-center gap-2 rounded-t-lg">
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteVideo(video.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-950/50 flex items-center gap-2 rounded-b-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Vídeo */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded border border-red-800/50">
                    {video.category}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-3 group-hover:text-red-400 transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-red-500" />
                    <span>{video.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Paginação Moderna */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2 bg-gradient-to-br from-neutral-900 to-neutral-800 p-2 rounded-xl border border-red-900/30 shadow-lg">
            <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Anterior
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg font-semibold">1</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all">2</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all">3</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all">
              Próximo
            </button>
          </div>
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
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.url)}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
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
                  <span>{formatDate(selectedVideo.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>{selectedVideo.duration}</span>
                </div>
              </div>
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
    </div>
  );
};

export default R10PlayPage; 