import React, { useEffect, useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import WhatsAppShareButton from './WhatsAppShareButton';
import { getPosts } from '../services/postsService';
import OptimizedImage from './OptimizedImage';

// Função para criar URL amigável com título
const createSlug = (title: string): string => {
  if (!title) return 'noticia';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

const HeroGridVertical = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para mapear categoria para classes CSS
  const getEditorialClasses = (category: string) => {
    const categoryMap: { [key: string]: { title: string, bar: string, tint: string } } = {
      'POLÍCIA': { title: 'title-policia', bar: 'bar-policia', tint: 'policia' },
      'POLÍTICA': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' },
      'PIRIPIRI': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' }, // Piripiri é política
      'ESPORTE': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte' },
      'ENTRETENIMENTO': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento' },
      'EXCLUSIVO': { title: 'title-policia', bar: 'bar-policia', tint: 'policia' }, // Exclusivo usa cor policial
      'INVESTIMENTOS': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' }, // Investimentos usa cor política
      'CAMPEONATO': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte' }, // Campeonato usa cor esporte
      'FESTIVAL': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento' }, // Festival usa cor entretenimento
      'GERAL': { title: 'title-geral', bar: 'bar-geral', tint: 'geral' }
    };
    return categoryMap[category] || categoryMap['GERAL'];
  };

  const getTitle = (p?: any) => (p?.title || p?.titulo || '') as string;
  const getSubtitle = (p?: any) => (p?.subtitle || p?.subtitulo || '') as string;
  const getImage = (p?: any) => (p?.imagemDestaque || p?.imagemUrl || '') as string;
  const getCategory = (p?: any) => (p?.subcategorias?.[0] || p?.categoria || 'geral') as string;

  // Buscar posts do banco de dados
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('🔄 Buscando posts (Vertical)...');
        const result = await getPosts();
        const allPosts = Array.isArray((result as any)?.posts) ? (result as any).posts : [];
        console.log('📊 Posts encontrados (Vertical):', allPosts.length);
        setPosts(allPosts);
      } catch (error) {
        console.error('❌ Erro ao buscar posts (Vertical):', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filtrar e organizar posts - INCLUI supermanchete no Vertical
  const supermanchete = posts.find(post => String(post.posicao || '').toLowerCase() === 'supermanchete');
  const filteredPosts = posts.filter(post => String(post.posicao || '').toLowerCase() !== 'supermanchete');
  const topArticles = filteredPosts.slice(0, 2); // 2 artigos grandes no topo
  const bottomArticles = filteredPosts.slice(2, 5); // 3 artigos menores embaixo

  if (loading) {
    return (
      <section className="bg-gray-50 py-4 md:py-6 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="space-y-6">
            {/* Loading para supermanchete */}
            <div className="animate-pulse">
              <div className="w-full h-[200px] bg-gray-300 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
            {/* Loading para 2 artigos grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-xl mb-3"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            {/* Loading para 3 artigos menores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-32 bg-gray-300 rounded-lg mb-2"></div>
                  <div className="h-5 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section className="bg-gray-50 py-4 md:py-6 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <p className="text-center text-gray-500">Nenhuma matéria encontrada</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-4 md:py-6 font-body">
      <div className="container mx-auto px-4 max-w-[1250px]">
        <div className="space-y-6">
          {/* Supermanchete - se existir */}
          {supermanchete && (
            <Link to={`/noticia/${getCategory(supermanchete)}/${createSlug(getTitle(supermanchete))}/${supermanchete.id}`} className="group block">
              <article>
                <div className={`w-full h-[180px] md:h-[200px] rounded-xl overflow-hidden mb-4 tint ${getEditorialClasses(getCategory(supermanchete)).tint}`}>
                  <img 
                    src={getImage(supermanchete) || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=200&fit=crop"}
                    alt={getTitle(supermanchete)}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '12px' }}
                  />
                </div>
                <div className="flex items-start gap-3">
                  <h1 className={`headline ${getEditorialClasses(getCategory(supermanchete)).title} text-xl md:text-2xl lg:text-3xl leading-tight flex-1 title-hover-combined large title-hover-shimmer`}>
                    {getTitle(supermanchete)}
                  </h1>
                  <WhatsAppShareButton 
                    title={getTitle(supermanchete)}
                    size="md"
                    className="flex-shrink-0 mt-1"
                    category={getCategory(supermanchete)}
                  />
                </div>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed font-rubik mt-2">
                  {getSubtitle(supermanchete)}
                </p>
              </article>
            </Link>
          )}

          {/* 2 Artigos Grandes - Linha Superior */}
          {topArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topArticles.map((article, index) => (
                <Link 
                  key={article.id} 
                  to={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`} 
                  className="group"
                >
                  <article className={`overflow-hidden transition-shadow duration-300`}>
                    <div className={`w-full h-48 md:h-56 rounded-xl overflow-hidden tint ${getEditorialClasses(getCategory(article)).tint}`}>
                      <img 
                        src={getImage(article) || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=250&fit=crop&seed=${index}`}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '12px' }}
                      />
                    </div>
                    <div className="p-4">
                      {article.chapeu
                        ? (<span className="tag mb-2 block text-sm">{article.chapeu}</span>)
                        : (import.meta.env?.DEV ? (<span className="tag mb-2 block text-sm opacity-60">S/CHAPÉU</span>) : null)}
                      <div className="flex items-start gap-2">
                        <h2 className={`headline ${getEditorialClasses(getCategory(article)).title} text-lg md:text-xl lg:text-2xl leading-tight group-hover:opacity-80 transition-opacity flex-1 title-hover-combined medium`}>
                          {getTitle(article)}
                        </h2>
                        <div onClick={(e) => e.stopPropagation()}>
                          <WhatsAppShareButton 
                            title={getTitle(article)}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                            category={getCategory(article)}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {getSubtitle(article)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* 3 Artigos Menores - Linha Inferior */}
          {bottomArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {bottomArticles.map((article, index) => (
                <Link 
                  key={article.id} 
                  to={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`} 
                  className="group"
                >
                  <article className={`overflow-hidden transition-shadow duration-300`}>
                    <div className={`w-full h-32 md:h-36 rounded-lg overflow-hidden tint ${getEditorialClasses(getCategory(article)).tint}`}>
                      <img 
                        src={getImage(article) || `https://images.unsplash.com/photo-1487088678257-3a541e6e3922?w=400&h=150&fit=crop&seed=${index + 10}`}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="p-3">
                      {article.chapeu
                        ? (<span className="tag mb-1 block text-xs">{article.chapeu}</span>)
                        : (import.meta.env?.DEV ? (<span className="tag mb-1 block text-xs opacity-60">S/CHAPÉU</span>) : null)}
                      <div className="flex items-start gap-2">
                        <h2 className={`headline ${getEditorialClasses(getCategory(article)).title} text-sm md:text-base leading-tight group-hover:opacity-80 transition-opacity flex-1 title-hover-combined small`}>
                          {getTitle(article)}
                        </h2>
                        <div onClick={(e) => e.stopPropagation()}>
                          <WhatsAppShareButton 
                            title={getTitle(article)}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                            category={getCategory(article)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {getSubtitle(article)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroGridVertical;
