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
    { nome: 'BARRAS', slug: 'barras', color: 'cyan' },
    { nome: 'ESPERANTINA', slug: 'esperantina', color: 'yellow' },
    { nome: 'BATALHA', slug: 'batalha', color: 'green' },
    { nome: 'COCAL', slug: 'cocal', color: 'orange' },
    { nome: 'BURITI DOS LOPES', slug: 'buriti-dos-lopes', color: 'teal' },
    { nome: 'MORRO DO CHAPÉU', slug: 'morro-do-chapeu', color: 'purple' },
    { nome: 'CAXINGÓ', slug: 'caxingo', color: 'emerald' }
  ];

  useEffect(() => {
    const fetchMunicipiosPosts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Buscando posts para seção de municípios...');
        
        // Buscar todos os posts
        const allPosts = await fetchPostsArray(200);
        console.log('🏛️ Posts totais encontrados:', allPosts.length);
        
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
    const colorMap: { [key: string]: { bg: string, text: string } } = {
      purple: { bg: 'bg-purple-500', text: 'text-white' },
      pink: { bg: 'bg-pink-500', text: 'text-white' },
      cyan: { bg: 'bg-cyan-500', text: 'text-white' },
      yellow: { bg: 'bg-yellow-500', text: 'text-black' },
      green: { bg: 'bg-green-500', text: 'text-white' },
      red: { bg: 'bg-red-500', text: 'text-white' },
      blue: { bg: 'bg-blue-500', text: 'text-white' },
      indigo: { bg: 'bg-indigo-500', text: 'text-white' },
      orange: { bg: 'bg-orange-500', text: 'text-white' },
      teal: { bg: 'bg-teal-500', text: 'text-white' },
      emerald: { bg: 'bg-emerald-500', text: 'text-white' }
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{getHomeSectionTitles().municipios}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Carregando notícias dos municípios...</p>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{getHomeSectionTitles().municipios}</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhuma notícia de municípios encontrada no momento.</p>
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
            <h2 className="text-3xl font-bold text-gray-800">{getHomeSectionTitles().municipios}</h2>
            <span className="text-red-500 text-lg">📍</span>
          </div>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
        
        {/* Grid de municípios - 3 colunas, 2 linhas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {municipios.map((municipio, index) => {
            const post = municipio.posts[0]; // Pegar a notícia mais recente
            const colorClasses = getColorClasses(municipio.color);
            const keyPoints = extractKeyPoints(post);
            
            return (
              <div key={municipio.slug} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                {/* Header colorido com nome do município */}
                <div className={`${colorClasses.bg} ${colorClasses.text} px-4 py-3`}>
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {municipio.nome}
                  </h3>
                </div>
                
                {/* Imagem da notícia */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.imagemUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop"}
                    alt={post.titulo}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Conteúdo do card */}
                <div className="p-4">
                  {/* Título da notícia */}
                  <Link 
                    to={`/noticia/${post.categoria || 'geral'}/${createSlug(post.titulo)}/${post.id}`}
                    className="block mb-3"
                  >
                    <h4 className="font-bold text-lg text-gray-900 leading-tight hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                      {post.titulo}
                    </h4>
                  </Link>
                  
                  {/* Pontos-chave com bullets */}
                  {keyPoints.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {keyPoints.map((point, idx) => (
                        <li key={idx} className="text-gray-600 text-sm flex items-start">
                          <span className="text-red-500 mr-2 mt-1 flex-shrink-0">•</span>
                          <span className="line-clamp-1">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Link para ver todas as notícias */}
                  <Link 
                    to={`/municipio/${municipio.slug}`}
                    className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors duration-200 flex items-center"
                  >
                    Ver todas as notícias de {municipio.nome}
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
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
