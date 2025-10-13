require('dotenv').config();
const db = require('./db');

const noticiasExemplo = [
  {
    titulo: "Governador anuncia investimentos em infraestrutura para o interior do Piauí",
    conteudo: "O governador do Piauí anunciou nesta segunda-feira um pacote de investimentos em infraestrutura voltado para as cidades do interior do estado. O plano prevê a recuperação de estradas vicinais, construção de pontes e melhorias no abastecimento de água em mais de 50 municípios. Os recursos, que somam R$ 150 milhões, serão distribuídos ao longo dos próximos dois anos. A iniciativa visa reduzir as desigualdades regionais e estimular o desenvolvimento econômico das áreas mais afastadas da capital.",
    imagem: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    autor: "Redação R10",
    categoria: "Política"
  },
  {
    titulo: "Teresina registra recorde de temperatura e população busca alívio em parques",
    conteudo: "A capital piauiense registrou nesta terça-feira a temperatura mais alta do ano, com termômetros marcando 41°C à sombra. A população buscou refúgio em parques, shoppings e centros comerciais com ar condicionado. Especialistas alertam para a necessidade de hidratação constante e cuidados com a exposição solar prolongada. A previsão é de que as altas temperaturas permaneçam pelos próximos dias, com possibilidade de chuvas isoladas apenas no final da semana.",
    imagem: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800",
    autor: "Maria Silva",
    categoria: "Clima"
  },
  {
    titulo: "Produção de mel no Piauí cresce 30% e ganha destaque nacional",
    conteudo: "A apicultura piauiense vive um momento de expansão, com crescimento de 30% na produção de mel em relação ao ano anterior. O estado figura entre os principais produtores do Nordeste, com destaque para a qualidade do mel orgânico produzido por pequenos agricultores. Cooperativas locais estão investindo em tecnologia e capacitação para ampliar ainda mais a produção e conquistar novos mercados, inclusive internacionais.",
    imagem: "https://images.unsplash.com/photo-1587049352846-4a222e784442?w=800",
    autor: "João Santos",
    categoria: "Economia"
  },
  {
    titulo: "Hospital Regional de Parnaíba recebe novos equipamentos de UTI",
    conteudo: "O Hospital Regional de Parnaíba foi contemplado com novos equipamentos para a Unidade de Terapia Intensiva, incluindo respiradores de última geração e monitores multiparamétricos. O investimento, da ordem de R$ 2 milhões, faz parte de um programa estadual de modernização da rede hospitalar. A expectativa é que os novos equipamentos melhorem significativamente o atendimento aos pacientes em estado grave na região norte do estado.",
    imagem: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800",
    autor: "Ana Costa",
    categoria: "Saúde"
  },
  {
    titulo: "Festival de arte e cultura movimenta centro histórico de Oeiras",
    conteudo: "O município de Oeiras, primeira capital do Piauí, recebeu centenas de visitantes durante o Festival de Arte e Cultura que aconteceu no último fim de semana. O evento contou com apresentações musicais, exposições de artesanato local, teatro de rua e gastronomia típica. A iniciativa busca valorizar o patrimônio histórico da cidade e fomentar o turismo cultural na região.",
    imagem: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    autor: "Pedro Almeida",
    categoria: "Cultura"
  },
  {
    titulo: "Universidade estadual abre 500 vagas em cursos gratuitos de capacitação",
    conteudo: "A Universidade Estadual do Piauí anunciou a abertura de inscrições para 500 vagas em cursos gratuitos de capacitação profissional. As áreas contempladas incluem informática, gestão empresarial, idiomas e tecnologia. As aulas serão ministradas em formato híbrido, com atividades presenciais e online, permitindo maior flexibilidade para os estudantes. As inscrições podem ser realizadas através do site da instituição até o final do mês.",
    imagem: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    autor: "Carla Mendes",
    categoria: "Educação"
  },
  {
    titulo: "Agricultores piauienses recebem orientação sobre técnicas sustentáveis",
    conteudo: "Mais de 200 agricultores de diversas regiões do Piauí participaram de um workshop sobre técnicas agrícolas sustentáveis promovido pela Secretaria de Agricultura. O evento abordou temas como manejo do solo, aproveitamento de água da chuva, agricultura orgânica e agroecologia. Técnicos apresentaram casos de sucesso e distribuíram material informativo para auxiliar os produtores na adoção de práticas mais sustentáveis.",
    imagem: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800",
    autor: "Roberto Lima",
    categoria: "Agronegócio"
  },
  {
    titulo: "Time piauiense conquista título estadual de futsal após 10 anos",
    conteudo: "O Tiradentes Esporte Clube conquistou o título estadual de futsal após uma década de espera. A vitória veio na final disputada contra o River Atlético Clube, com placar de 4 a 2. A torcida lotou o ginásio poliesportivo de Teresina para acompanhar a partida decisiva. O técnico da equipe destacou o trabalho de preparação e a dedicação dos atletas ao longo da temporada.",
    imagem: "https://images.unsplash.com/photo-1571502629382-af3b5f8f6a8e?w=800",
    autor: "Lucas Ferreira",
    categoria: "Esportes"
  },
  {
    titulo: "Projeto leva assistência jurídica gratuita para comunidades carentes",
    conteudo: "Um projeto da Defensoria Pública do Estado está levando assistência jurídica gratuita para comunidades carentes em diversos municípios piauienses. A iniciativa oferece orientação sobre direitos trabalhistas, previdenciários, familiares e de consumo. Nos primeiros três meses, mais de mil atendimentos foram realizados, beneficiando famílias que antes não tinham acesso a esse tipo de serviço.",
    imagem: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
    autor: "Juliana Rocha",
    categoria: "Cidadania"
  },
  {
    titulo: "Parque Nacional da Serra da Capivara recebe nova sinalização turística",
    conteudo: "O Parque Nacional da Serra da Capivara, patrimônio mundial da UNESCO, recebeu nova sinalização turística para facilitar a visitação. Placas informativas em português e inglês foram instaladas nos principais pontos de interesse, incluindo sítios arqueológicos e trilhas ecológicas. A medida visa melhorar a experiência dos visitantes e preservar o patrimônio cultural e natural da região.",
    imagem: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
    autor: "Marcos Oliveira",
    categoria: "Turismo"
  },
  {
    titulo: "Feira de tecnologia reúne startups piauienses em Teresina",
    conteudo: "A primeira Feira de Tecnologia e Inovação do Piauí reuniu mais de 30 startups locais no centro de convenções de Teresina. O evento promoveu networking entre empreendedores, investidores e representantes do poder público. Soluções inovadoras nas áreas de educação, saúde, agronegócio e finanças foram apresentadas, demonstrando o potencial do ecossistema tecnológico do estado.",
    imagem: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    autor: "Patrícia Moura",
    categoria: "Tecnologia"
  },
  {
    titulo: "Campanha de vacinação contra gripe atinge 75% do público-alvo no Piauí",
    conteudo: "A campanha de vacinação contra a gripe atingiu 75% do público-alvo no Piauí, segundo balanço divulgado pela Secretaria de Saúde. Idosos, crianças, gestantes e profissionais de saúde foram priorizados na imunização. As autoridades sanitárias reforçam a importância da vacina para prevenir complicações da doença, especialmente em grupos de risco. A campanha segue até o final do mês em todos os municípios.",
    imagem: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800",
    autor: "Fernanda Souza",
    categoria: "Saúde"
  },
  {
    titulo: "Artesãos piauienses participam de feira nacional em São Paulo",
    conteudo: "Uma comitiva de artesãos piauienses está participando da maior feira de artesanato do país, em São Paulo. Os produtos levados incluem cerâmicas, bordados, tecelagem e peças em couro, todas representativas da cultura local. A participação no evento é vista como oportunidade de divulgação e comercialização dos trabalhos em um mercado mais amplo, gerando renda para as comunidades produtoras.",
    imagem: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
    autor: "Ricardo Barros",
    categoria: "Cultura"
  },
  {
    titulo: "Prefeitura de Floriano anuncia reforma de praças e áreas de lazer",
    conteudo: "A Prefeitura de Floriano anunciou o início das obras de reforma de cinco praças e áreas de lazer da cidade. O projeto inclui nova iluminação LED, equipamentos de ginástica ao ar livre, playground infantil e paisagismo. Os investimentos somam R$ 800 mil e as obras devem ser concluídas em quatro meses. A iniciativa visa proporcionar mais qualidade de vida aos moradores.",
    imagem: "https://images.unsplash.com/photo-1598982261597-039aca1b8d60?w=800",
    autor: "Amanda Carvalho",
    categoria: "Cidades"
  },
  {
    titulo: "Polo de confecções de Picos gera 500 novos empregos no semestre",
    conteudo: "O polo de confecções de Picos gerou 500 novos postos de trabalho no primeiro semestre do ano. O crescimento é atribuído ao aumento da demanda por produtos da região e à expansão de empresas locais. O setor é um dos principais empregadores do município e movimenta a economia da região centro-sul do estado. Cursos de capacitação têm sido oferecidos para qualificar a mão de obra.",
    imagem: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    autor: "Bruno Teixeira",
    categoria: "Economia"
  },
  {
    titulo: "Estudantes piauienses conquistam medalhas em olimpíada de matemática",
    conteudo: "Estudantes de escolas públicas do Piauí conquistaram 12 medalhas na Olimpíada Brasileira de Matemática. O desempenho é considerado o melhor dos últimos cinco anos e reflete o trabalho de preparação desenvolvido por professores e coordenadores. Os alunos premiados receberão certificados e bolsas de estudo para cursos preparatórios. A notícia foi comemorada pelas comunidades escolares de todo o estado.",
    imagem: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800",
    autor: "Cristina Moreira",
    categoria: "Educação"
  },
  {
    titulo: "Barragem no sul do Piauí alcança capacidade máxima após período chuvoso",
    conteudo: "A barragem de Bocaina, localizada no sul do Piauí, atingiu sua capacidade máxima após o período chuvoso. O reservatório é fundamental para o abastecimento de água de vários municípios da região e para a irrigação de áreas agrícolas. Técnicos monitoram constantemente o nível da barragem e o sistema de comportas para garantir a segurança da estrutura e das comunidades do entorno.",
    imagem: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800",
    autor: "Renato Campos",
    categoria: "Meio Ambiente"
  },
  {
    titulo: "Festival gastronômico valoriza culinária típica piauiense",
    conteudo: "O Festival Gastronômico do Piauí reuniu chefs e cozinheiros para celebrar a culinária típica do estado. Pratos como maria-izabel, paçoca de carne de sol, arroz de capote e doces tradicionais foram destaques do evento. Restaurantes participantes ofereceram menus especiais durante uma semana, atraindo turistas e moradores interessados em conhecer os sabores locais. A iniciativa promove a cultura alimentar piauiense.",
    imagem: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    autor: "Beatriz Andrade",
    categoria: "Gastronomia"
  },
  {
    titulo: "Programa estadual distribui mudas de árvores nativas para reflorestamento",
    conteudo: "O programa estadual de reflorestamento distribuiu 10 mil mudas de árvores nativas para proprietários rurais e comunidades de todo o Piauí. Entre as espécies disponíveis estão ipê, jatobá, aroeira e pequizeiro. A iniciativa visa recuperar áreas degradadas, proteger nascentes e contribuir para o equilíbrio ambiental. Técnicos ambientais orientam sobre o plantio e os cuidados necessários para o desenvolvimento das mudas.",
    imagem: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    autor: "Gabriel Martins",
    categoria: "Meio Ambiente"
  },
  {
    titulo: "Biblioteca comunitária é inaugurada em bairro periférico de Teresina",
    conteudo: "Uma biblioteca comunitária foi inaugurada no bairro Parque Piauí, zona sul de Teresina. O espaço conta com acervo de mais de 2 mil livros, sala de leitura, computadores com acesso à internet e programação cultural. A iniciativa é fruto de parceria entre moradores, ONGs e poder público. A biblioteca visa democratizar o acesso à cultura e incentivar o hábito da leitura, especialmente entre crianças e jovens da comunidade.",
    imagem: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800",
    autor: "Larissa Fonseca",
    categoria: "Cultura"
  }
];

console.log('🌱 Iniciando seed do banco de dados...\n');

// Aguardar 1 segundo para garantir que a tabela foi criada
setTimeout(() => {
  const insertSQL = `
    INSERT INTO noticias (titulo, conteudo, imagem, autor, categoria, views)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  let inserted = 0;
  let errors = 0;

  noticiasExemplo.forEach((noticia, index) => {
  const views = Math.floor(Math.random() * 5000); // Views aleatórias entre 0 e 5000
  
  db.run(insertSQL, [
    noticia.titulo,
    noticia.conteudo,
    noticia.imagem,
    noticia.autor,
    noticia.categoria,
    views
  ], (err) => {
    if (err) {
      console.error(`❌ Erro ao inserir notícia ${index + 1}:`, err.message);
      errors++;
    } else {
      inserted++;
      console.log(`✅ Notícia ${index + 1} inserida: ${noticia.titulo.substring(0, 50)}...`);
    }

    // Se processou todas, mostrar resumo e fechar conexão
    if (inserted + errors === noticiasExemplo.length) {
      console.log(`\n📊 Resumo:`);
      console.log(`   ✅ Inseridas: ${inserted}`);
      console.log(`   ❌ Erros: ${errors}`);
      console.log(`\n🎉 Seed concluído!\n`);
      
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar conexão:', err.message);
        }
        process.exit(0);
      });
    }
  });
});
