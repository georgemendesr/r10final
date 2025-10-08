import React, { useState, useEffect } from 'react';
import { Play, Youtube, Eye, Clock, Calendar, TrendingUp, Users, BarChart3, Trash2, Edit3, MoreVertical, Filter, Search } from 'lucide-react';
import { getRecentVideos, getChannelStats, formatRelativeDate, getVideoCategory } from '../services/youtubeService';

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
  totalViews: number;
  totalSubscribers: number;
  averageViews: number;
  topCategory: string;
  growthRate: number;
}

const R10PlayPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<Stats>(getChannelStats());

  useEffect(() => {
    // Carregar dados reais do canal
    const realVideos = getRecentVideos().map(video => ({
      ...video,
      category: getVideoCategory(video.title),
      status: 'active' as const
    }));
    setVideos(realVideos);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const openVideo = (url: string) => {
    window.open(url, '_blank');
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
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 max-w-[1250px] py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/imagens/logor10play.png" 
                  alt="R10 Play - Canal Oficial" 
                  className="h-12 w-auto" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Vídeos</h1>
                <p className="text-gray-600 text-sm">Canal Oficial R10 Piauí</p>
              </div>
            </div>
            <a 
              href="/"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Voltar ao Portal
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-[1250px] py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Vídeos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Visualizações</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Inscritos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubscribers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Crescimento</p>
                <p className="text-2xl font-bold text-green-600">+{stats.growthRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar vídeos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Ordenar vídeos"
            >
              <option value="date">Mais Recentes</option>
              <option value="views">Mais Visualizados</option>
            </select>
          </div>
        </div>

        {/* Lista de Vídeos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedVideos.map((video) => (
            <article 
              key={video.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <img 
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                
                {/* Overlay com Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => openVideo(video.url)}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label={`Reproduzir vídeo: ${video.title}`}
                  >
                    <Play className="w-6 h-6 text-white ml-1" aria-hidden="true" />
                  </button>
                </div>

                {/* Duração */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>

                {/* Menu de Ações */}
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <button 
                      className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                      aria-label="Opções do vídeo"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteVideo(video.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {video.category}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-3">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50">
              Anterior
            </button>
            <button className="px-3 py-2 bg-red-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-gray-500 hover:text-gray-700">2</button>
            <button className="px-3 py-2 text-gray-500 hover:text-gray-700">3</button>
            <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default R10PlayPage; 