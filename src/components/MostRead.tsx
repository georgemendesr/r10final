import React, { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../services/postsService';

const MostRead: React.FC = memo(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Busca assíncrona dos posts mais lidos via API específica
    async function fetchMostReadPosts() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔥 MostRead: Buscando posts mais lidos...');
        const response = await fetch('http://localhost:3002/api/posts/most-read');
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Posts mais lidos recebidos:', data);
        
        // A API retorna os posts diretamente, não em um objeto com success
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data.slice(0, 5));
        } else {
          console.warn('⚠️ Resposta da API não contém posts válidos:', data);
          setPosts([]);
        }
      } catch (e) {
        console.error('❌ Erro MostRead:', e);
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMostReadPosts();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm">
            <span className="text-white text-lg">🔥</span>
          </div>
          <h2 className="text-lg font-bold text-white">Mais Lidas</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-500 mt-3 text-sm">Carregando notícias...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">📰</span>
            </div>
            <p className="text-gray-500 text-sm">Nenhuma notícia encontrada</p>
          </div>
        )}
        
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <article 
                key={post.id} 
                className="group pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <Link 
                  to={`/noticia/${(post as any).categoria || 'geral'}/${((post as any).titulo || (post as any).title || 'noticia')?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${post.id}`}
                  className="flex gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  {/* Número do ranking */}
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Imagem */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={(post as any).imagemUrl || (post as any).image || '/logo-r10-piaui.png'} 
                        alt={(post as any).titulo || (post as any).title || 'Imagem da notícia'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-r10-piaui.png';
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors leading-snug line-clamp-3 mb-1">
                      {(post as any).titulo || (post as any).title || 'Título não disponível'}
                    </h3>
                    
                    {/* Categoria e Views */}
                    <div className="flex items-center gap-3 mt-2">
                      {((post as any).categoria) && (
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                          {(post as any).categoria}
                        </span>
                      )}
                      
                      {((post as any).views || (post as any).visualizacoes) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <span>👁️</span>
                          <span className="font-medium">{(post as any).views || (post as any).visualizacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

MostRead.displayName = 'MostRead';

export default MostRead;
