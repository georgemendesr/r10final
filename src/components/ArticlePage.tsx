import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { buildArticleMeta } from '../lib/seo';
import { Calendar, User, Share2, Bookmark, Facebook, MessageCircle, Volume2, Twitter } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPostById } from '../services/postsService';
import Header from './Header';
import BreakingBar from './BreakingBar';
import SmartAudioPlayer from './SmartAudioPlayer';
import AdBox from './AdBox';
import MostRead from './MostRead';
// FORÇANDO ATUALIZAÇÃO DO IMPORT
import RelatedWidget from './RelatedWidget';
import NewsletterCTA from './NewsletterCTA';
import ReactionResults from './ReactionResults';
import TitleLink from './TitleLink';
import { getEditoriaTextColor } from '../lib/editorias-colors';
import ReactionVoting from './ReactionVoting';
import Footer from './Footer';
import usePostView from '../hooks/usePostView'; // Importar o hook de views

interface ArticleData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publishDate: string;
  category: string;
  subcategorias: string[];
  image: string;
  content: string[];
  tags: string[];
  readTime: string;
  views: string;
  resumo?: string; // Campo para resumo da IA
  posicao?: string; // Adicionando posição elegível para TTS
}

interface ArticlePageProps {
  articleData?: ArticleData;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ articleData }) => {
  // 1) Hooks SEM condição, sempre na mesma ordem
  const { id, titulo } = useParams<{ id: string; titulo?: string }>();
  const articleRef = useRef<HTMLDivElement>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook para incrementar views quando o artigo é visualizado
  usePostView(id);
  
  // Hook TTS integrado no SmartAudioPlayer

  // Função para calcular tempo de leitura baseado no conteúdo
  const calculateReadTime = (content: string[]): string => {
    const totalWords = content.join(' ').split(' ').filter(word => word.length > 0).length;
    const wordsPerMinute = 200; // Velocidade média de leitura
    const minutes = Math.ceil(totalWords / wordsPerMinute);
    return minutes === 1 ? '1 min' : `${minutes} min`;
  };

  // Função para formatar data em português
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString; // Fallback se não conseguir formatar
    }
  };

  // Função para mapear categoria para classes CSS de cor
  const getEditorialClasses = (category: string) => {
    const categoryMap: { [key: string]: { title: string, bar: string, tint: string } } = {
      'POLÍCIA': { title: 'title-policia', bar: 'bar-policia', tint: 'policia' },
      'POLÍTICA': { title: 'title-politica', bar: 'bar-politica', tint: 'politica' },
      'ESPORTE': { title: 'title-esporte', bar: 'bar-esporte', tint: 'esporte' },
      'ENTRETENIMENTO': { title: 'title-entretenimento', bar: 'bar-entretenimento', tint: 'entretenimento' },
      'GERAL': { title: 'title-geral', bar: 'bar-geral', tint: 'geral' }
    };
    return categoryMap[category] || categoryMap['GERAL'];
  };

  // 2) Efeito de carga SEM if/else fora do hook
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const fetchArticle = async () => {
      if (!id) {
        if (alive) setLoading(false);
        return;
      }

      try {
        const post = await getPostById(id);
        if (alive && post) {
          setArticle({
            id: post.id,
            title: post.titulo,
            subtitle: post.subtitulo || '',
            author: post.autor,
            publishDate: post.publishedAt || post.dataPublicacao,
            category: post.categoria,
            subcategorias: [post.categoria],
            image: post.imagemUrl || '',
            content: post.conteudo ? [post.conteudo] : [],
            tags: [],
            readTime: calculateReadTime(post.conteudo ? [post.conteudo] : []),
            views: post.visualizacoes?.toString() || '0',
            resumo: post.resumo || '', // Campo resumo da IA
            posicao: post.posicao // Adicionando posição elegível para TTS
          });
        }
      } catch (error) {
        if (alive) setError(String(error));
        console.error('Erro ao buscar matéria:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchArticle();
    return () => { alive = false; };
  }, [id]);

  // 3) Efeito para animar destaques quando entrarem na viewport
  useEffect(() => {
    const animateHighlight = (element: HTMLElement) => {
      // Estilo de animação inline para garantir funcionamento
      element.style.position = 'relative';
      element.style.background = 'linear-gradient(90deg, rgb(251, 191, 36), rgb(245, 158, 11)) left center / 0% 100% no-repeat';
      element.style.transition = 'background-size 2s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.color = 'rgb(0, 0, 0)';
      element.style.fontWeight = '600';
      element.style.padding = '2px 4px';
      element.style.borderRadius = '4px';
      element.style.display = 'inline';
      
      // Animar o background-size para 100%
      setTimeout(() => {
        element.style.backgroundSize = '100% 100%';
      }, 100);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Buscar por múltiplos seletores de destaque
          const highlightSelectors = [
            'span[data-highlight="animated"]',
            'span.highlight-animated',
            'span[class*="highlight"]',
            '.highlight-animated'
          ];
          
          highlightSelectors.forEach(selector => {
            const highlights = entry.target.querySelectorAll(selector);
            highlights.forEach((highlight) => {
              const htmlHighlight = highlight as HTMLElement;
              if (!htmlHighlight.hasAttribute('data-animated')) {
                htmlHighlight.setAttribute('data-animated', 'true');
                animateHighlight(htmlHighlight);
              }
            });
          });
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    if (articleRef.current) {
      observer.observe(articleRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Dados padrão caso não sejam fornecidos
  const defaultArticle: ArticleData = {
    id: "1",
    title: "Nova Política de Transporte Público em Teresina Promete Revolucionar Mobilidade Urbana",
    subtitle: "Sistema integrado de ônibus e metrô será implementado em 2024 com investimento de R$ 500 milhões",
    author: "Redação R10 Piauí",
    publishDate: "24 de janeiro de 2025",
    category: "POLÍTICA",
    subcategorias: ["politica"],
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop&crop=center",
    content: [
      "A Prefeitura de Teresina anunciou hoje uma nova política de transporte público que promete revolucionar a mobilidade urbana da capital piauiense. O projeto, que será implementado em 2024, representa um investimento de R$ 500 milhões e deve beneficiar mais de 800 mil usuários diários.",
      "### Principais Mudanças",
      "O novo sistema incluirá:",
      "• Integração completa entre ônibus e metrô",
      "• Aplicativo móvel para planejamento de rotas", 
      "• Cartão único para todos os transportes",
      "• Frota de ônibus elétricos",
      "• Estações modernizadas",
      "### Investimento Estratégico",
      "O prefeito Dr. Kleber Montezuma destacou a importância do projeto:",
      "> \"Este é um investimento histórico para Teresina. Vamos transformar completamente a experiência de transporte público na nossa cidade, tornando-a mais eficiente, sustentável e acessível para todos os cidadãos.\"",
      "### Benefícios Esperados",
      "A nova política deve reduzir o tempo de viagem em até 40%, além de diminuir significativamente a poluição ambiental. O sistema integrado permitirá que os usuários planejem suas rotas com antecedência através de um aplicativo móvel.",
      "### Cronograma de Implementação",
      "• Janeiro 2024: Início das obras de modernização",
      "• Março 2024: Lançamento do aplicativo móvel", 
      "• Junho 2024: Inauguração das primeiras estações",
      "• Dezembro 2024: Sistema totalmente operacional",
      "### Reação da População",
      "A população de Teresina recebeu a notícia com grande expectativa. Muitos moradores já enfrentam diariamente os desafios do transporte público atual e veem no novo sistema uma solução para seus problemas de mobilidade.",
      "### Próximos Passos",
      "A Prefeitura iniciará na próxima semana uma série de audiências públicas para ouvir sugestões da população e ajustar o projeto conforme necessário. O edital de licitação será publicado em fevereiro de 2024.",
      "💡 Informação Importante: Os usuários do transporte público atual não precisarão se preocupar com a transição, pois o cartão atual continuará funcionando até a implementação completa do novo sistema."
    ],
    tags: ["transporte público", "Teresina", "mobilidade urbana", "investimento", "prefeitura"],
    readTime: calculateReadTime([
      "A Prefeitura de Teresina anunciou hoje uma nova política de transporte público que promete revolucionar a mobilidade urbana da capital piauiense. O projeto, que será implementado em 2024, representa um investimento de R$ 500 milhões e deve beneficiar mais de 800 mil usuários diários.",
      "A nova política inclui a criação de um sistema integrado que conectará ônibus, VLT e ciclofaixas, oferecendo aos cidadãos uma experiência de mobilidade mais eficiente e sustentável.",
      "### Próximos Passos",
      "A Prefeitura iniciará na próxima semana uma série de audiências públicas para ouvir sugestões da população e ajustar o projeto conforme necessário. O edital de licitação será publicado em fevereiro de 2024.",
      "💡 Informação Importante: Os usuários do transporte público atual não precisarão se preocupar com a transição, pois o cartão atual continuará funcionando até a implementação completa do novo sistema."
    ]),
    views: "2.5k",
    posicao: "supermanchete" // Adicionando posição elegível para TTS
  };

  // 3) Derivações SEM usar a variável dentro da própria criação
  const baseArticle = article || articleData || defaultArticle;
  const finalArticle = baseArticle;
  
  console.log('📄 ArticlePage - finalArticle:', {
    id: finalArticle.id,
    title: finalArticle.title,
    contentLength: finalArticle.content.length,
    // enabled: enabled, // Removed useTts state
    // ttsLoading: ttsLoading, // Removed useTts state
    // ttsError: ttsError // Removed useTts state
  });

  // 4) Early returns (depois dos hooks, nunca antes)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 max-w-[1250px] py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar matéria</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !finalArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 max-w-[1250px] py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const relatedNews = [
    {
      title: "Ministério da Saúde amplia campanhas de prevenção ao câncer",
      category: "SAÚDE",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=100&fit=crop"
    },
    {
      title: "Número de casos de câncer aumenta 20% no último ano",
      category: "SAÚDE", 
      image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=150&h=100&fit=crop"
    },
    {
      title: "Nova tecnologia promete revolucionar tratamento oncológico",
      category: "TECNOLOGIA",
      image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=150&h=100&fit=crop"
    }
  ];

  console.log('🎨 Renderizando ArticlePage com:', {
    contentLength: finalArticle.content.length,
    // enabled: enabled, // Removed useTts state
    // ttsLoading: ttsLoading // Removed useTts state
  });

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Helmet>
        {(() => {
          const m = buildArticleMeta({ title: finalArticle.title, subtitle: finalArticle.subtitle, imagemDestaque: finalArticle.image });
          return (
            <>
              <title>{m.title}</title>
              <meta name="description" content={m.description} />
              <meta property="og:title" content={m.title} />
              <meta property="og:description" content={m.description} />
              <meta property="og:url" content={m.url} />
              <meta property="og:image" content={m.image} />
              <meta name="twitter:card" content="summary_large_image" />
            </>
          );
        })()}
      </Helmet>
      <Header />
      <BreakingBar />
      
      <article className="bg-white">
                <div className="container mx-auto px-4 max-w-[1250px] py-8">
          {/* Cabeçalho Profissional da Matéria */}
          <header className="article-header mb-12">
            {/* Chapéu Editorial com Destaque */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div 
                  className="editorial-badge px-5 py-3 text-white font-bold text-lg uppercase tracking-wider rounded-none relative overflow-hidden shadow-xl"
                  style={{ 
                    backgroundColor: getEditoriaTextColor(finalArticle.category),
                    transform: 'skew(-8deg)',
                  }}
                >
                  <span className="relative z-10" style={{ transform: 'skew(8deg)', display: 'block' }}>
                    {finalArticle.category === 'editoriais' && finalArticle.subcategorias?.length > 0
                      ? finalArticle.subcategorias[0]
                      : finalArticle.category === 'editoriais'
                      ? 'Geral'
                      : finalArticle.category}
                  </span>
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(45deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)'
                    }}
                  ></div>
                </div>
                
                {/* Linha Editorial */}
                <div className="flex-1 flex items-center gap-2">
                  <div 
                    className="flex-1 h-1 rounded-full shadow-sm"
                    style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                  ></div>
                  <div 
                    className="w-1 h-1 rounded-full opacity-60"
                    style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Título Principal com Hierarquia Clara */}
            <div className="space-y-8">
              <h1 
                className="tracking-tight"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: '48px',
                  lineHeight: '1.1'
                }}
              >
                <span 
                  className="title-gradient bg-gradient-to-r bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${getEditoriaTextColor(finalArticle.category)} 0%, #1f2937 70%, ${getEditoriaTextColor(finalArticle.category)} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {finalArticle.title}
                </span>
              </h1>
              
              {/* Subtítulo com Estilo Profissional */}
              {finalArticle.subtitle && (
                <div className="relative bg-gray-50 rounded-r-lg py-6 pr-6">
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2 rounded-l-lg"
                    style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                  ></div>
                  <div 
                    className="absolute left-2 top-0 bottom-0 w-px opacity-30"
                    style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                  ></div>
                  <p className="text-xl md:text-2xl lg:text-3xl text-gray-700 leading-relaxed font-light pl-8 italic">
                    {finalArticle.subtitle}
                  </p>
                </div>
              )}
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* Share Bar */}
            <div className="col-span-1 hidden lg:block">
              <div className="sticky top-8">
                                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">

                  <div className="space-y-2">
                    <button 
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(finalArticle.title + ' - ' + window.location.href)}`, '_blank')}
                      className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                      title="Compartilhar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(finalArticle.title)}`, '_blank')}
                      className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="Compartilhar no Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(finalArticle.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                      className="w-10 h-10 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center"
                      title="Compartilhar no Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: finalArticle.title,
                            text: finalArticle.subtitle,
                            url: window.location.href
                          });
                        } else {
                          // Fallback para copiar link
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copiado para a área de transferência!');
                        }
                      }}
                      className="w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                      title="Compartilhar"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <button className="w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8">
                {/* Metadados do Artigo - Design Profissional */}
                <div className="meta-card rounded-lg p-8 mb-10 border-l-4 shadow-sm" style={{ borderLeftColor: getEditoriaTextColor(finalArticle.category) }}>
                  <div className="flex flex-wrap items-center gap-6 text-gray-600">
                    {/* Autor com Avatar Placeholder */}
                    <div className="flex items-center gap-4">
                      <div 
                        className="author-avatar w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md"
                        style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                      >
                        {finalArticle.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-4 h-4" />
                          <span>Por</span>
                        </div>
                        <strong className="text-gray-900 font-semibold">{finalArticle.author}</strong>
                      </div>
                    </div>
                    
                    {/* Data de Publicação */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" style={{ color: getEditoriaTextColor(finalArticle.category) }} />
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Publicado em</div>
                        <div className="font-medium text-gray-900">{formatDate(finalArticle.publishDate)}</div>
                      </div>
                    </div>
                    
                    {/* Tempo de Leitura */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                      >
                        <span className="text-white text-xs">📖</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Leitura</div>
                        <div className="font-medium text-gray-900">{calculateReadTime(finalArticle.content)}</div>
                      </div>
                    </div>
                    
                    {/* Views se disponível */}
                    {finalArticle.views && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                        >
                          <span className="text-white text-xs">👁️</span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Visualizações</div>
                          <div className="font-medium text-gray-900">{finalArticle.views}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags se existirem */}
                  {finalArticle.tags && finalArticle.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Tags:</span>
                        {finalArticle.tags.slice(0, 5).map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 text-xs font-medium text-white rounded-full"
                            style={{ backgroundColor: getEditoriaTextColor(finalArticle.category) }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              {/* Smart Audio Player - ElevenLabs para posições elegíveis */}
              <SmartAudioPlayer 
                post={{
                  id: finalArticle.id,
                  posicao: finalArticle.posicao,
                  title: finalArticle.title,
                  subtitle: finalArticle.subtitle
                }}
                content={finalArticle.content.join('\n\n')} 
              />

              {/* Componente de Reações Compacto - Resultados apenas */}
              <div className="mb-6">
                <ReactionResults articleId={finalArticle.id} />
              </div>

              {/* Article Image */}
              <figure className="mb-8">
                <img 
                  src={finalArticle.image} 
                  alt={finalArticle.title}
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                />
              </figure>

              {/* Resumo em Tópicos - Exibe se houver resumo gerado */}
              {finalArticle.resumo && (
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">📋</span>
                    Resumo da Notícia
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      // Primeiro, tentar usar os bullets já formatados do resumo
                      let bulletPoints = finalArticle.resumo.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0 && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')));
                      
                      // Se não encontrou bullets formatados, dividir por quebras de linha simples
                      if (bulletPoints.length === 0) {
                        bulletPoints = finalArticle.resumo.split('\n')
                          .map(line => line.trim())
                          .filter(line => line.length > 10);
                      }
                      
                      // Se ainda não tem bullets, dividir por pontos finais
                      if (bulletPoints.length === 0) {
                        bulletPoints = finalArticle.resumo.split(/[.!?]+/)
                          .map(sentence => sentence.trim())
                          .filter(sentence => sentence.length > 10);
                      }
                      
                      // Garantir máximo de 5 bullets para melhor visualização
                      bulletPoints = bulletPoints.slice(0, 5);
                      
                      return bulletPoints.map((point, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-blue-600 font-bold mr-3 mt-0.5 text-lg">•</span>
                          <span className="text-gray-800 leading-relaxed">{point.replace(/^[•\-\*]\s*/, '').trim()}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}



              {/* Article Content */}
              <div ref={articleRef} className="prose prose-lg max-w-none font-poppins">
                {finalArticle.content.map((paragraph, index) => {
                  // Se o conteúdo contém HTML (detectar por tags), processar elementos HTML específicos
                  if (paragraph.includes('<') && paragraph.includes('>')) {
                    // Processar conteúdo HTML preservando a estrutura correta
                    return (
                      <div key={index} 
                           className="text-gray-800 leading-relaxed mb-6 text-base font-normal"
                           dangerouslySetInnerHTML={{ __html: paragraph }}
                           style={{
                             lineHeight: '1.8',
                             fontSize: '16px',
                             fontFamily: 'Poppins, sans-serif'
                           }}
                      />
                    );
                  }
                  
                  // Renderizar diferentes tipos de conteúdo estruturado
                  if (paragraph.startsWith('### ')) {
                    // Subtítulo H3
                                        return (
                      <h3 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4 font-poppins">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  } else if (paragraph.startsWith('> ')) {
                    // Citação
                    return (
                      <blockquote key={index} className="border-l-4 border-blue-500 pl-6 py-4 my-6 bg-blue-50 rounded-r-lg">
                                                 <p className="text-base italic text-gray-800">
                          "{paragraph.replace('> ', '')}"
                        </p>
                        <cite className="text-sm text-gray-600 mt-2 block">
                          — Dr. Kleber Montezuma, Prefeito de Teresina
                        </cite>
                      </blockquote>
                    );
                  } else if (paragraph.startsWith('• ')) {
                    // Lista
                    return (
                      <div key={index} className="flex items-start mb-3">
                        <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                                                 <span className="text-gray-800 text-base">{paragraph.replace('• ', '')}</span>
                      </div>
                    );
                                     } else if (paragraph.includes('==') && paragraph.includes('==')) {
                     // Destaque simples
                     const highlightedText = paragraph.replace(/==(.*?)==/g, '<span class="bg-yellow-200 px-1 rounded">$1</span>');
                     return (
                       <p key={index} className="text-gray-800 leading-relaxed mb-6 text-base font-normal" 
                          dangerouslySetInnerHTML={{ __html: highlightedText }} />
                     );
                                     } else if (paragraph.includes('===') && paragraph.includes('===')) {
                     // Destaque animado
                     const highlightedText = paragraph.replace(/===(.*?)===/g, '<span class="bg-red-200 px-1 rounded border-2 border-red-400">$1</span>');
                     return (
                       <p key={index} className="text-gray-800 leading-relaxed mb-6 text-base font-normal" 
                          dangerouslySetInnerHTML={{ __html: highlightedText }} />
                     );
                                     } else if (paragraph.includes('💡')) {
                     // Caixa de informação
                     return (
                       <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                         <p className="text-gray-800 text-base font-normal">
                           {paragraph}
                         </p>
                       </div>
                     );
                  } else {
                                        // Parágrafo normal
                    return (
                      <p key={index} className="text-gray-700 leading-relaxed mb-6 text-base font-normal font-poppins">
                        {paragraph}
                      </p>
                    );
                  }
                })}
              </div>

              {/* Sistema de Votação de Reações - Acima das Tags */}
              <div className="mt-8 mb-6">
                <ReactionVoting articleId={finalArticle.id} />
              </div>

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {finalArticle.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mobile Widgets */}
              <div className="lg:hidden mt-8 space-y-6">
                <AdBox />
                <RelatedWidget />
                <MostRead />
                <NewsletterCTA />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="col-span-3 hidden lg:flex flex-col gap-8">
              <AdBox />
              <MostRead />
              <RelatedWidget />
              <NewsletterCTA />
            </aside>
          </div>
        </div>
      </article>

      {/* Related News */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-[1180px]">
          <h2 className="text-2xl font-black text-neutral900 mb-8 font-title">Notícias Relacionadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedNews.map((news, index) => (
              <article key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group">
                <img 
                  src={news.image}
                  alt={news.title}
                  className="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                    {news.category}
                  </span>
                  <h3 className="text-gray-900 font-bold mt-2 leading-tight group-hover:text-brand transition-colors duration-300">
                    {news.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
      
      {/* CSS para conteúdo HTML renderizado */}
      <style jsx>{`
        .article-html-content {
          color: #374151;
          line-height: 1.8;
        }
        
        .article-html-content p {
          margin-bottom: 1.5rem;
          color: #374151;
          font-size: 16px;
          line-height: 1.7;
        }
        
        .article-html-content div {
          margin-bottom: 1rem;
        }
        
        .article-html-content span {
          color: inherit;
        }
        
        .article-html-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          margin: 1.5rem 0;
          font-style: italic;
          background-color: #eff6ff;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #1f2937;
        }
        
        .article-html-content br {
          line-height: 2;
        }
        
        .article-html-content .highlight-animated {
          position: relative;
          background: linear-gradient(90deg, rgb(251, 191, 36), rgb(245, 158, 11)) left center / 0% 100% no-repeat;
          transition: background-size 2s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgb(0, 0, 0);
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
          display: inline;
        }
      `}</style>
    </div>
  );
};

export default ArticlePage;