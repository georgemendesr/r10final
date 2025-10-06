import React, { useEffect, useState } from 'react';
import { HERO_MAIN_IMAGE_HEIGHT_CLASSES } from '../constants/layout';
import { Link } from 'react-router-dom';
import WhatsAppShareButton from './WhatsAppShareButton';
import { getPostsByPosition } from '../services/postsService';
import { getHomeSectionTitles } from '../lib/seo';
import OptimizedImage from './OptimizedImage';
import TitleLink from './TitleLink';

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

type UPost = {
  id: string | number;
  titulo?: string; title?: string;
  subtitulo?: string; subtitle?: string;
  conteudo?: string; content?: string;
  chapeu?: string; categoria?: string; subcategorias?: string[];
  posicao?: string;
  imagemUrl?: string; imagemDestaque?: string;
};

const HeroGrid = () => {
  const [postsData, setPostsData] = useState<{ posts: UPost[]; totalCount: number; totalPages: number }>({ posts: [], totalCount: 0, totalPages: 1 });
  const [mainArticle, setMainArticle] = useState<UPost | null>(null);
  const [sideArticles, setSideArticles] = useState<UPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para mapear categoria para classes CSS
  const getEditorialClasses = (category: string) => {
    const norm = (category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const categoryMap: { [key: string]: { title: string, bar: string, tint: string } } = {
      'POLICIA': { title: 'title-policia', bar: 'bar-policia', tint: 'policia' },
      'POLITICA': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' },
      'PIRIPIRI': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' },
      'ESPORTE': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte' },
      'ENTRETENIMENTO': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento' },
      'EXCLUSIVO': { title: 'title-policia', bar: 'bar-policia', tint: 'policia' },
      'INVESTIMENTOS': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' },
      'CAMPEONATO': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte' },
      'FESTIVAL': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento' },
      'GERAL': { title: 'title-geral', bar: 'bar-geral', tint: 'geral' }
    };
    return categoryMap[norm] || categoryMap['GERAL'];
  };

  // Buscar posts do banco de dados
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('🔄 HeroGrid: Buscando posts...');
        
        // REGRA: Apenas notícias EXPLICITAMENTE setadas como 'destaque'
        const destaques = (await getPostsByPosition('destaque', 5)) as unknown as UPost[];
        
        console.log('📊 HeroGrid: Posts de destaque encontrados:', {
          totalDestaques: destaques.length,
          postIds: destaques.map(d => d.id)
        });

        const mainArticle = destaques[0] || null;
        const sideArticles = destaques.slice(1, 5);

        setPostsData({
          posts: destaques,
          totalCount: destaques.length,
          totalPages: 1
        });
        
        setMainArticle(mainArticle);
        setSideArticles(sideArticles);
      } catch (error) {
        console.error('❌ Erro ao buscar posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    
    // Polling a cada 30 segundos para detectar mudanças
    const interval = setInterval(fetchPosts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Usar os dados já processados
  const posts = postsData.posts;
  
  console.log('🎯 Total posts:', posts.length);
  const getTitle = (p?: UPost) => (p?.title || p?.titulo || '') as string;
  const getSubtitle = (p?: UPost) => {
    if (!p) return '';
    const primary = p.subtitle || p.subtitulo;
    if (primary && primary.trim()) return primary;
    // Fallback: usar resumo se existir dentro do objeto
    const anyResumo: any = (p as any).resumo;
    if (anyResumo && typeof anyResumo === 'string' && anyResumo.trim()) {
      return anyResumo.trim().slice(0, 180);
    }
    // Fallback final: extrair texto puro dos primeiros 160 caracteres do conteúdo
    const raw = (p.conteudo || (p as any).content || '') as string;
    if (raw) {
      const stripped = raw.replace(/<[^>]+>/g, ' ').replace(/&[a-zA-Z]+;/g, ' ').replace(/\s+/g, ' ').trim();
      return stripped.slice(0, 160);
    }
    return '';
  };
  const PLACEHOLDER = '/placeholder.svg';
  const getImage = (p?: UPost) => {
    if (!p) return PLACEHOLDER;
    console.log('🖼️ getImage called for post:', p.id, 'imagemUrl:', (p as any).imagemUrl);
    const chain = [
      (p as any).imagemUrl,
      (p as any).imagemDestaque,
      (p as any).imagem,
      (p as any).imagem_url,
      (p as any).image,
      (p as any).imagem_destaque
    ].filter(Boolean) as string[];
    console.log('📸 Image chain:', chain);
    const first = chain.find(src => typeof src === 'string' && src.trim().length > 6);
    console.log('✅ Selected image:', first || PLACEHOLDER);
    return first || PLACEHOLDER;
  };
  const getCategory = (p?: UPost) => (p?.subcategorias?.[0] || p?.categoria || 'geral') as string;
  console.log('🎯 Main article:', mainArticle ? getTitle(mainArticle) : 'Nenhuma');
  console.log('🎯 Main article:', mainArticle);
  console.log('📰 Side articles:', sideArticles);
  console.log('🔗 URL exemplo:', mainArticle ? `/noticia/${getCategory(mainArticle)}/${createSlug(getTitle(mainArticle))}/${mainArticle.id}` : 'N/A');

  if (loading) {
    return (
      <section className="bg-gray-50 py-3 md:py-4 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 md:gap-6">
            <div className="animate-pulse">
              <div className="w-full h-[400px] bg-gray-300 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-32 bg-gray-300 rounded-lg mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!mainArticle) {
    return (
      <section className="bg-gray-50 py-3 md:py-4 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <p className="text-center text-gray-500">Nenhuma matéria encontrada</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-3 md:py-4 font-body">
      <div className="container mx-auto px-3 md:px-4 max-w-[1250px]">
        {/* Título da Seção SEO */}
        <h2 className="titulo-principal text-gray-900 mb-4 md:mb-6 border-l-4 border-red-600 pl-3 md:pl-4 text-xl md:text-2xl">
          {getHomeSectionTitles().destaque}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 md:gap-6">
          {/* Notícia Principal */}
          <Link to={`/noticia/${getCategory(mainArticle)}/${createSlug(getTitle(mainArticle))}/${mainArticle.id}`} className="group">
            <article>
            <div className={`${HERO_MAIN_IMAGE_HEIGHT_CLASSES} rounded-xl overflow-hidden mb-4 md:mb-5 tint ${getEditorialClasses(getCategory(mainArticle)).tint}`}>
              <img
                src={getImage(mainArticle)}
                alt={getTitle(mainArticle)}
                className="w-full h-full object-cover"
                style={{ borderRadius: '12px' }}
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.dataset._errored) return; // evitar loop
                  el.dataset._errored = '1';
                  el.src = PLACEHOLDER;
                }}
              />
            </div>
                            <div className="flex items-start gap-3 mb-3 md:mb-4">
                              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-title flex-1">
                                <TitleLink
                                  title={getTitle(mainArticle)}
                                  categoria={getCategory(mainArticle)}
                                  href={`/noticia/${getCategory(mainArticle)}/${createSlug(getTitle(mainArticle))}/${mainArticle.id}`}
                                  className="headline font-bold"
                                />
                              </h1>
                              <WhatsAppShareButton 
                                title={getTitle(mainArticle)}
                                size="lg"
                                className="flex-shrink-0 mt-2"
                                category={getCategory(mainArticle)}
                              />
                            </div>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed font-rubik">
              {getSubtitle(mainArticle)}
            </p>
          </article>
            </Link>

          {/* Grid de Notícias Laterais */}
          <div className="space-y-2 md:space-y-3">
            {/* Primeira linha - 2 notícias de cima */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
              {sideArticles[0] && (
                <Link to={`/noticia/${getCategory(sideArticles[0])}/${createSlug(getTitle(sideArticles[0]))}/${sideArticles[0].id}`} className="group">
                  <article className={`overflow-hidden transition-shadow duration-300`}>
                    <div className={`w-full h-32 md:h-36 rounded-xl overflow-hidden tint ${getEditorialClasses(getCategory(sideArticles[0])).tint}`}>
                      <img
                        src={getImage(sideArticles[0])}
                        alt={getTitle(sideArticles[0])}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '12px' }}
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset._errored) return;
                          el.dataset._errored = '1';
                          el.src = PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col h-full">
                      {/* Chapéu - sempre cinza claro, sem underline, sem animação */}
                      {sideArticles[0]?.chapeu
                        ? (<span className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{sideArticles[0].chapeu}</span>)
                        : (import.meta.env?.DEV ? (<span className="text-gray-400 text-xs font-semibold uppercase mb-2 block opacity-60">S/CHAPÉU</span>) : null)}
                      <div className="flex items-start gap-2">
                        <h2 className="text-lg md:text-xl leading-title flex-1">
                          <TitleLink
                            title={getTitle(sideArticles[0])}
                            categoria={getCategory(sideArticles[0])}
                            href={`/noticia/${getCategory(sideArticles[0])}/${createSlug(getTitle(sideArticles[0]))}/${sideArticles[0].id}`}
                            className="headline font-medium"
                          />
                        </h2>
                        <div onClick={(e) => e.stopPropagation()}>
                          <WhatsAppShareButton 
                            title={getTitle(sideArticles[0])}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                            category={getCategory(sideArticles[0])}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {getSubtitle(sideArticles[0])}
                      </p>
                    </div>
                  </article>
                </Link>
              )}

              {sideArticles[1] && (
                <Link to={`/noticia/${getCategory(sideArticles[1])}/${createSlug(getTitle(sideArticles[1]))}/${sideArticles[1].id}`} className="group">
                  <article className={`overflow-hidden transition-shadow duration-300`}>
                    <div className={`w-full h-32 md:h-36 rounded-xl overflow-hidden tint ${getEditorialClasses(getCategory(sideArticles[1])).tint}`}>
                      <img
                        src={getImage(sideArticles[1])}
                        alt={getTitle(sideArticles[1])}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '12px' }}
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset._errored) return;
                          el.dataset._errored = '1';
                          el.src = PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col h-full">
                      {/* Chapéu - sempre cinza claro, sem underline, sem animação */}
                      {sideArticles[1]?.chapeu
                        ? (<span className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{sideArticles[1].chapeu}</span>)
                        : (import.meta.env?.DEV ? (<span className="text-gray-400 text-xs font-semibold uppercase mb-2 block opacity-60">S/CHAPÉU</span>) : null)}
                      <div className="flex items-start gap-2">
                        <h2 className="text-lg md:text-xl leading-title flex-1">
                          <TitleLink
                            title={getTitle(sideArticles[1])}
                            categoria={getCategory(sideArticles[1])}
                            href={`/noticia/${getCategory(sideArticles[1])}/${createSlug(getTitle(sideArticles[1]))}/${sideArticles[1].id}`}
                            className="headline font-medium"
                          />
                        </h2>
                        <div onClick={(e) => e.stopPropagation()}>
                          <WhatsAppShareButton 
                            title={getTitle(sideArticles[1])}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                            category={getCategory(sideArticles[1])}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {getSubtitle(sideArticles[1])}
                      </p>
                    </div>
                  </article>
                </Link>
              )}
            </div>

            {/* Linha divisória horizontal */}
            <div className="my-3 md:my-4">
              <hr className="border-gray-200 border-t-2" />
            </div>

            {/* Segunda linha - 2 notícias de baixo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
              {sideArticles[2] && (
                <Link to={`/noticia/${getCategory(sideArticles[2])}/${createSlug(getTitle(sideArticles[2]))}/${sideArticles[2].id}`} className="group">
                  <article className={`overflow-hidden transition-shadow duration-300`}>
                    <div className={`w-full h-32 md:h-36 rounded-xl overflow-hidden tint ${getEditorialClasses(getCategory(sideArticles[2])).tint}`}>
                      <img
                        src={getImage(sideArticles[2])}
                        alt={getTitle(sideArticles[2])}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '12px' }}
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset._errored) return;
                          el.dataset._errored = '1';
                          el.src = PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col h-full">
                      {/* Chapéu - sempre cinza claro, sem underline, sem animação */}
                      {sideArticles[2]?.chapeu
                        ? (<span className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{sideArticles[2].chapeu}</span>)
                        : (import.meta.env?.DEV ? (<span className="text-gray-400 text-xs font-semibold uppercase mb-2 block opacity-60">S/CHAPÉU</span>) : null)}
                      <div className="flex items-start gap-2">
                        <h2 className="text-lg md:text-xl leading-title flex-1">
                          <TitleLink
                            title={getTitle(sideArticles[2])}
                            categoria={getCategory(sideArticles[2])}
                            href={`/noticia/${getCategory(sideArticles[2])}/${createSlug(getTitle(sideArticles[2]))}/${sideArticles[2].id}`}
                            className="headline font-medium"
                          />
                        </h2>
                        <div onClick={(e) => e.stopPropagation()}>
                          <WhatsAppShareButton 
                            title={getTitle(sideArticles[2])}
                            size="sm"
                            className="flex-shrink-0 mt-0.5"
                            category={getCategory(sideArticles[2])}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {getSubtitle(sideArticles[2])}
                      </p>
                    </div>
                  </article>
                </Link>
              )}

                              {sideArticles[3] && (
                  <Link to={`/noticia/${getCategory(sideArticles[3])}/${createSlug(getTitle(sideArticles[3]))}/${sideArticles[3].id}`} className="group">
                    <article className={`overflow-hidden transition-shadow duration-300`}>
                      <div className={`w-full h-32 md:h-36 rounded-xl overflow-hidden tint ${getEditorialClasses(getCategory(sideArticles[3])).tint}`}>
                        <img
                          src={getImage(sideArticles[3])}
                          alt={getTitle(sideArticles[3])}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: '12px' }}
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (el.dataset._errored) return;
                            el.dataset._errored = '1';
                            el.src = PLACEHOLDER;
                          }}
                        />
                      </div>
                      <div className="p-3 md:p-4 flex flex-col h-full">
                        {sideArticles[3]?.chapeu
                          ? (<span className="text-gray-500 text-xs font-semibold uppercase mb-2 block">{sideArticles[3].chapeu}</span>)
                          : (import.meta.env?.DEV ? (<span className="text-gray-400 text-xs font-semibold uppercase mb-2 block opacity-60">S/CHAPÉU</span>) : null)}
                        <div className="flex items-start gap-2">
                          <h2 className="text-lg md:text-xl leading-title flex-1">
                            <TitleLink
                              title={getTitle(sideArticles[3])}
                              categoria={getCategory(sideArticles[3])}
                              href={`/noticia/${getCategory(sideArticles[3])}/${createSlug(getTitle(sideArticles[3]))}/${sideArticles[3].id}`}
                              className="headline font-medium"
                            />
                          </h2>
                          <div onClick={(e) => e.stopPropagation()}>
                            <WhatsAppShareButton 
                              title={getTitle(sideArticles[3])}
                              size="sm"
                              className="flex-shrink-0 mt-0.5"
                              category={getCategory(sideArticles[3])}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {getSubtitle(sideArticles[3])}
                        </p>
                      </div>
                    </article>
                  </Link>
                )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroGrid;