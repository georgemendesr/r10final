import React, { useEffect, useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import WhatsAppShareButton from './WhatsAppShareButton';
import { getPostsByPosition } from '../services/postsService';
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

const HeroGridMosaico = () => {
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

  // Getters defensivos para compatibilidade PT/EN
  const getTitle = (p?: any) => (p?.title || p?.titulo || '') as string;
  const getSubtitle = (p?: any) => (p?.subtitle || p?.subtitulo || '') as string;
  const getImage = (p?: any) => (p?.imagemDestaque || p?.imagemUrl || '') as string;
  const getCategory = (p?: any) => (p?.subcategorias?.[0] || p?.categoria || 'geral') as string;

  // Buscar posts do banco de dados
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('🔄 Buscando posts (Mosaico)...');
        
        // REGRA: Apenas notícias EXPLICITAMENTE setadas como 'destaque'
  let destaques = await getPostsByPosition('destaque', 5);
        // Queremos idealmente 8 itens no mosaico (1 principal + 7 outros)
        // Se vierem menos que 8 destaques, completar com 'geral' sem duplicar
        const targetTotal = 8;
        if (destaques.length < targetTotal) {
          const faltamTotal = targetTotal - destaques.length;
          const gerais = await getPostsByPosition('geral', Math.max(7, faltamTotal + 3));
          const idsExistentes = new Set(destaques.map(d => d.id));
          const extras = gerais.filter(g => !idsExistentes.has(g.id)).slice(0, faltamTotal);
          destaques = [...destaques, ...extras];
        }
        
        console.log('📊 Destaques encontrados (Mosaico):', {
          total: destaques.length,
          postIds: destaques.map((d: any) => d.id)
        });
        
        setPosts(destaques);
      } catch (error) {
        console.error('❌ Erro ao buscar posts (Mosaico):', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filtrar posts por posição - Mosaico NÃO usa supermanchete
  const filteredPosts = posts.filter(post => String(post.posicao || '').toLowerCase() !== 'supermanchete');
  const mainArticle = filteredPosts[0];
  // Demais artigos (sem cortar aqui para poder usar nos grids lateral/esquerdo/rodapé)
  const otherArticles = filteredPosts.filter(post => post.id !== mainArticle?.id);
  const totalOthers = otherArticles.length;
  const maxRight = 2;
  const rightCount = Math.min(maxRight, totalOthers);
  const leftCount = Math.min(2, Math.max(0, totalOthers - rightCount));
  const bottomCount = 0; // não exibir linha inferior

  const rightArticles = otherArticles.slice(0, rightCount);
  const leftExtras = otherArticles.slice(rightCount, rightCount + leftCount);
  const bottomArticles: any[] = [];

  if (loading) {
    return (
      <section className="bg-gray-50 py-4 md:py-6 font-body">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Loading skeleton em grid mosaico */}
            <div className="lg:col-span-2 animate-pulse">
              <div className="w-full h-[400px] bg-gray-300 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-lg mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
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
        {/* Grid Mosaico: 2/3 principal + 1/3 lateral + linha inferior completa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Notícia Principal - 2/3 da largura */}
          <div className="lg:col-span-2">
            <Link to={`/noticia/${getCategory(mainArticle)}/${createSlug(getTitle(mainArticle))}/${mainArticle.id}`} className="group block">
              <article className={`h-full`}>
                <div className={`w-full h-[250px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden mb-4 md:mb-5 tint ${getEditorialClasses(getCategory(mainArticle)).tint}`}>
                  <img 
                    src={getImage(mainArticle) || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop"}
                    alt={getTitle(mainArticle)}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '12px' }}
                  />
                </div>
                <div className="flex items-start gap-3 mb-3 md:mb-4">
                  <h1 className={`destaque-principal-title flex-1 title-hover-combined large title-hover-shimmer`}>
                    <TitleLink
                      title={getTitle(mainArticle)}
                      categoria={getCategory(mainArticle)}
                      href={`/noticia/${getCategory(mainArticle)}/${createSlug(getTitle(mainArticle))}/${mainArticle.id}`}
                    />
                  </h1>
                  <WhatsAppShareButton 
                    title={getTitle(mainArticle)}
                    size="lg"
                    className="flex-shrink-0 mt-2"
                    category={getCategory(mainArticle)}
                  />
                </div>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed font-body">
                  {getSubtitle(mainArticle)}
                </p>
              </article>
            </Link>

            {/* Extras à esquerda abaixo da principal (2 cards pequenos) */}
            {leftExtras.length > 0 && (
              <div className={`grid grid-cols-1 ${leftExtras.length > 1 ? 'md:grid-cols-2' : ''} gap-4 md:gap-6 mt-4 md:mt-6`}>
                {leftExtras.map((article, index) => (
                  <Link 
                    key={article.id} 
                    to={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`} 
                    className="group"
                  >
                    <article className={`card card-hover`}>
                      <div className={`w-full h-32 md:h-40 tint ${getEditorialClasses(getCategory(article)).tint}`}>
                        <img 
                          src={getImage(article) || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=160&fit=crop&seed=${index + 20}`}
                          alt={getTitle(article)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 md:p-4">
                        {article.chapeu
                          ? (<span className="destaque-outros-chapeu text-gray-500 mb-2 block">{article.chapeu}</span>)
                          : (import.meta.env?.DEV ? (<span className="tag mb-2 block text-sm opacity-60">S/CHAPÉU</span>) : null)}
                        <div className="flex items-start gap-2">
                          <h2 className={`destaque-outros-title headline flex-1 title-hover-combined medium title-area-md clamp-2`}>
                            <TitleLink
                              title={getTitle(article)}
                              categoria={getCategory(article)}
                              href={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`}
                            />
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
                        <p className="text-sm text-gray-600 mt-2 clamp-2">
                          {getSubtitle(article)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {/* Itens adicionais para preencher a coluna esquerda e evitar buracos */}
            {bottomArticles.length > 0 && (
              <div className={`grid grid-cols-1 ${bottomArticles.length > 1 ? 'md:grid-cols-2' : ''} gap-4 md:gap-6 mt-4 md:mt-6`}>
                {bottomArticles.map((article, index) => (
                  <Link 
                    key={article.id} 
                    to={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`} 
                    className="group"
                  >
                    <article className={`card card-hover`}>
                      <div className={`w-full h-32 md:h-40 tint ${getEditorialClasses(getCategory(article)).tint}`}>
                        <img 
                          src={getImage(article) || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=160&fit=crop&seed=${index + 2}`}
                          alt={getTitle(article)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 md:p-4">
                        {article.chapeu
                          ? (<span className="destaque-outros-chapeu text-gray-500 mb-2 block">{article.chapeu}</span>)
                          : (import.meta.env?.DEV ? (<span className="tag mb-2 block text-sm opacity-60">S/CHAPÉU</span>) : null)}
                        <div className="flex items-start gap-2">
                          <h2 className={`destaque-outros-title headline flex-1 title-hover-combined medium title-area-md clamp-2`}>
                            <TitleLink
                              title={getTitle(article)}
                              categoria={getCategory(article)}
                              href={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`}
                            />
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
                        <p className="text-sm text-gray-600 mt-2 clamp-2">
                          {getSubtitle(article)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Lateral Direita - 3 notícias verticais */}
          <div className="space-y-4 md:space-y-6">
            {rightArticles.map((article, index) => (
              <Link 
                key={article.id} 
                to={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`} 
                className="group block"
              >
                <article className={`card card-hover`}>
                  <div
                    className={`w-full ${index === 0 ? 'h-[202px] md:h-[234px] lg:h-[250px]' : 'h-[330px] md:h-[378px]'} tint ${getEditorialClasses(getCategory(article)).tint}`}
                  >
                    <img 
                      src={getImage(article) || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop&seed=${index}`}
                      alt={getTitle(article)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    {article.chapeu
                      ? (<span className="destaque-outros-chapeu text-gray-500 mb-2 block">{article.chapeu}</span>)
                      : (import.meta.env?.DEV ? (<span className="tag mb-2 block text-sm opacity-60">S/CHAPÉU</span>) : null)}
                    <div className="flex items-start gap-2">
                      <h2 className={`destaque-outros-title headline flex-1 title-hover-combined medium title-area-md clamp-2`}>
                        <TitleLink
                          title={getTitle(article)}
                          categoria={getCategory(article)}
                          href={`/noticia/${getCategory(article)}/${createSlug(getTitle(article))}/${article.id}`}
                        />
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
                    <p className="text-sm text-gray-600 mt-2 clamp-2">
                      {getSubtitle(article)}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        {/* Linha inferior removida (integrada à coluna esquerda para evitar buracos) */}
      </div>
    </section>
  );
};

export default HeroGridMosaico;
