#!/usr/bin/env node
/**
 * Script para popular banco SQLite diretamente
 * Insere notícias E banners publicitários
 * Uso: node scripts/seed-completo-sqlite.js [caminho_db]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.argv[2] || path.join(__dirname, '..', 'noticias.db');

console.log(`[seed] Conectando em: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco SQLite');
});

// ========== NOTÍCIAS ==========
const noticias = [
  // SUPERMANCHETE
  {
    titulo: 'Governo do Piauí anuncia investimento de R$ 500 milhões em infraestrutura',
    chapeu: 'Desenvolvimento',
    resumo: 'Recursos serão destinados para pavimentação de rodovias, construção de escolas e hospitais em 12 municípios do interior',
    conteudo: `<p>O governador do Piauí anunciou nesta sexta-feira (4) um pacote de investimentos de R$ 500 milhões para obras de infraestrutura em 12 municípios do interior do estado. O anúncio foi feito durante cerimônia no Palácio de Karnak.</p>
<p>Os recursos serão destinados para pavimentação de rodovias estaduais, construção de três novos hospitais regionais, ampliação de escolas e obras de saneamento básico.</p>
<p>"Este é o maior investimento em infraestrutura dos últimos 10 anos. Vamos transformar a realidade de milhares de piauienses", declarou o governador.</p>
<p>Entre as principais obras estão a pavimentação da PI-113, que liga Piripiri a Piracuruca, e a construção de um hospital regional em Pedro II, que deve atender 15 municípios da região.</p>`,
    autor: 'João Silva',
    categoria: 'politica',
    posicao: 1,
    destaque: 1,
    imagem_url: '/uploads/imagens/governo-investimento.jpg'
  },
  
  // DESTAQUES
  {
    titulo: 'Piripiri recebe primeira indústria de tecnologia do interior',
    chapeu: 'Economia',
    resumo: 'Empresa vai gerar 150 empregos diretos e investir R$ 20 milhões no município',
    conteudo: `<p>Piripiri ganhou sua primeira indústria de tecnologia nesta semana. A empresa TechNorte, especializada em desenvolvimento de software, inaugurou sua sede no distrito industrial da cidade.</p>
<p>A previsão é gerar 150 empregos diretos nos próximos 12 meses, com investimento inicial de R$ 20 milhões em infraestrutura e equipamentos.</p>
<p>"Escolhemos Piripiri pela qualidade de vida, mão de obra qualificada e incentivos fiscais", explicou o CEO da empresa.</p>`,
    autor: 'Maria Santos',
    categoria: 'piripiri',
    posicao: 2,
    destaque: 1,
    imagem_url: '/uploads/imagens/tecnologia-piripiri.jpg'
  },
  {
    titulo: 'Festival de Verão movimenta economia local em 15 municípios',
    chapeu: 'Cultura',
    resumo: 'Evento deve atrair mais de 50 mil visitantes e gerar R$ 10 milhões em receita',
    conteudo: `<p>O Festival de Verão do Piauí, que acontece em 15 municípios simultaneamente, promete movimentar a economia local com shows, feiras gastronômicas e atividades culturais.</p>
<p>A expectativa é receber mais de 50 mil visitantes durante os três dias de evento, gerando cerca de R$ 10 milhões em receita para hotéis, restaurantes e comércio.</p>
<p>A programação inclui apresentações de artistas nacionais e regionais, além de feira de artesanato e gastronomia típica piauiense.</p>`,
    autor: 'Carlos Mendes',
    categoria: 'entretenimento',
    posicao: 3,
    destaque: 1
  },
  {
    titulo: 'Universidade abre inscrições para 500 vagas em cursos gratuitos',
    chapeu: 'Educação',
    resumo: 'Cursos técnicos e de graduação estão disponíveis em Teresina e mais 8 cidades',
    conteudo: `<p>A Universidade Estadual do Piauí (UESPI) abriu inscrições para 500 vagas em cursos gratuitos de graduação e técnicos. As oportunidades estão distribuídas em Teresina e mais 8 cidades do interior.</p>
<p>Entre os cursos oferecidos estão Administração, Enfermagem, Pedagogia, Técnico em Informática e Técnico em Agropecuária.</p>
<p>As inscrições podem ser feitas até o dia 20 de outubro pelo site da universidade.</p>`,
    autor: 'Ana Paula',
    categoria: 'geral',
    posicao: 4,
    destaque: 1
  },
  {
    titulo: 'Operação policial prende 12 suspeitos de tráfico em Teresina',
    chapeu: 'Segurança',
    resumo: 'Apreendidas drogas, armas e veículos em ação coordenada da polícia civil',
    conteudo: `<p>Uma operação da Polícia Civil resultou na prisão de 12 suspeitos de integrar organização criminosa ligada ao tráfico de drogas em Teresina. A ação aconteceu na madrugada desta quinta-feira (3).</p>
<p>Foram apreendidos 50 kg de maconha, 10 kg de cocaína, 5 armas de fogo, 3 veículos e R$ 80 mil em dinheiro.</p>
<p>Segundo a polícia, o grupo atuava há mais de 2 anos no comércio de entorpecentes na zona sul da capital.</p>`,
    autor: 'Roberto Lima',
    categoria: 'policia',
    posicao: 5,
    destaque: 1
  },
  {
    titulo: 'Seleção piauiense de futsal conquista título nacional sub-17',
    chapeu: 'Esporte',
    resumo: 'Time venceu São Paulo por 4 a 2 na final disputada em Brasília',
    conteudo: `<p>A seleção piauiense de futsal sub-17 conquistou o título nacional ao vencer São Paulo por 4 a 2 na grande final disputada em Brasília. Esta é a primeira vez que o Piauí vence a competição nesta categoria.</p>
<p>O destaque da partida foi o pivô João Vitor, que marcou 3 dos 4 gols da equipe e foi eleito o melhor jogador do campeonato.</p>
<p>"É uma conquista histórica para o esporte piauiense", comemorou o técnico da seleção.</p>`,
    autor: 'Fernando Costa',
    categoria: 'esporte',
    posicao: 6,
    destaque: 1
  },

  // NOTÍCIAS GERAIS
  {
    titulo: 'Chuvas atingem 12 municípios do interior do Piauí',
    chapeu: 'Clima',
    resumo: 'Defesa Civil emite alerta para possíveis alagamentos nas próximas 48 horas',
    conteudo: `<p>Fortes chuvas atingiram 12 municípios do interior do Piauí nas últimas 24 horas. A Defesa Civil estadual emitiu alerta para possíveis alagamentos e deslizamentos de terra.</p>
<p>As cidades mais afetadas são Piripiri, Pedro II e Campo Maior, onde foram registrados acumulados de até 120mm.</p>`,
    autor: 'Paula Rodrigues',
    categoria: 'geral',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Preço da gasolina cai 5% em postos de Teresina',
    chapeu: 'Economia',
    resumo: 'Redução reflete queda no preço do petróleo no mercado internacional',
    conteudo: `<p>O preço da gasolina caiu em média 5% nos postos de Teresina esta semana. O litro, que estava custando R$ 5,89, agora pode ser encontrado por R$ 5,59 em alguns estabelecimentos.</p>
<p>A redução reflete a queda no preço do petróleo no mercado internacional e a diminuição de tributos estaduais.</p>`,
    autor: 'Marcos Oliveira',
    categoria: 'geral',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Hospital Regional de Picos amplia leitos de UTI',
    chapeu: 'Saúde',
    resumo: 'Unidade passa de 10 para 20 leitos, reduzindo fila de espera',
    conteudo: `<p>O Hospital Regional de Picos inaugurou 10 novos leitos de UTI, dobrando a capacidade de atendimento. A ampliação deve reduzir significativamente a fila de espera por vagas.</p>
<p>O investimento foi de R$ 5 milhões, recursos do governo estadual e federal.</p>`,
    autor: 'Juliana Barros',
    categoria: 'geral',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Feira de artesanato reúne 200 expositores em Parnaíba',
    chapeu: 'Cultura',
    resumo: 'Evento acontece no fim de semana e tem entrada gratuita',
    conteudo: `<p>A 15ª Feira de Artesanato de Parnaíba reúne 200 expositores de todo o estado. O evento acontece no Parque Nacional da Lagoa do Portinho e tem entrada gratuita.</p>
<p>Serão expostos produtos como cerâmica, tecelagem, bijuterias e gastronomia típica piauiense.</p>`,
    autor: 'Ricardo Alves',
    categoria: 'entretenimento',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Concurso público oferece 300 vagas para professores',
    chapeu: 'Emprego',
    resumo: 'Inscrições começam na próxima semana com salários de até R$ 5 mil',
    conteudo: `<p>A Secretaria de Educação do Piauí lançou edital de concurso público com 300 vagas para professores da rede estadual. As inscrições começam na próxima segunda-feira (7).</p>
<p>Os salários variam de R$ 3.500 a R$ 5.000, dependendo da carga horária e formação.</p>`,
    autor: 'Beatriz Lima',
    categoria: 'geral',
    posicao: 0,
    destaque: 0
  },

  // MUNICÍPIOS
  {
    titulo: 'Pedro II recebe obras de pavimentação no centro histórico',
    chapeu: 'Infraestrutura',
    resumo: 'Investimento de R$ 2 milhões vai beneficiar comércio local',
    conteudo: `<p>Pedro II iniciou obras de pavimentação e revitalização do centro histórico. O investimento é de R$ 2 milhões e deve ser concluído em 6 meses.</p>
<p>As obras incluem nova iluminação, calçadas acessíveis e paisagismo.</p>`,
    autor: 'Antônio Sousa',
    categoria: 'pedro-ii',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Piracuruca inaugura novo mercado público',
    chapeu: 'Comércio',
    resumo: 'Espaço moderno tem 80 boxes para comerciantes',
    conteudo: `<p>Piracuruca inaugurou seu novo mercado público com estrutura moderna e 80 boxes para comerciantes. O investimento foi de R$ 1,5 milhão.</p>
<p>O espaço conta com refrigeração, estacionamento e praça de alimentação.</p>`,
    autor: 'Carla Mendes',
    categoria: 'piracuruca',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Campo Maior realiza tradicional Festa do Bode',
    chapeu: 'Tradição',
    resumo: 'Evento celebra 30 anos e espera público de 10 mil pessoas',
    conteudo: `<p>Campo Maior se prepara para a 30ª edição da tradicional Festa do Bode, que acontece no próximo fim de semana. A expectativa é receber 10 mil visitantes.</p>
<p>A programação inclui shows, concurso de melhor bode e gastronomia típica.</p>`,
    autor: 'José Carlos',
    categoria: 'campo-maior',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Barras investe em turismo rural com novas trilhas ecológicas',
    chapeu: 'Turismo',
    resumo: 'Projeto quer atrair visitantes para belezas naturais do município',
    conteudo: `<p>Barras lançou projeto de turismo rural com criação de trilhas ecológicas e capacitação de guias locais. O objetivo é atrair turistas para as belezas naturais da região.</p>
<p>As trilhas passam por cachoeiras, fazendas históricas e áreas de preservação.</p>`,
    autor: 'Sandra Martins',
    categoria: 'barras',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Esperantina comemora safra recorde de soja',
    chapeu: 'Agronegócio',
    resumo: 'Produção aumentou 30% em relação ao ano passado',
    conteudo: `<p>Esperantina celebra safra recorde de soja com aumento de 30% na produção em relação ao ano anterior. O município se consolida como um dos maiores produtores do estado.</p>
<p>O crescimento é atribuído a investimentos em tecnologia e clima favorável.</p>`,
    autor: 'Miguel Santos',
    categoria: 'esperantina',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Batalha recebe unidade móvel de mamografia',
    chapeu: 'Saúde',
    resumo: 'Ação oferece exames gratuitos para mulheres acima de 40 anos',
    conteudo: `<p>Batalha recebeu unidade móvel de mamografia que vai ofertar exames gratuitos para mulheres acima de 40 anos. A ação é parte da campanha Outubro Rosa.</p>
<p>Os atendimentos acontecem na Praça da Matriz durante toda a semana.</p>`,
    autor: 'Lucia Ferreira',
    categoria: 'batalha',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Cocal moderniza sistema de abastecimento de água',
    chapeu: 'Saneamento',
    resumo: 'Obra vai beneficiar 15 mil moradores',
    conteudo: `<p>Cocal está modernizando seu sistema de abastecimento de água com investimento de R$ 3 milhões. A obra vai beneficiar 15 mil moradores e reduzir perdas na rede.</p>
<p>O projeto inclui nova estação de tratamento e substituição de 10 km de tubulações.</p>`,
    autor: 'Paulo Henrique',
    categoria: 'cocal',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Buriti dos Lopes ganha Centro de Referência da Assistência Social',
    chapeu: 'Assistência',
    resumo: 'Equipamento vai atender famílias em situação de vulnerabilidade',
    conteudo: `<p>Buriti dos Lopes inaugurou seu Centro de Referência da Assistência Social (CRAS) que vai atender famílias em situação de vulnerabilidade social.</p>
<p>O espaço oferece serviços de assistência social, psicologia e capacitação profissional.</p>`,
    autor: 'Mariana Costa',
    categoria: 'buriti-dos-lopes',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Brasileira recebe investimento em energia solar',
    chapeu: 'Sustentabilidade',
    resumo: 'Prédios públicos terão painéis fotovoltaicos instalados',
    conteudo: `<p>Brasileira vai receber investimento em energia solar com instalação de painéis fotovoltaicos em prédios públicos. A expectativa é reduzir em 40% os gastos com energia elétrica.</p>
<p>O projeto piloto começa pela prefeitura e escolas municipais.</p>`,
    autor: 'Eduardo Silva',
    categoria: 'brasileira',
    posicao: 0,
    destaque: 0
  },
  {
    titulo: 'Lagoa de São Francisco promove festival de pesca esportiva',
    chapeu: 'Esporte',
    resumo: 'Competição deve atrair 200 pescadores de vários estados',
    conteudo: `<p>Lagoa de São Francisco realizará no próximo mês o 5º Festival de Pesca Esportiva. A competição deve atrair 200 pescadores de vários estados.</p>
<p>Além do torneio, haverá shows, feira gastronômica e atividades para toda a família.</p>`,
    autor: 'Rafael Oliveira',
    categoria: 'lagoa-de-sao-francisco',
    posicao: 0,
    destaque: 0
  }
];

// ========== BANNERS PUBLICITÁRIOS ==========
const banners = [
  // Topo da página
  {
    titulo: 'Banner Supermercado Economix - Topo',
    cliente: 'Supermercado Economix',
    link: 'https://exemplo.com/economix',
    posicao: 'topo',
    tipo: 'imagem',
    tamanho: '970x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 5,
    conteudo_html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;"><h2>🛒 ECONOMIX - Ofertas Imperdíveis!</h2><p>Até 50% OFF em todos os departamentos</p></div>'
  },
  {
    titulo: 'Banner Loja TechPi - Topo',
    cliente: 'TechPi Informática',
    link: 'https://exemplo.com/techpi',
    posicao: 'topo',
    tipo: 'imagem',
    tamanho: '970x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 4,
    conteudo_html: '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center; color: white;"><h2>💻 TechPi - Tecnologia em Piripiri</h2><p>Notebooks, Celulares e Games - Parcele em 12x</p></div>'
  },
  
  // Sidebar direita
  {
    titulo: 'Banner Farmácia Saúde Total - Sidebar',
    cliente: 'Farmácia Saúde Total',
    link: 'https://exemplo.com/saudetotal',
    posicao: 'sidebar',
    tipo: 'imagem',
    tamanho: '300x250',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 5,
    conteudo_html: '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 15px; text-align: center; color: white; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>💊 Farmácia Saúde Total</h3><p>Medicamentos e Perfumaria</p><strong>Entrega Grátis!</strong></div>'
  },
  {
    titulo: 'Banner Pizzaria Bella Massa - Sidebar',
    cliente: 'Pizzaria Bella Massa',
    link: 'https://exemplo.com/bellamassa',
    posicao: 'sidebar',
    tipo: 'imagem',
    tamanho: '300x250',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 4,
    conteudo_html: '<div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 15px; text-align: center; color: #333; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>🍕 Bella Massa</h3><p>As melhores pizzas da cidade!</p><strong>Peça pelo WhatsApp</strong></div>'
  },
  {
    titulo: 'Banner Auto Peças Piauí - Sidebar',
    cliente: 'Auto Peças Piauí',
    link: 'https://exemplo.com/autopecas',
    posicao: 'sidebar',
    tipo: 'imagem',
    tamanho: '300x250',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 3,
    conteudo_html: '<div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 15px; text-align: center; color: white; height: 250px; display: flex; flex-direction: column; justify-content: center;"><h3>🚗 Auto Peças Piauí</h3><p>Peças originais e multimarcas</p><strong>Tudo para seu carro</strong></div>'
  },
  
  // Meio do conteúdo
  {
    titulo: 'Banner Móveis Design - Meio Conteúdo',
    cliente: 'Móveis Design',
    link: 'https://exemplo.com/moveisdesign',
    posicao: 'meio-conteudo',
    tipo: 'imagem',
    tamanho: '728x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 5,
    conteudo_html: '<div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 15px; text-align: center; color: #333;"><h3>🛋️ Móveis Design - Sua casa mais linda!</h3><p>Sofás, Camas e Estantes - Promoção de Outubro</p></div>'
  },
  {
    titulo: 'Banner Clínica OdontoVida - Meio Conteúdo',
    cliente: 'Clínica OdontoVida',
    link: 'https://exemplo.com/odontovida',
    posicao: 'meio-conteudo',
    tipo: 'imagem',
    tamanho: '728x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 4,
    conteudo_html: '<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 15px; text-align: center; color: #333;"><h3>😁 OdontoVida - Seu sorriso perfeito!</h3><p>Consultas, Limpeza e Clareamento - Agende Agora</p></div>'
  },
  
  // Rodapé
  {
    titulo: 'Banner Construtora Forte - Rodapé',
    cliente: 'Construtora Forte',
    link: 'https://exemplo.com/construtoraforte',
    posicao: 'rodape',
    tipo: 'imagem',
    tamanho: '970x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 5,
    conteudo_html: '<div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 20px; text-align: center; color: #333;"><h2>🏗️ Construtora Forte</h2><p>Construindo sonhos há 20 anos - Apartamentos e Casas</p></div>'
  },
  {
    titulo: 'Banner Faculdade Unifuturo - Rodapé',
    cliente: 'Faculdade Unifuturo',
    link: 'https://exemplo.com/unifuturo',
    posicao: 'rodape',
    tipo: 'imagem',
    tamanho: '970x90',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 4,
    conteudo_html: '<div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 20px; text-align: center; color: #333;"><h2>🎓 Unifuturo - Seu futuro começa aqui</h2><p>Graduação e Pós-Graduação EAD e Presencial - Inscrições Abertas</p></div>'
  },
  
  // Entre matérias
  {
    titulo: 'Banner Academia FitLife - Entre Matérias',
    cliente: 'Academia FitLife',
    link: 'https://exemplo.com/fitlife',
    posicao: 'entre-materias',
    tipo: 'imagem',
    tamanho: '336x280',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 5,
    conteudo_html: '<div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); padding: 20px; text-align: center; color: white; height: 280px; display: flex; flex-direction: column; justify-content: center;"><h3>💪 FitLife Academia</h3><p>Musculação, Crossfit e Funcional</p><strong>1º Mês Grátis!</strong></div>'
  },
  {
    titulo: 'Banner Pet Shop Amigo Fiel - Entre Matérias',
    cliente: 'Pet Shop Amigo Fiel',
    link: 'https://exemplo.com/amigofiel',
    posicao: 'entre-materias',
    tipo: 'imagem',
    tamanho: '336x280',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 4,
    conteudo_html: '<div style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); padding: 20px; text-align: center; color: #333; height: 280px; display: flex; flex-direction: column; justify-content: center;"><h3>🐶 Pet Shop Amigo Fiel</h3><p>Banho, Tosa e Ração</p><strong>Delivery Pet</strong></div>'
  },
  {
    titulo: 'Banner Advocacia & Consultoria - Entre Matérias',
    cliente: 'Silva & Associados Advocacia',
    link: 'https://exemplo.com/silvaadvocacia',
    posicao: 'entre-materias',
    tipo: 'imagem',
    tamanho: '336x280',
    status: 'ativo',
    data_inicio: '2025-10-01',
    data_fim: '2025-12-31',
    prioridade: 3,
    conteudo_html: '<div style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); padding: 20px; text-align: center; color: #333; height: 280px; display: flex; flex-direction: column; justify-content: center;"><h3>⚖️ Silva & Associados</h3><p>Direito Civil, Trabalhista e Previdenciário</p><strong>Consulta Gratuita</strong></div>'
  }
];

// ========== FUNÇÕES DE INSERÇÃO ==========

function inserirNoticias() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO noticias (
        titulo, chapeu, resumo, conteudo, autor, categoria, 
        posicao, destaque, imagem_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    let inseridos = 0;
    for (const n of noticias) {
      stmt.run(
        n.titulo,
        n.chapeu,
        n.resumo,
        n.conteudo,
        n.autor,
        n.categoria,
        n.posicao,
        n.destaque,
        n.imagem_url || null,
        (err) => {
          if (err) console.error(`❌ Erro ao inserir notícia: ${n.titulo}`, err.message);
          else {
            inseridos++;
            console.log(`✅ [${inseridos}/${noticias.length}] ${n.titulo.substring(0, 60)}...`);
          }
        }
      );
    }

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve(inseridos);
    });
  });
}

function inserirBanners() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO banners (
        titulo, cliente, link, posicao, tipo, tamanho, status,
        data_inicio, data_fim, prioridade, conteudo_html,
        impressoes_atuais, cliques_atuais,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))
    `);

    let inseridos = 0;
    for (const b of banners) {
      stmt.run(
        b.titulo,
        b.cliente,
        b.link,
        b.posicao,
        b.tipo,
        b.tamanho,
        b.status,
        b.data_inicio,
        b.data_fim,
        b.prioridade,
        b.conteudo_html,
        (err) => {
          if (err) console.error(`❌ Erro ao inserir banner: ${b.titulo}`, err.message);
          else {
            inseridos++;
            console.log(`✅ [${inseridos}/${banners.length}] ${b.titulo}`);
          }
        }
      );
    }

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve(inseridos);
    });
  });
}

// ========== EXECUÇÃO ==========

async function seed() {
  try {
    console.log('\n📰 Inserindo notícias...');
    const qtdNoticias = await inserirNoticias();
    
    console.log('\n📢 Inserindo banners publicitários...');
    const qtdBanners = await inserirBanners();
    
    console.log('\n✅ CONCLUÍDO!');
    console.log(`📰 Notícias inseridas: ${qtdNoticias}`);
    console.log(`📢 Banners inseridos: ${qtdBanners}`);
    
    db.close((err) => {
      if (err) console.error('Erro ao fechar banco:', err.message);
      else console.log('\n✅ Banco fechado com sucesso');
    });
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    process.exit(1);
  }
}

seed();
