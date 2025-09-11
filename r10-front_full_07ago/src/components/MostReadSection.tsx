import React, { useEffect, useState, memo } from 'react';
import { TrendingUp, Eye, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhatsAppShareButton from './WhatsAppShareButton';
import { fetchPostsArray, Post } from '../services/postsService';
import { getHomeSectionTitles } from '../lib/seo';

const MostReadSection = memo(() => {
  const [mostReadNews, setMostReadNews] = useState<Post[]>([]);

  useEffect(() => {
    // Busca posts reais ordenados por views da API
    async function fetchMostReadPosts() {
      try {
        console.log('📈 MostReadSection: Buscando posts mais lidos...');
        const response = await fetch('http://localhost:3002/api/posts/most-read?limit=5');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📈 MostReadSection: Posts mais lidos recebidos:', data.length);
        console.log('📈 MostReadSection: Views dos top 3:', data.slice(0, 3).map((p: any) => ({ titulo: p.titulo.substring(0, 40), views: p.views })));
        
        setMostReadNews(data);
      } catch (error) {
        console.error('❌ Erro ao carregar posts mais lidos:', error);
        // Fallback: buscar posts normais se a rota específica falhar
        try {
          const fallbackResponse = await fetch('http://localhost:3002/api/posts?limit=5');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const posts = Array.isArray(fallbackData) ? fallbackData : fallbackData.items || [];
            setMostReadNews(posts.slice(0, 5));
            console.log('📈 MostReadSection: Usando fallback com posts normais');
          } else {
            setMostReadNews([]);
          }
        } catch (fallbackError) {
          console.error('❌ Erro no fallback também:', fallbackError);
          setMostReadNews([]);
        }
      }
    }
    fetchMostReadPosts();
  }, []);

  return (
    <section className="bg-white py-6">
      <div className="container mx-auto px-4 max-w-[1250px]">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            MAIS LIDAS
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 mx-auto rounded-full shadow-lg"></div>
          <p className="text-gray-600 text-lg mt-4 font-medium">As notícias mais lidas pelos piauienses</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {mostReadNews.map((news, index) => (
            <Link 
              key={news.id}
              to={`/noticia/${news.categoria || 'geral'}/${news.titulo?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}/${news.id}`}
              className="group cursor-pointer bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 rounded-xl p-4 text-white shadow-lg hover:shadow-xl relative overflow-hidden block"
            >
              <div className="relative z-10">
                {/* Número de ranking - MUITO MAIS IMPACTANTE */}
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                  <span className="text-red-800 font-black text-xl drop-shadow-lg">{index + 1}</span>
                </div>
                
                {/* Imagem */}
                <div className="mb-3">
                  <img 
                    src={news.imagemUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=80&fit=crop"}
                    alt={news.titulo}
                    className="w-full h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Título - usando dados reais */}
                <div className="mb-3">
                  <h3 className="text-sm font-bold leading-tight text-white group-hover:text-white/90 transition-colors duration-300 line-clamp-4 min-h-[4rem]">
                    {news.titulo}
                  </h3>
                </div>
                
                {/* Estatísticas e compartilhamento */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/80 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>
                      {news.views > 0 
                        ? news.views >= 1000 
                          ? `${(news.views / 1000).toFixed(1)}K`
                          : news.views.toString()
                        : '0'
                      }
                    </span>
                  </div>
                  
                  <WhatsAppShareButton 
                    title={news.titulo}
                    size="sm"
                    variant="filled"
                    className="flex-shrink-0"
                    category="GERAL"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

MostReadSection.displayName = 'MostReadSection';

export default MostReadSection;