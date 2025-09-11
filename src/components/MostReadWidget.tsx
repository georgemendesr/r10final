import React, { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../services/postsService';

const MostReadWidget: React.FC = memo(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Busca assíncrona dos posts mais lidos via API específica
    async function fetchMostReadPosts() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔥 MostReadWidget: Buscando posts mais lidos...');
        const response = await fetch('http://localhost:3002/api/posts/most-read?limit=5');
        
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
        console.error('❌ Erro MostReadWidget:', e);
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMostReadPosts();
  }, []);

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border-l-4 border-red-500 p-6 mb-6">
      <div className="flex items-center mb-5">
        <div className="w-2 h-6 bg-red-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gray-800">Mais Lidas</h2>
        <span className="ml-2 text-red-500">🔥</span>
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-500 mt-2 text-sm">Carregando...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">Erro ao carregar: {error}</p>
        </div>
      )}
      
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Nenhuma notícia encontrada</p>
        </div>
      )}
      
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id} className="group hover:bg-white hover:shadow-md rounded-lg p-3 transition-all duration-200">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-7 h-7 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                {/* Miniatura da notícia */}
                <div className="flex-shrink-0">
                  <Link to={`/noticia/${post.categoria || 'geral'}/${post.titulo?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${post.id}`}>
                    <img 
                      src={post.imagemUrl || '/logo-r10-piaui.png'} 
                      alt={post.titulo || 'Imagem da notícia'}
                      className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-r10-piaui.png';
                      }}
                    />
                  </Link>
                </div>
                <div className="flex-1">
                  <Link 
                    to={`/noticia/${post.categoria || 'geral'}/${post.titulo?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${post.id}`}
                    className="text-gray-700 font-medium leading-tight hover:text-red-600 transition-colors duration-200 group-hover:text-red-600 block"
                  >
                    {(post as any).titulo || (post as any).title || 'Título não disponível'}
                  </Link>
                  {post.views && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span className="mr-1">👁️</span>
                      <span>{post.views} visualizações</span>
                    </div>
                  )}
                  {post.categoria && (
                    <div className="mt-1">
                      <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        {post.categoria}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

MostReadWidget.displayName = 'MostReadWidget';

export default MostReadWidget;