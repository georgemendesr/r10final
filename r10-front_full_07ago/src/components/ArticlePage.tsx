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

  // 3) Efeito para animar highlight QUANDO USUÁRIO VÊ (scroll-based)
  useEffect(() => {
    const animateHighlights = () => {
      const highlightElements = document.querySelectorAll('span[data-highlight="animated"]:not(.animate-in-view)');
      
      console.log('🔍 ANIMAÇÃO: Elementos com data-highlight encontrados:', highlightElements.length);
      
      highlightElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        console.log('📏 Elemento:', {
          texto: element.textContent?.substring(0, 30),
          top: rect.top,
          bottom: rect.bottom,
          windowHeight,
          visivel: rect.top < windowHeight - 50 && rect.bottom > 50
        });
        
        // ✅ Só anima quando usuário REALMENTE VÊ o elemento
        // Margem de 50px para começar animação um pouco antes
        if (rect.top < windowHeight - 50 && rect.bottom > 50) {
          console.log('✨ ANIMAÇÃO ATIVADA: Usuário viu o destaque:', element.textContent?.substring(0, 30));
          (element as HTMLElement).classList.add('animate-in-view');
        }
      });
    };

    // Verificar elementos que já estão visíveis ao carregar
    const checkTimer = setTimeout(() => {
      console.log('🔍 === VERIFICAÇÃO INICIAL DE DESTAQUES ===');
      animateHighlights();
    }, 100);

    // ✅ IMPORTANTE: Escutar scroll para animar quando usuário rolar até o elemento
    window.addEventListener('scroll', animateHighlights, { passive: true });
    
    return () => {
      clearTimeout(checkTimer);
      window.removeEventListener('scroll', animateHighlights);
    };
  }, [article, articleData]); // Executar quando conteúdo mudar

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
      
      {/* CSS para animação de highlights */}
      <style>{`
        /* Destaque animado - estado inicial (salvo no banco) */
        span[data-highlight="animated"],
        .highlight-animated {
          position: relative;
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          background-size: 0% 100%;
          background-repeat: no-repeat;
          background-position: left center;
          transition: background-size 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #000;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
          display: inline;
        }
        
        /* Destaque animado - quando visível na tela */
        span[data-highlight="animated"].animate-in-view,
        .highlight-animated.animate-in-view {
          background-size: 100% 100% !important;
        }
      `}</style>
      
      <Header />
      <BreakingBar />
      
      <article className="bg-white">
                <div className="container mx-auto px-4 max-w-[1250px] py-8">
          {/* Título Principal da Matéria */}
          <div className="mb-8">
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full uppercase tracking-wide">
                {finalArticle.category === 'editoriais' && finalArticle.subcategorias?.length > 0
                  ? finalArticle.subcategorias[0]
                  : finalArticle.category === 'editoriais'
                  ? 'Geral'
                  : finalArticle.category}
              </span>
            </div>
            
            <h1 className="artigo-title" style={{ color: '#111' }}>
              <span style={{ color: getEditoriaTextColor(finalArticle.category) }}>
                {finalArticle.title}
              </span>
            </h1>
            
            {finalArticle.subtitle && (
              <p className="artigo-subtitle text-gray-600 leading-relaxed mb-6">
                {finalArticle.subtitle}
              </p>
            )}
          </div>

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
                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm border-b border-gray-200 pb-4 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Por <strong className="text-gray-700">{finalArticle.author}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(finalArticle.publishDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📖 {calculateReadTime(finalArticle.content)} de leitura</span>
                  </div>
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

              {/* Resumo em Tópicos - Extraído do texto | sem invenções | término lógico */}
              {(() => {
                // Utilidades
                const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                const joinText = stripTags(finalArticle.content.join('\n\n'));
                const hasMinLength = joinText.length >= 500;

                const endsWithPunct = (s: string) => /[.!?]$/.test(s);
                const normalizeSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
                const ensurePeriod = (s: string) => endsWithPunct(s) ? s : (s.replace(/[\.,;:!?]+$/, '').trim() + '.');
                const finalizeHeading = (s: string) => ensurePeriod(normalizeSpaces(s).slice(0, 80));

                // Corta respeitando fim lógico: tenta pontuação primeiro; se não houver, usa separadores fracos e fecha com ponto.
                const toBullet = (s: string, limit = 80) => {
                  let t = normalizeSpaces(s);
                  if (t.length <= limit) {
                    return ensurePeriod(t);
                  }
                  // 1) Procurar pontuação forte até o limite
                  const strong = /[.!?]/g; let m: RegExpExecArray | null; let lastStrong = -1;
                  while ((m = strong.exec(t)) && m.index <= limit) lastStrong = m.index;
                  if (lastStrong >= 40) {
                    return ensurePeriod(t.slice(0, lastStrong + 1).trim());
                  }
                  // 2) Procurar separadores médios (ponto e vírgula, dois-pontos, travessão)
                  const mediumIdx = Math.max(
                    t.lastIndexOf(';', limit),
                    t.lastIndexOf(':', limit),
                    t.lastIndexOf(' — ', limit),
                    t.lastIndexOf(' – ', limit),
                    t.lastIndexOf(' - ', limit)
                  );
                  if (mediumIdx >= 40) {
                    return ensurePeriod(t.slice(0, mediumIdx).trim());
                  }
                  // 2.1) Conectores comuns em PT-BR para encerrar a ideia sem diluir
                  const connectors = [' que ', ' com ', ' para ', ' por ', ' onde ', ' quando ', ' porque ', ' e '];
                  let connIdx = -1;
                  for (const c of connectors) {
                    const idx = t.lastIndexOf(c, limit);
                    if (idx > connIdx) connIdx = idx;
                  }
                  if (connIdx >= 40) {
                    return ensurePeriod(t.slice(0, connIdx).trim());
                  }
                  // 3) Vírgula como última alternativa para encerrar ideia
                  const commaIdx = t.lastIndexOf(',', limit);
                  if (commaIdx >= 40) {
                    return ensurePeriod(t.slice(0, commaIdx).trim());
                  }
                  // 4) Sem separadores: corta na última palavra e usa reticências com parcimônia
                  const spaceIdx = t.lastIndexOf(' ', limit);
                  const cut = spaceIdx > 40 ? t.slice(0, spaceIdx) : t.slice(0, limit);
                  return ensurePeriod(cut.trim());
                };

                const dedupe = (arr: string[]) => {
                  const seen = new Set<string>();
                  const out: string[] = [];
                  for (const v of arr) {
                    const key = v.toLowerCase();
                    if (!seen.has(key)) { seen.add(key); out.push(v); }
                  }
                  return out;
                };

                const extractCandidates = (paragraphs: string[]): { bullets: string[]; headings: string[]; sentences: string[] } => {
                  const cleanedParas = paragraphs.map(stripTags).filter(p => p.length > 0);

                  // 1) Bullets explícitos nos parágrafos
                  const bullets: string[] = [];
                  cleanedParas.forEach(p => {
                    const parts = p.split(/\s*[•\-*]\s+/g).map(s => s.trim()).filter(Boolean);
                    if (parts.length > 1) {
                      parts.forEach(part => { if (part.length >= 20) bullets.push(part); });
                    }
                  });

                  // 2) Títulos H3 (sem o marcador "### ")
                  const headings = paragraphs
                    .filter(p => p.startsWith('### '))
                    .map(p => p.replace(/^###\s+/, '').trim())
                    .filter(h => h.length >= 20);

                  // 3) Sentenças do corpo
                  const sentences: string[] = [];
                  cleanedParas.forEach(p => {
                    // mantém a pontuação original na sentença
                    p.split(/(?<=[.!?])\s+/g).forEach(s => {
                      const t = s.replace(/^["'“”\s]+|[\s]+$/g, '').trim();
                      if (t.length >= 20) sentences.push(t);
                    });
                  });
                  return { bullets, headings, sentences };
                };

                const { bullets: b1, headings: h1, sentences: s1 } = extractCandidates(finalArticle.content);
                const uniq = (arr: string[]) => dedupe(arr.map(normalizeSpaces));

                const pick: string[] = [];
                // Preferência 1: bullets explícitos (finalizados logicamente)
                for (const x of uniq(b1)) {
                  if (pick.length >= 4) break;
                  const v = toBullet(x, 80);
                  // Aceitar com término lógico (pontuação) ou com reticências apenas se não houver alternativa
                  pick.push(v);
                }
                // Preferência 2: headings (tópicos curtos)
                for (const x of uniq(h1)) {
                  if (pick.length >= 4) break;
                  const v = finalizeHeading(x);
                  pick.push(v);
                }
                // Preferência 3: sentenças completas que já terminam em pontuação e cabem até 80
                for (const x of uniq(s1)) {
                  if (pick.length >= 4) break;
                  if (x.length <= 80 && endsWithPunct(x)) {
                    pick.push(x);
                  }
                }
                // Preferência 4: sentenças maiores, cortar por pontuação/separadores mantendo sentido
                for (const x of uniq(s1)) {
                  if (pick.length >= 4) break;
                  const v = toBullet(x, 80);
                  pick.push(v);
                }

                // Consolidar e garantir 4, descartando duplicatas vazias
                const bullets = dedupe(pick.filter(Boolean)).slice(0, 4);

                if (!hasMinLength || bullets.length < 4) return null;

                return (
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">📋</span>
                      Resumo da Notícia
                    </h3>
                    <div className="space-y-3">
                      {bullets.map((point, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-blue-600 font-bold mr-3 mt-0.5 text-lg">•</span>
                          <span className="text-gray-800 leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}



              {/* Article Content */}
              <div ref={articleRef} className="prose prose-lg max-w-none artigo-texto">
                {finalArticle.content.map((paragraph, index) => {
                  // Renderizar diferentes tipos de conteúdo
                  
                  // 1. SUBTÍTULOS H3
                  if (paragraph.startsWith('### ') || paragraph.includes('<h3')) {
                    let processedText = paragraph
                      .replace(/### (.*?)(?=\n|$)/g, '$1')
                      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '$1');
                      
                    return (
                      <h3 key={index} className="text-2xl font-bold text-gray-900 my-6 mt-8 font-poppins">
                        {processedText}
                      </h3>
                    );
                  }
                  
                  // 2. CITAÇÕES (BLOCKQUOTE)
                  else if (paragraph.startsWith('> ') || paragraph.includes('<blockquote')) {
                    let processedText = paragraph
                      .replace(/^> (.*?)(?=\n|$)/gm, '$1')
                      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '$1');
                      
                    return (
                      <blockquote key={index} className="border-l-4 border-blue-600 pl-6 py-4 my-8 bg-blue-50 rounded-r-lg">
                        <p className="text-lg font-normal text-gray-800"
                           dangerouslySetInnerHTML={{ __html: processedText }}>
                        </p>
                      </blockquote>
                    );
                  }
                  
                  // 3. LISTAS
                  else if (paragraph.startsWith('• ')) {
                    return (
                      <div key={index} className="flex items-start mb-3">
                        <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                        <span className="text-gray-800 text-base">{paragraph.replace('• ', '')}</span>
                      </div>
                    );
                  }
                  
                  // 4. DESTAQUES ANIMADOS (highlight-animated)
                  else if (paragraph.includes('data-highlight="animated"') || 
                           paragraph.includes('class="highlight-animated"') ||
                           paragraph.includes('===') ||
                           paragraph.includes('<span class="highlight-simple">')) {
                    let highlightedText = paragraph
                      // Preservar data-highlight existente (já salvo corretamente)
                      .replace(/<span[^>]*data-highlight="animated"[^>]*style="[^"]*">(.*?)<\/span>/g, 
                               '<span data-highlight="animated" class="highlight-animated">$1</span>')
                      // Formato antigo: ===texto=== = ANIMADO
                      .replace(/===(.*?)===/g, '<span data-highlight="animated" class="highlight-animated">$1</span>')
                      // Formato antigo: ==texto== = SIMPLES
                      .replace(/==(.*?)==/g, '<span class="bg-yellow-200 px-1 rounded border border-yellow-400">$1</span>')
                      // Formato simples já existente
                      .replace(/<span class="highlight-simple"[^>]*>(.*?)<\/span>/g, 
                               '<span class="bg-yellow-200 px-1 rounded border border-yellow-400">$1</span>')
                      // Processar formatação básica
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<u>$1</u>');
                      
                    return (
                      <p key={index} className="text-gray-800 leading-relaxed mb-6" 
                         style={{ fontFamily: 'Figtree, sans-serif', fontSize: '18px', lineHeight: '1.6' }}
                         dangerouslySetInnerHTML={{ __html: highlightedText }} />
                    );
                  }
                  
                  // 5. CAIXAS DE INFORMAÇÃO
                  else if (paragraph.includes('💡') || paragraph.includes('<div class="info-box">')) {
                    let processedText = paragraph
                      .replace(/<div class="info-box"[^>]*>(.*?)<\/div>/g, '$1');
                      
                    return (
                      <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                        <p className="text-gray-800 text-base font-normal"
                           dangerouslySetInnerHTML={{ __html: processedText }}>
                        </p>
                      </div>
                    );
                  }
                  
                  // 6. PARÁGRAFOS NORMAIS (com formatação básica)
                  else {
                    let processedText = paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<u>$1</u>');
                      
                    return (
                      <p key={index} className="text-gray-800 leading-relaxed mb-6" 
                         style={{ fontFamily: 'Figtree, sans-serif', fontSize: '18px', lineHeight: '1.6' }}
                         dangerouslySetInnerHTML={{ __html: processedText }}>
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
    </div>
  );
};

export default ArticlePage;