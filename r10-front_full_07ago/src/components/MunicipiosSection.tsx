import React from 'react';

interface Municipio {
  nome: string;
  noticiaPrincipal: {
    titulo: string;
    texto: string;
  };
  outrasNoticias: string[];
  imagem: string;
}

const MunicipiosSection: React.FC = () => {
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
      }
    };
    return colorMap[municipio] || colorMap['PEDRO II'];
  };

  // Dados mock dos municípios conforme imagem fornecida
  const municipios: Municipio[] = [
    {
      nome: 'PEDRO II',
      noticiaPrincipal: {
        titulo: 'Obras de modernização do centro histórico avançam',
        texto: 'A prefeitura municipal inicia nova fase das obras de revitalização do centro histórico, contemplando melhorias na infraestrutura urbana.'
      },
      outrasNoticias: [
        'Festival de Inverno movimenta turismo local',
        'Nova escola municipal será inaugurada',
        'Programa de capacitação profissional'
      ],
      imagem: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop'
    },
    {
      nome: 'CAMPO MAIOR',
      noticiaPrincipal: {
        titulo: 'Expansão do setor industrial gera empregos',
        texto: 'Novo polo industrial da cidade promete gerar mais de 500 empregos diretos nos próximos meses, impulsionando a economia local.'
      },
      outrasNoticias: [
        'Centro de saúde amplia atendimentos',
        'Projeto de agricultura familiar avança',
        'Investimentos em educação técnica'
      ],
      imagem: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=250&fit=crop'
    },
    {
      nome: 'BARRAS',
      noticiaPrincipal: {
        titulo: 'Modernização da agricultura familiar',
        texto: 'Programa de modernização beneficia pequenos produtores rurais com novas tecnologias e equipamentos para aumentar a produtividade.'
      },
      outrasNoticias: [
        'Festival da Cajuína atrai visitantes',
        'Obras de saneamento em andamento',
        'Curso de informática para jovens'
      ],
      imagem: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=250&fit=crop'
    },
    {
      nome: 'ESPERANTINA',
      noticiaPrincipal: {
        titulo: 'Investimentos em infraestrutura urbana',
        texto: 'Cidade recebe significativos investimentos para melhoria da infraestrutura, incluindo pavimentação e sistema de drenagem.'
      },
      outrasNoticias: [
        'Centro cultural será reformado',
        'Programa habitacional avança',
        'Capacitação para empreendedores'
      ],
      imagem: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=250&fit=crop'
    },
    {
      nome: 'BATALHA',
      noticiaPrincipal: {
        titulo: 'Desenvolvimento do turismo ecológico',
        texto: 'Município investe no desenvolvimento sustentável do turismo ecológico, valorizando as belezas naturais da região.'
      },
      outrasNoticias: [
        'Reforma da praça central finalizada',
        'Programa de reflorestamento',
        'Feira de produtos orgânicos'
      ],
      imagem: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop'
    },
    {
      nome: 'BRASILEIRA',
      noticiaPrincipal: {
        titulo: 'Programa de qualificação profissional',
        texto: 'Nova iniciativa oferece cursos de qualificação profissional para jovens e adultos, preparando-os para o mercado de trabalho.'
      },
      outrasNoticias: [
        'Posto de saúde modernizado',
        'Projeto de horta comunitária',
        'Biblioteca municipal renovada'
      ],
      imagem: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=400&h=250&fit=crop'
    }
  ];

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
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Header colorido com nome do município */}
                <div className={`bg-gradient-to-r ${colors.header} text-white py-3 px-4`}>
                  <h3 className="font-bold text-lg text-center">{municipio.nome}</h3>
                </div>

                {/* Imagem */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={municipio.imagem} 
                    alt={municipio.nome}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  {/* Notícia principal */}
                  <div className="mb-4">
                    <h4 className={`font-bold text-lg mb-2 ${colors.title}`}>
                      {municipio.noticiaPrincipal.titulo}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {municipio.noticiaPrincipal.texto}
                    </p>
                  </div>

                  {/* Outras notícias em lista */}
                  <div>
                    <ul className="space-y-1">
                      {municipio.outrasNoticias.map((noticia, nIndex) => (
                        <li key={nIndex} className="flex items-start">
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.header.replace('from-', 'bg-').split(' ')[0]} mt-2 mr-2 flex-shrink-0`}></span>
                          <span className="text-gray-700 text-sm">{noticia}</span>
                        </li>
                      ))}
                    </ul>
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

export default MunicipiosSection;