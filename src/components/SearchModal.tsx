import React, { useState, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { getPosts } from '../services/postsService';
import { Post } from '../services/postsService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingTopics] = useState([
    'Política Piauí',
    'Teresina',
    'Esportes',
    'Policial',
    'Entretenimento'
  ]);

  useEffect(() => {
    if (isOpen) {
      // Carregar buscas recentes do localStorage
      const saved = localStorage.getItem('r10_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSearch = async (term: string) => {
    if (!term.trim()) return;

    setLoading(true);
    setSearchTerm(term);

    try {
      const posts = await getPosts({ searchTerm: term });
      setResults(posts);

      // Salvar busca recente
      const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('r10_recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mt-20 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Buscar no R10 Piauí</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Busca */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Digite o que você procura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                autoFocus
              />
            </div>
          </form>

          {/* Resultados ou Sugestões */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Resultados ({results.length})</h3>
              {results.map((post) => (
                <a
                  key={post.id}
                  href={`/noticia/${post.subcategorias?.[0] || 'geral'}/${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${post.id}`}
                  onClick={onClose}
                  className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                >
                  <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {post.title}
                  </h4>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {post.subtitle}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="uppercase font-medium">{post.categoria}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum resultado encontrado para "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Buscas Recentes */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Buscas Recentes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tópicos em Alta */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Tópicos em Alta
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(topic)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-700 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 