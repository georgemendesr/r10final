import React, { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  chapeu: string;
  imagemUrl?: string;
  publishedAt: string;
}

interface Municipio {
  nome: string;
  posts: Post[];
}

const MunicipiosSection: React.FC = () => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMunicipiosPosts = async () => {
      try {
        // Buscar todos os posts da seção municípios
        const response = await fetch('http://127.0.0.1:3002/api/posts?posicao=municipios&limit=30');
        const posts: Post[] = await response.json();
        
        // Agrupar posts por município (usando o chapéu)
        const municipiosMap = new Map<string, Post[]>();
        
        posts.forEach(post => {
          const municipioNome = post.chapeu || 'OUTROS';
          if (!municipiosMap.has(municipioNome)) {
            municipiosMap.set(municipioNome, []);
          }
          municipiosMap.get(municipioNome)!.push(post);
        });
        
        // Converter para array e limitar a 6 municípios
        const municipiosArray = Array.from(municipiosMap.entries())
          .map(([nome, posts]) => ({ nome, posts }))
          .slice(0, 6);
        
        setMunicipios(municipiosArray);
      } catch (error) {
        console.error('Erro ao buscar posts de municípios:', error);
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
                        {postPrincipal.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {postPrincipal.subtitle || postPrincipal.content.substring(0, 100) + '...'}
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
                            <span className="text-gray-700 text-sm">{post.title}</span>
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
