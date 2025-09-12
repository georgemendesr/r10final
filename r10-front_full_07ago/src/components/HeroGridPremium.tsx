import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WhatsAppShareButton from './WhatsAppShareButton';
import { getPostsByPosition } from '../services/postsService';
import type { Post } from '../types/Post';
import OptimizedImage from './OptimizedImage';

// Função para criar URL amigável
const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const HeroGridPremium = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para mapear categoria para classes CSS - PADRÃO DO SISTEMA
  const getEditorialClasses = (category: string) => {
    const norm = (category || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const categoryMap: { [key: string]: { title: string, bar: string, tint: string, tag: string } } = {
      'POLICIA': { title: 'title-policia', bar: 'bar-policia', tint: 'policia', tag: 'bg-red-100 text-red-700' },
      'POLITICA': { title: 'title-politica', bar: 'bar-politica', tint: 'politica', tag: 'bg-blue-100 text-blue-700' },
      'PIRIPIRI': { title: 'title-politica', bar: 'bar-politica', tint: 'politica', tag: 'bg-blue-100 text-blue-700' },
      'ESPORTE': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte', tag: 'bg-green-100 text-green-700' },
      'ENTRETENIMENTO': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento', tag: 'bg-purple-100 text-purple-700' },
      'GERAL': { title: 'title-geral', bar: 'bar-geral', tint: 'geral', tag: 'bg-gray-100 text-gray-700' }
    };
    return categoryMap[norm] || categoryMap['GERAL'];
  };

  // Getters compatíveis PT/EN
  const getTitle = (p?: any) => (p?.title || p?.titulo || '') as string;
  const getSubtitle = (p?: any) => (p?.subtitle || p?.subtitulo || '') as string;
  const getImage = (p?: any) => (p?.imagemDestaque || p?.imagemUrl || '') as string;
  const getCategory = (p?: any) => (p?.categoria || p?.subcategorias?.[0] || 'geral') as string;
  const getAuthor = (p?: any) => (p?.author || p?.autor || '') as string;

  useEffect(() => {
  const fetchPosts = async () => {
      try {
        console.log('🔄 Buscando posts (Premium)...');
        
        // REGRA: Apenas notícias EXPLICITAMENTE setadas como 'destaque'
        const destaques = await getPostsByPosition('destaque', 5);
        
        console.log('📊 Destaques encontrados (Premium):', {
          total: destaques.length,
          postIds: destaques.map((d: any) => d.id)
        });
        
        setPosts(destaques as any);
      } catch (error) {
        console.error('❌ Erro ao buscar posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Premium não usa supermanchete - todos os posts são elegíveis
  const filteredPosts = posts;
  const featuredPost = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1, 9);

  if (loading) {
    return (
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-300 rounded-2xl"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredPost) {
    return (
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <p className="text-center text-gray-500">Nenhuma matéria encontrada</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[1250px]">
        
        {/* Layout Premium Magazine Style */}
        <div className="space-y-8">
          
          {/* Hero Principal - Destaque Absoluto */}
          <div className="relative">
            <Link 
              to={`/noticia/${getCategory(featuredPost)}/${createSlug(getTitle(featuredPost))}/${featuredPost.id}`}
              className="group block"
            >
              <article className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="relative h-[500px] lg:h-[600px]">
                  <OptimizedImage
                    src={getImage(featuredPost)}
                    alt={getTitle(featuredPost)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlay Profissional */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>
                  
                  {/* Chapéu Editorial Premium (opcional) */}
          {featuredPost.chapeu && (
                    <div className="absolute top-6 left-6">
            <span className="destaque-outros-chapeu text-gray-300 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">{featuredPost.chapeu}</span>
                    </div>
                  )}
                  
                  {/* Conteúdo Principal */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                    <div className="max-w-4xl">
                      <h1 className={`destaque-principal-title mb-4 title-hover-combined large title-hover-shimmer`}>
                        {getTitle(featuredPost)}
                      </h1>
                      {getSubtitle(featuredPost) && (
                        <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed mb-6 font-light">
                          {getSubtitle(featuredPost)}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                {getAuthor(featuredPost).charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                {getAuthor(featuredPost)}
                            </p>
                            <p className="text-gray-300 text-sm">
                              Há 2 horas
                            </p>
                          </div>
                        </div>
                        <WhatsAppShareButton 
              title={getTitle(featuredPost)}
              url={`${window.location.origin}/noticia/${getCategory(featuredPost)}/${createSlug(getTitle(featuredPost))}/${featuredPost.id}`}
                          size="lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>

          {/* Grid Secundário Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {secondaryPosts.slice(0, 4).map((post, index) => (
              <Link 
                key={post.id}
                to={`/noticia/${getCategory(post)}/${createSlug(getTitle(post))}/${post.id}`}
                className="group block"
              >
                <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="relative h-48">
                    <OptimizedImage
                      src={getImage(post)}
                      alt={getTitle(post)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <div className="absolute top-3 left-3">
                      {post.chapeu && (
                        <span className={`destaque-outros-chapeu inline-block px-3 py-1 rounded-full bg-white/80`}>{post.chapeu}</span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className={`destaque-outros-title group-hover:opacity-80 transition-opacity line-clamp-2 title-hover-combined small`}>
                        {getTitle(post)}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                        {getSubtitle(post) && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {getSubtitle(post)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs font-medium">
                        {getAuthor(post)}
                      </span>
                      <WhatsAppShareButton 
                        title={getTitle(post)}
                        url={`${window.location.origin}/noticia/${getCategory(post)}/${createSlug(getTitle(post))}/${post.id}`}
                        size="sm"
                      />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Seção de Trending/Em Alta */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🔥</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">EM ALTA</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {secondaryPosts.slice(4, 8).map((post, index) => (
                <Link 
                  key={post.id}
                  to={`/noticia/${getCategory(post)}/${createSlug(getTitle(post))}/${post.id}`}
                  className="group flex gap-4 hover:bg-gray-50 p-3 rounded-xl transition-colors"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
                    <OptimizedImage
                      src={getImage(post)}
                      alt={getTitle(post)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {post.chapeu && (
                      <span className={`destaque-outros-chapeu inline-block px-2 py-1 rounded mb-1`}>{post.chapeu}</span>
                    )}
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                      {getTitle(post)}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      {getAuthor(post)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroGridPremium;
