import React, { useState, useEffect } from 'react';

interface Post {
  id: string;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  chapeu: string;
  categoria: string;
  imagemUrl?: string;
  publishedAt: string;
  createdAt: string;
}

interface Municipio {
  nome: string;
  slug: string;
  posts: Post[];
}

const MunicipiosSection: React.FC = () => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista dos municípios do formulário
  const municipiosList = [
    { nome: 'Piripiri', slug: 'piripiri' },
    { nome: 'Pedro II', slug: 'pedro-ii' },
    { nome: 'Brasileira', slug: 'brasileira' },
    { nome: 'Lagoa de São Francisco', slug: 'lagoa-de-sao-francisco' },
    { nome: 'Piracuruca', slug: 'piracuruca' },
    { nome: 'São José do Divino', slug: 'sao-jose-do-divino' },
    { nome: 'Domingos Mourão', slug: 'domingos-mourao' },
    { nome: 'Capitão de Campos', slug: 'capitao-de-campos' },
    { nome: 'Cocal de Telha', slug: 'cocal-de-telha' },
    { nome: 'Milton Brandão', slug: 'milton-brandao' },
    { nome: 'Teresina', slug: 'teresina' },
    { nome: 'Boa Hora', slug: 'boa-hora' }
  ];

  useEffect(() => {
    const fetchMunicipiosPosts = async () => {
      try {
        console.log('🔍 Buscando posts para municípios...');
        
        // Buscar todos os posts
        const response = await fetch('http://127.0.0.1:3002/api/posts');
        const allPosts: Post[] = await response.json();
        
        console.log('🏛️ Posts encontrados:', allPosts.length);
        console.log('🏛️ Primeiros 3 posts:', allPosts.slice(0, 3).map(p => ({ titulo: p.titulo, categoria: p.categoria })));
        
        // Agrupar posts por município (usando categoria)
        const municipiosWithPosts: Municipio[] = [];
        
        municipiosList.forEach(municipio => {
          const postsDoMunicipio = allPosts.filter(post => 
            post.categoria === municipio.slug
          );
          
          console.log(`🏛️ ${municipio.nome} (${municipio.slug}):`, postsDoMunicipio.length, 'posts');
          
          if (postsDoMunicipio.length > 0) {
            municipiosWithPosts.push({
              nome: municipio.nome,
              slug: municipio.slug,
              posts: postsDoMunicipio.sort((a, b) => 
                new Date(b.createdAt || b.publishedAt).getTime() - 
                new Date(a.createdAt || a.publishedAt).getTime()
              )
            });
          }
        });
        
        // Ordenar municípios pela notícia mais recente
        municipiosWithPosts.sort((a, b) => {
          const dataA = new Date(a.posts[0]?.createdAt || a.posts[0]?.publishedAt).getTime();
          const dataB = new Date(b.posts[0]?.createdAt || b.posts[0]?.publishedAt).getTime();
          return dataB - dataA;
        });
        
        console.log('🏛️ Municípios com posts:', municipiosWithPosts.length);
        console.log('🏛️ Municípios encontrados:', municipiosWithPosts.map(m => m.nome));
        
        setMunicipios(municipiosWithPosts.slice(0, 6)); // Máximo 6 municípios
      } catch (error) {
        console.error('❌ Erro ao buscar posts de municípios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipiosPosts();
  }, []);

  // Configuração de cores para cada município
  const getColorClasses = (municipio: string) => {
    const colorMap: { [key: string]: { title: string, header: string } } = {
      'PEDRO II': {
        title: 'text-red-600',
        header: 'from-red-500 to-red-600'
      },
      'CAMPO MAIOR': {
        title: 'text-blue-600',
        header: 'from-blue-500 to-blue-600'
      },
      'BARRAS': {
        title: 'text-green-600',
        header: 'from-green-500 to-green-600'
      },
      'ESPERANTINA': {
        title: 'text-yellow-600',
        header: 'from-yellow-500 to-yellow-600'
      },
      'BATALHA': {
        title: 'text-purple-600',
        header: 'from-purple-500 to-purple-600'
      },
      'BRASILEIRA': {
        title: 'text-orange-600',
        header: 'from-orange-500 to-orange-600'
      },
      'LUZILANDIA': {
        title: 'text-teal-600',
        header: 'from-teal-500 to-teal-600'
      },
      'CAXIAS': {
        title: 'text-indigo-600',
        header: 'from-indigo-500 to-indigo-600'
      },
      'PARNAIBA': {
        title: 'text-pink-600',
        header: 'from-pink-500 to-pink-600'
      }
    };
    return colorMap[municipio] || {
      title: 'text-gray-600',
      header: 'from-gray-500 to-gray-600'
    };
  };

  if (loading) {
    return (
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">MUNICÍPIOS</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando notícias dos municípios...</p>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">MUNICÍPIOS</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Nenhuma notícia de município encontrada.</p>
            <p className="text-gray-500 text-sm mt-2">Adicione notícias com categoria de município no dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Título da seção */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">MUNICÍPIOS</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Grid de municípios - 3 colunas, 2 linhas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {municipios.map((municipio, index) => {
            const colors = getColorClasses(municipio.nome);
            const postPrincipal = municipio.posts[0]; // Primeiro post como principal
            const outrosPosts = municipio.posts.slice(1, 4); // Até 3 outros posts
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Header colorido com nome do município */}
                <div className={`bg-gradient-to-r ${colors.header} text-white py-3 px-4`}>
                  <h3 className="font-bold text-lg text-center">{municipio.nome}</h3>
                </div>

                {/* Imagem */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={postPrincipal?.imagemUrl || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop'} 
                    alt={municipio.nome}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  {/* Notícia principal */}
                  {postPrincipal && (
                    <div className="mb-4">
                      <h4 className={`font-bold text-lg mb-2 ${colors.title}`}>
                        {postPrincipal.titulo}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {postPrincipal.subtitulo || postPrincipal.conteudo.substring(0, 100) + '...'}
                      </p>
                    </div>
                  )}

                  {/* Outras notícias em lista */}
                  {outrosPosts.length > 0 && (
                    <div>
                      <ul className="space-y-1">
                        {outrosPosts.map((post, nIndex) => (
                          <li key={nIndex} className="flex items-start">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.header.replace('from-', 'bg-').split(' ')[0]} mt-2 mr-2 flex-shrink-0`}></span>
                            <span className="text-gray-700 text-sm">{post.titulo}</span>
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
