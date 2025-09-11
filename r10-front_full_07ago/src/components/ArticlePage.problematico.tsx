import React, { useEffect, useRef, useState } from 'react';
import { Calendar, User, Share2, Bookmark, Facebook, MessageCircle, Volume2, Twitter } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPostById } from '../services/postsService';
import Header from './Header';
import BreakingBar from './BreakingBar';
import SmartAudioPlayer from './SmartAudioPlayer';
import AdBox from './AdBox';
import MostReadWidget from './MostReadWidget';
import RelatedWidget from './RelatedWidget';
import NewsletterCTA from './NewsletterCTA';

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
  
  // Estado para reações - funcional com animações
  const [reactions, setReactions] = useState({
    '😊': { count: 15, userVoted: false },
    '😍': { count: 8, userVoted: false },
    '😲': { count: 23, userVoted: false },
    '😟': { count: 5, userVoted: false },
    '😔': { count: 2, userVoted: false },
    '😡': { count: 7, userVoted: false }
  });
  const [lastVoted, setLastVoted] = useState<string | null>(null);
  
  // Hook TTS integrado no SmartAudioPlayer

  // Função para tratar reações
  const handleReaction = (emoji: string) => {
    setReactions(prev => {
      const newReactions = { ...prev };
      
      // Se já votou em outra reação, remove o voto anterior
      if (lastVoted && lastVoted !== emoji) {
        newReactions[lastVoted].count--;
        newReactions[lastVoted].userVoted = false;
      }
      
      // Se clicou na mesma reação, remove o voto
      if (lastVoted === emoji) {
        newReactions[emoji].count--;
        newReactions[emoji].userVoted = false;
        setLastVoted(null);
      } else {
        // Adiciona novo voto
        newReactions[emoji].count++;
        newReactions[emoji].userVoted = true;
        setLastVoted(emoji);
      }
      
      return newReactions;
    });
  };

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
            publishDate: post.dataPublicacao || post.publishedAt || '',
            category: post.categoria,
            subcategorias: [],
            image: post.imagemUrl || '',
            content: post.conteudo ? [post.conteudo] : [],
            tags: [],
            readTime: calculateReadTime(post.conteudo ? [post.conteudo] : []),
            views: post.views?.toString() || post.visualizacoes?.toString() || '0',
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

  // 3) Efeito para animar destaque quando entrar na viewport (sempre chamado)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const highlightedSpans = entry.target.querySelectorAll('span[class*="bg-red-200"]');
          highlightedSpans.forEach((span) => {
            span.classList.add('animate-highlight-pulse');
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
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4 font-poppins">
              {finalArticle.title}
            </h1>
            
            {finalArticle.subtitle && (
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-light">
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

              {/* Reaction Bar - Funcional */}
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-800">Como você se sentiu com esta notícia?</span>
                  <div className="flex gap-2">
                    {[
                      { emoji: '😊', label: 'Feliz', color: 'hover:bg-green-100', count: 15 },
                      { emoji: '😍', label: 'Inspirado', color: 'hover:bg-blue-100', count: 8 },
                      { emoji: '😲', label: 'Surpreso', color: 'hover:bg-yellow-100', count: 23 },
                      { emoji: '😟', label: 'Preocupado', color: 'hover:bg-orange-100', count: 5 },
                      { emoji: '�', label: 'Triste', color: 'hover:bg-purple-100', count: 2 },
                      { emoji: '😡', label: 'Indignado', color: 'hover:bg-red-100', count: 7 }
                    ].map((reaction, index) => {
                      const isUserVoted = reactions[reaction.emoji]?.userVoted || false;
                      
                      return (
                      <button 
                        key={index}
                        onClick={() => handleReaction(reaction.emoji)}
                        className={`flex flex-col items-center px-3 py-2 rounded-lg border-2 transition-all duration-300 transform hover:scale-110 active:scale-95 relative group min-w-[50px] ${
                          isUserVoted 
                            ? 'bg-blue-100 border-blue-400 shadow-md' 
                            : `bg-white border-gray-200 ${reaction.color} hover:border-gray-300`
                        }`}
                        title={reaction.label}
                      >
                        <span className={`text-lg mb-1 transition-transform duration-200 ${isUserVoted ? 'scale-125' : ''}`}>
                          {reaction.emoji}
                        </span>
                        <span className={`text-xs font-medium transition-colors duration-200 ${
                          isUserVoted ? 'text-blue-700 font-bold' : 'text-gray-600'
                        }`}>
                          {reactions[reaction.emoji]?.count || reaction.count}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {reaction.label}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>

                        {/* Feedback visual para voto */}
                        {isUserVoted && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              </div>



              {/* Article Image */}
              <figure className="mb-8">
                <img 
                  src={finalArticle.image} 
                  alt={finalArticle.title}
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                />
              </figure>

              {/* Resumo em Tópicos */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-blue-600 mr-2">📋</span>
                  Resumo da Notícia
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-800">Nova política de transporte público será implementada em Teresina</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-800">Sistema integrado entre ônibus e metrô com investimento de R$ 500 milhões</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-800">Projeto deve beneficiar mais de 800 mil usuários diários</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-800">Implementação prevista para 2024 com cronograma detalhado</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-800">Inclui aplicativo móvel e cartão único para todos os transportes</span>
                  </div>
                </div>
              </div>



              {/* Article Content */}
              <div ref={articleRef} className="prose prose-lg max-w-none font-poppins">
                {finalArticle.content.map((paragraph, index) => {
                  // Renderizar diferentes tipos de conteúdo
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
                <MostReadWidget />
                <NewsletterCTA />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="col-span-3 hidden lg:flex flex-col gap-8">
              <AdBox />
              <MostReadWidget />
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
    </div>
  );
};

export default ArticlePage;