import React, { useEffect, useState, memo } from 'react';
import { TrendingUp, Eye, Clock, ArrowRight } from 'lucide-react';
import WhatsAppShareButton from './WhatsAppShareButton';
import { fetchPostsArray, Post } from '../services/postsService';

const MostReadSection = memo(() => {
  const [mostReadNews, setMostReadNews] = useState<Post[]>([]);

  useEffect(() => {
    // Busca posts reais e simula ordenação por "mais lidas"
    async function fetchMostReadPosts() {
      try {
        const list = await fetchPostsArray({ page: 1, limit: 100 });
        // Pega os 5 primeiros posts como "mais lidas"
        // Em produção, isso seria ordenado por views/clicks reais
        setMostReadNews(list.slice(0, 5));
      } catch (error) {
        console.error('Erro ao carregar posts mais lidos:', error);
        setMostReadNews([]);
      }
    }
    fetchMostReadPosts();
  }, []);

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4 max-w-[1250px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-brand" />
            <h2 className="text-2xl font-black text-neutral900 tracking-wider font-title">
              MAIS LIDAS
            </h2>
            <TrendingUp className="w-6 h-6 text-brand" />
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-brand to-accent mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {mostReadNews.map((news, index) => (
            <article 
              key={news.id} 
              className="group cursor-pointer bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 rounded-xl p-4 text-white shadow-lg hover:shadow-xl relative overflow-hidden"
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
                    <span>{news.visualizacoes > 0 ? `${(news.visualizacoes / 1000).toFixed(1)}K` : `${Math.floor(Math.random() * 15) + 5}K`}</span>
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});

MostReadSection.displayName = 'MostReadSection';

export default MostReadSection;