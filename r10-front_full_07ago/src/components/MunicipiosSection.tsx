import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPostsByPosition } from '../services/postsService';
import { Post } from '../types/Post';

interface MunicipioData {
  nome: string;
  posts: Post[];
  totalPosts: number;
}

const MunicipiosSection: React.FC = () => {
  const [municipiosData, setMunicipiosData] = useState<MunicipioData[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista dos principais municípios do Piauí (baseada nas categorias cadastradas)
  const municipiosList = [
    'Piripiri', 'Pedro II', 'Brasileira', 
    'Lagoa de São Francisco', 'Piracuruca', 'São José do Divino',
    'Domingos Mourão', 'Capitão de Campos', 'Cocal de Telha',
    'Milton Brandão', 'Teresina', 'Boa Hora'
  ];

  // Configuração de cores para cada município
  const getColorClasses = (municipio: string) => {
    const colorMap: { [key: string]: { title: string, header: string } } = {
      'Piripiri': {
        title: 'text-red-600',
        header: 'from-red-500 to-red-600'
      },
      'Pedro II': {
        title: 'text-blue-600',
        header: 'from-blue-500 to-blue-600'
      },
      'Brasileira': {
        title: 'text-green-600',
        header: 'from-green-500 to-green-600'
      },
      'Lagoa de São Francisco': {
        title: 'text-yellow-600',
        header: 'from-yellow-500 to-yellow-600'
      },
      'Piracuruca': {
        title: 'text-purple-600',
        header: 'from-purple-500 to-purple-600'
      },
      'São José do Divino': {
        title: 'text-orange-600',
        header: 'from-orange-500 to-orange-600'
      },
      'Domingos Mourão': {
        title: 'text-pink-600',
        header: 'from-pink-500 to-pink-600'
      },
      'Capitão de Campos': {
        title: 'text-indigo-600',
        header: 'from-indigo-500 to-indigo-600'
      },
      'Cocal de Telha': {
        title: 'text-teal-600',
        header: 'from-teal-500 to-teal-600'
      },
      'Milton Brandão': {
        title: 'text-cyan-600',
        header: 'from-cyan-500 to-cyan-600'
      },
      'Teresina': {
        title: 'text-emerald-600',
        header: 'from-emerald-500 to-emerald-600'
      },
      'Boa Hora': {
        title: 'text-rose-600',
        header: 'from-rose-500 to-rose-600'
      }
    };
    return colorMap[municipio] || colorMap['Piripiri'];
  };

  // Criar slug para URL
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

  useEffect(() => {
    const fetchMunicipiosData = async () => {
      try {
        const municipiosWithData: MunicipioData[] = [];
        
        // Buscar todas as notícias de todas as posições para encontrar por município
        const apiUrl = import.meta.env.PROD ? '/api/posts?limit=100' : 'http://localhost:3002/api/posts?limit=100';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allPostsResponse = await response.json();
        const allPosts = Array.isArray(allPostsResponse) ? allPostsResponse : allPostsResponse.items || [];
        
        console.log('📊 MunicipiosSection: Posts totais encontrados:', allPosts.length);
        
        for (const municipio of municipiosList) {
          try {
            // Filtrar posts pela CATEGORIA ESPECÍFICA do município
            const municipioPosts = allPosts.filter((post: any) => {
              // Buscar exatamente pela categoria do município (case insensitive)
              return post.categoria?.toLowerCase() === municipio.toLowerCase() ||
                     // Também verificar subcategorias se existirem
                     (Array.isArray(post.subcategorias) && 
                      post.subcategorias.some((sub: string) => 
                        sub.toLowerCase() === municipio.toLowerCase()));
            }).slice(0, 4); // Máximo 4 posts por município

            console.log(`📊 MunicipiosSection: Posts encontrados para ${municipio}:`, municipioPosts.length);
            if (municipioPosts.length > 0) {
              console.log(`📊 Posts de ${municipio}:`, municipioPosts.map((p: any) => ({
                id: p.id,
                titulo: p.titulo,
                categoria: p.categoria
              })));
            }

            // APENAS adicionar se encontrar posts REAIS do município
            if (municipioPosts.length > 0) {
              municipiosWithData.push({
                nome: municipio,
                posts: municipioPosts,
                totalPosts: municipioPosts.length
              });
            }
          } catch (error) {
            console.error(`Erro ao buscar posts para ${municipio}:`, error);
          }
        }

        // REMOVIDO: Não usar fallback com posts aleatórios
        // Apenas mostrar municípios que realmente têm notícias específicas
        
        setMunicipiosData(municipiosWithData.slice(0, 6)); // Máximo 6 municípios
      } catch (error) {
        console.error('Erro ao carregar dados dos municípios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipiosData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Título da seção */}
          <div className="text-center mb-6">
            <h2 className="text-[35px] leading-[1.1] text-[#57534f] font-body">
              <span className="font-medium italic">destaques</span> <span className="font-bold italic">da região</span>
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 mx-auto rounded-full shadow-lg mt-2"></div>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-200 animate-pulse h-48"></div>
                <div className="p-4">
                  <div className="bg-gray-200 animate-pulse h-4 mb-2 rounded"></div>
                  <div className="bg-gray-200 animate-pulse h-3 mb-4 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Título da seção */}
        <div className="text-center mb-6">
          <h2 className="text-[35px] leading-[1.1] text-[#57534f] font-body">
            <span className="font-medium italic">destaques</span> <span className="font-bold italic">da região</span>
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 mx-auto rounded-full shadow-lg mt-2"></div>
        </div>

        {/* Grid de municípios - 3 colunas, 2 linhas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {municipiosData.map((municipio, index) => {
            const colors = getColorClasses(municipio.nome);
            const mainPost = municipio.posts[0];
            const otherPosts = municipio.posts.slice(1);
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Header colorido com nome do município */}
                <div className={`bg-gradient-to-r ${colors.header} text-white py-3 px-4`}>
                  <h3 className="municipios-nome text-center">{municipio.nome}</h3>
                </div>

                {/* Imagem da notícia principal */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={mainPost?.imagemUrl || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop'} 
                    alt={mainPost?.titulo || municipio.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop';
                    }}
                  />
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  {/* Notícia principal */}
                  {mainPost && (
                    <div className="mb-4">
                      <Link 
                        to={`/noticia/${mainPost.categoria || 'geral'}/${createSlug(mainPost.titulo)}/${mainPost.id}`}
                        className="block group"
                      >
                        <h4 className={`municipios-title mb-2 ${colors.title} group-hover:opacity-80 transition-opacity`}>
                          {mainPost.titulo}
                        </h4>
                        <p className="municipios-subtitle text-gray-600 leading-relaxed mb-3">
                          {mainPost.subtitulo || mainPost.conteudo?.substring(0, 120) + '...'}
                        </p>
                      </Link>
                    </div>
                  )}

                  {/* Outras notícias */}
                  {otherPosts.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <h5 className="text-gray-800 font-semibold text-sm mb-2 uppercase tracking-wide">
                        Outras Notícias
                      </h5>
                      <ul className="space-y-2">
                        {otherPosts.map((post, nIndex) => (
                          <li key={nIndex} className="flex items-start">
                            <span className={`w-2 h-2 rounded-full ${colors.header.replace('from-', 'bg-').split(' ')[0]} mt-1.5 mr-3 flex-shrink-0`}></span>
                            <Link 
                              to={`/noticia/${post.categoria || 'geral'}/${createSlug(post.titulo)}/${post.id}`}
                              className="text-gray-700 text-sm leading-snug hover:text-gray-900 transition-colors"
                            >
                              {post.titulo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MunicipiosSection;