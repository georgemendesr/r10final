import React, { useState, useEffect } from 'react';
import AdBanner from './AdBanner';
import WhatsAppShareButton from './WhatsAppShareButton';
import { getPostsByPosition } from '../services/postsService';
import { getHomeSectionTitles } from '../lib/seo';
import TitleLink from './TitleLink';
import type { Post } from '../types/Post';

const NewsGeneralSection = () => {
  const [geralPosts, setGeralPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGeralPosts = async () => {
      try {
        setLoading(true);
        
        // REGRA: Apenas notícias EXPLICITAMENTE setadas como 'geral'
        const geralPosts = await getPostsByPosition('geral', 7);
        
        console.log('📊 NewsGeneral: Posts gerais encontrados:', {
          total: geralPosts.length,
          postIds: geralPosts.map((p: any) => p.id)
        });
        
        setGeralPosts(geralPosts);
      } catch (error) {
        console.error('Erro ao carregar posts da seção geral:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGeralPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-6 md:py-8 bg-white font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando notícias gerais...</p>
          </div>
        </div>
      </section>
    );
  }

  if (geralPosts.length === 0) {
    return (
      <section className="py-6 md:py-8 bg-white font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma notícia geral encontrada.</p>
          </div>
        </div>
      </section>
    );
  }

  const mainNews = geralPosts[0];
  const centerNews = geralPosts.slice(1, 5);
  const rightNews = geralPosts.slice(5, 7);

  return (
    <section className="py-6 md:py-8 bg-white font-body">
      <div className="container mx-auto px-4 max-w-[1250px]">
        {/* Título da Seção SEO */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 border-l-4 border-brand pl-4 font-title">
          {getHomeSectionTitles().geral}
        </h2>

        {/* Super Banner */}
        <div className="w-full flex justify-center mb-6 md:mb-8">
          <AdBanner position="super-banner" />
        </div>

        {/* 3 Equal Columns Grid - Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Main News */}
          <div className="space-y-4">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src={mainNews.imagemUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=320&fit=crop"}
                  alt={mainNews.titulo}
                  className="w-full h-48 md:h-64 lg:h-80 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 md:top-4 left-3 md:left-4">
                  <span className="tag text-xs md:text-sm">
                    {mainNews.chapeu || mainNews.categoria?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="mt-3 md:mt-4">
                <div className="flex items-start gap-2 mb-2 md:mb-3">
                  <TitleLink 
                    title={mainNews.titulo}
                    categoria={mainNews.categoria}
                    postId={mainNews.id}
                    className="geral-principal-title flex-1 text-left"
                  />
                  <WhatsAppShareButton 
                    title={mainNews.titulo}
                    size="md"
                    className="flex-shrink-0 mt-1"
                    category={mainNews.categoria}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Multiple Small News */}
          <div className="space-y-3 md:space-y-4">
            {centerNews.map((news, index) => (
              <div key={news.id || index} className="group cursor-pointer border-b border-gray-50 last:border-b-0 pb-3 last:pb-0">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={news.imagemUrl || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=80&h=60&fit=crop"}
                      alt={news.titulo}
                      className="w-20 md:w-28 h-16 md:h-20 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="geral-outros-chapeu mb-1 block">
                      {news.chapeu || news.categoria?.toUpperCase()}
                    </span>
                    <div className="flex items-start gap-2">
                      <TitleLink 
                        title={news.titulo}
                        categoria={news.categoria}
                        postId={news.id}
                        className="geral-outros-title flex-1 text-left"
                      />
                      <WhatsAppShareButton 
                        title={news.titulo}
                        size="sm"
                        className="flex-shrink-0 mt-0.5"
                        category={news.categoria}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Banner acima das notícias */}
          <div className="space-y-4 md:space-y-6">
            {/* Banner no topo da coluna direita */}
            <div className="w-full">
              <AdBanner position="news-sidebar" />
            </div>
            
            {/* Right News abaixo do banner */}
            <div className="space-y-3 md:space-y-4">
              {rightNews.map((news, index) => (
                <div key={news.id || index} className="group cursor-pointer border-b border-gray-50 last:border-b-0 pb-3 last:pb-0">
                  <div>
                    <span className="geral-outros-chapeu mb-1 block">
                      {news.chapeu || news.categoria?.toUpperCase()}
                    </span>
                    <div className="flex items-start gap-2">
                      <TitleLink 
                        title={news.titulo}
                        categoria={news.categoria}
                        postId={news.id}
                        className="geral-outros-title flex-1 text-left"
                      />
                      <WhatsAppShareButton 
                        title={news.titulo}
                        size="sm"
                        className="flex-shrink-0 mt-0.5"
                        category={news.categoria}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsGeneralSection;