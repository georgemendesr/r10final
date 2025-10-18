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
        const apiUrl = import.meta.env.PROD ? '/api/posts/most-read' : 'http://localhost:3002/api/posts/most-read';
        const response = await fetch(apiUrl);
        
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
    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border-l-4 border-red-500 p-6">
      <div className="flex items-center mb-5">
        <div className="w-2 h-6 bg-red-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gray-800">Mais Lidas</h2>
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
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div key={post.id} className="group">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                
                <div className="flex-1">
                  <div className="flex gap-3">
                    <img 
                      src={post.imagemUrl || '/logo-r10-piaui.png'} 
                      alt={post.titulo || 'Imagem da notícia'}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-r10-piaui.png';
                      }}
                    />
                    
                    <div className="flex-1">
                      <Link 
                        to={`/noticia/${post.categoria || 'geral'}/${post.titulo?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${post.id}`}
                        className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors leading-tight block"
                      >
                        {(post as any).titulo || (post as any).title || 'Título não disponível'}
                      </Link>
                      
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>👁️</span>
                        <span>{((post.visualizacoes || post.views || 0) + 200).toLocaleString('pt-BR')} visualizações</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

MostRead.displayName = 'MostRead';

export default MostRead;
