import React, { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Post } from '../services/postsService';

interface RelatedWidgetProps {
  currentPostId?: string;
  category?: string;
}

const RelatedWidget: React.FC<RelatedWidgetProps> = ({ currentPostId, category }) => {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedPosts() {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.PROD ? '/api/posts' : 'http://localhost:3002/api/posts';
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }
        
        const data = await response.json();
        let posts = Array.isArray(data) ? data : [];
        
        // Filtrar posts relacionados
        if (category) {
          posts = posts.filter((p: Post) => p.categoria === category && p.id !== currentPostId);
        } else if (currentPostId) {
          posts = posts.filter((p: Post) => p.id !== currentPostId);
        }
        
        // Pegar os 4 primeiros posts mais recentes
        setRelatedPosts(posts.slice(0, 4));
      } catch (error) {
        console.error('Erro ao carregar posts relacionados:', error);
        setRelatedPosts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRelatedPosts();
  }, [currentPostId, category]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <h3 className="font-bold">RELACIONADAS</h3>
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : relatedPosts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Nenhuma notícia relacionada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {relatedPosts.map((post) => (
              <Link 
                key={post.id}
                to={`/noticia/${post.categoria || 'geral'}/${post.titulo?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${post.id}`}
                className="block hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1 hover:text-blue-600 transition-colors">
                    {post.titulo}
                  </h4>
                  <span className="text-xs text-blue-600 font-semibold uppercase">
                    {post.categoria}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedWidget;