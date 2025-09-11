import React, { useState, useEffect } from 'react';
import { getHomeSectionTitles } from '../lib/seo';
import { fetchPostsArray, Post } from '../services/postsService';
import { Link } from 'react-router-dom';

interface Municipio {
  nome: string;
  slug: string;
  posts: Post[];
  ultimaAtualizacao: Date;
  color: string;
}

const MunicipiosComponente = () => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista dos municípios baseada no formulário com cores do layout + categorias reais do banco
  const municipiosList = [
    { nome: 'PIRIPIRI', slug: 'piripiri', color: 'blue' },
    { nome: 'PEDRO II', slug: 'pedro-ii', color: 'purple' },
    { nome: 'PIRACURUCA', slug: 'piracuruca', color: 'cyan' },
    { nome: 'BRASILEIRA', slug: 'brasileira', color: 'red' },
    { nome: 'LAGOA DE SÃO FRANCISCO', slug: 'lagoa-de-sao-francisco', color: 'green' },
    { nome: 'CAMPO MAIOR', slug: 'campo-maior', color: 'pink' },
    { nome: 'BARRAS', slug: 'barras', color: 'indigo' },
    { nome: 'ESPERANTINA', slug: 'esperantina', color: 'yellow' },
    { nome: 'BATALHA', slug: 'batalha', color: 'emerald' },
    { nome: 'COCAL', slug: 'cocal', color: 'orange' },
    { nome: 'BURITI DOS LOPES', slug: 'buriti-dos-lopes', color: 'teal' },
    { nome: 'MORRO DO CHAPÉU', slug: 'morro-do-chapeu', color: 'violet' },
    { nome: 'CAXINGÓ', slug: 'caxingo', color: 'rose' },
    { nome: 'TERESINA', slug: 'teresina', color: 'slate' },
    { nome: 'SÃO JOSÉ DO DIVINO', slug: 'sao-jose-do-divino', color: 'amber' },
    { nome: 'DOMINGOS MOURÃO', slug: 'domingos-mourao', color: 'lime' }
  ];

  useEffect(() => {
    const fetchMunicipiosPosts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Buscando posts para seção de municípios...');
        
        // Buscar todos os posts
        const allPosts = await fetchPostsArray(200);
        console.log('🏛️ Posts totais encontrados:', allPosts.length);
        console.log('🏛️ Categorias de TODOS os posts:', [...new Set(allPosts.map(p => p.categoria))]);
        
        // Filtrar posts que são de municípios (pela categoria)
        const postsComMunicipios = allPosts.filter(post => {
          return municipiosList.some(municipio => 
            post.categoria === municipio.slug
          );
        });

        console.log('🏛️ Posts com municípios (por categoria):', postsComMunicipios.length);
        console.log('🏛️ Categorias encontradas:', [...new Set(postsComMunicipios.map(p => p.categoria))]);
        
        // Agrupar posts por município
        const municipiosWithPosts: Municipio[] = [];
        
        municipiosList.forEach(municipioConfig => {
          const postsDoMunicipio = postsComMunicipios.filter(post => 
            post.categoria === municipioConfig.slug
          );
          
          console.log(`🏛️ ${municipioConfig.nome} (${municipioConfig.slug}):`, postsDoMunicipio.length, 'posts');
          
          if (postsDoMunicipio.length > 0) {
            // Ordenar posts por data mais recente
            const postsSorted = postsDoMunicipio.sort((a, b) => 
              new Date(b.publishedAt || b.dataPublicacao || '').getTime() - 
              new Date(a.publishedAt || a.dataPublicacao || '').getTime()
            );

            municipiosWithPosts.push({
              nome: municipioConfig.nome,
              slug: municipioConfig.slug,
              color: municipioConfig.color,
              posts: postsSorted,
              ultimaAtualizacao: new Date(postsSorted[0]?.publishedAt || postsSorted[0]?.dataPublicacao || new Date())
            });
          }
        });
        
        // Ordenar municípios por última atualização (mais recente primeiro)
        municipiosWithPosts.sort((a, b) => 
          b.ultimaAtualizacao.getTime() - a.ultimaAtualizacao.getTime()
        );
        
        console.log('🏛️ Municípios com posts encontrados:', municipiosWithPosts.length);
        console.log('🏛️ Ordem final:', municipiosWithPosts.map(m => `${m.nome} (${m.posts.length} posts)`));
        
        setMunicipios(municipiosWithPosts.slice(0, 6)); // Top 6 municípios
      } catch (error) {
        console.error('❌ Erro ao buscar posts de municípios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipiosPosts();
  }, []);

  // Função para obter classes de cores baseadas no layout
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string, text: string, border: string, hover: string } } = {
      purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-300', hover: 'hover:bg-purple-700' },
      pink: { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-300', hover: 'hover:bg-pink-700' },
      cyan: { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-300', hover: 'hover:bg-cyan-700' },
      yellow: { bg: 'bg-yellow-500', text: 'text-gray-800', border: 'border-yellow-300', hover: 'hover:bg-yellow-600' },
      green: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-300', hover: 'hover:bg-green-700' },
      red: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-300', hover: 'hover:bg-red-700' },
      blue: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-300', hover: 'hover:bg-blue-700' },
      indigo: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-300', hover: 'hover:bg-indigo-700' },
      orange: { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-300', hover: 'hover:bg-orange-700' },
      teal: { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-300', hover: 'hover:bg-teal-700' },
      emerald: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-300', hover: 'hover:bg-emerald-700' },
      violet: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-300', hover: 'hover:bg-violet-700' },
      rose: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-300', hover: 'hover:bg-rose-700' },
      slate: { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-300', hover: 'hover:bg-slate-800' },
      amber: { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-300', hover: 'hover:bg-amber-700' },
      lime: { bg: 'bg-lime-600', text: 'text-white', border: 'border-lime-300', hover: 'hover:bg-lime-700' }
    };
    
    return colorMap[color] || colorMap.blue;
  };

  // Função para criar slug da URL
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Função para extrair pontos-chave do conteúdo
  const extractKeyPoints = (post: Post) => {
    const points = [];
    
    // Usar subtítulo se disponível
    if (post.subtitulo) {
      points.push(post.subtitulo);
    }
    
    // Extrair do conteúdo
    if (post.conteudo && points.length < 2) {
      const sentences = post.conteudo
        .replace(/[•▪▫]/g, '') // Remove bullets existentes
        .split(/[.!?]\s+/)
        .filter(s => s.length > 20 && s.length < 120)
        .slice(0, 2 - points.length);
      
      points.push(...sentences.map(s => s.trim()));
    }
    
    return points.slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="titulo-principal text-gray-800 mb-2">{getHomeSectionTitles().municipios}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="corpo-texto ml-3 text-gray-600">Carregando notícias dos municípios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (municipios.length === 0) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="titulo-principal text-gray-800 mb-2">{getHomeSectionTitles().municipios}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="corpo-texto text-gray-600">Nenhuma notícia de municípios encontrada no momento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Título da seção com ícone de localização */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-red-500 text-lg">📍</span>
            <h2 className="titulo-principal text-gray-800">MUNICÍPIOS</h2>
            <span className="text-red-500 text-lg">📍</span>
          </div>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
        
        {/* Grid de municípios - 6 cards sempre visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {municipios.map((municipio, index) => {
            const post = municipio.posts[0]; // Pegar a notícia mais recente
            const colorClasses = getColorClasses(municipio.color);
            
            return (
              <div key={municipio.slug} className="group bg-white rounded-2xl shadow-lg overflow-hidden border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                {/* Header com gradiente e nome do município */}
                <div className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.hover} px-6 py-5 relative overflow-hidden transition-colors duration-300`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <h3 className="font-black text-base uppercase tracking-wide relative z-10 flex items-center">
                    <span className="w-2 h-2 bg-white bg-opacity-70 rounded-full mr-3 animate-pulse"></span>
                    {municipio.nome}
                  </h3>
                  <p className="text-xs opacity-80 mt-1 relative z-10">
                    {municipio.posts.length} {municipio.posts.length === 1 ? 'notícia' : 'notícias'}
                  </p>
                </div>
                
                {/* Imagem da notícia com overlay */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={post.imagemUrl || "/logo-r10-piaui.png"}
                    alt={post.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = '/logo-r10-piaui.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Badge com data */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(post.dataPublicacao || post.publishedAt || '').toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Conteúdo do card */}
                <div className="p-6 space-y-4">
                  {/* Título da notícia */}
                  <Link 
                    to={`/noticia/${post.categoria || 'geral'}/${createSlug(post.titulo)}/${post.id}`}
                    className="block group-hover:text-red-600 transition-colors duration-200"
                  >
                    <h4 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2 mb-2">
                      {post.titulo}
                    </h4>
                  </Link>
                  
                  {/* Subtítulo/resumo */}
                  {post.subtitulo && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {post.subtitulo}
                    </p>
                  )}
                  
                  {/* Footer com stats e link */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {post.views && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          {post.views}
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to={`/municipio/${municipio.slug}`}
                      className={`inline-flex items-center text-xs font-semibold ${colorClasses.bg.replace('bg-', 'text-')} hover:underline transition-all duration-200`}
                    >
                      Ver mais
                      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MunicipiosComponente;
