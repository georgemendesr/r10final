#!/usr/bin/env node
/**
 * Script para popular banco SQLite com notícias de exemplo
 * Uso: node scripts/seed-noticias.js [URL_API]
 * Exemplo: node scripts/seed-noticias.js https://r10piaui.onrender.com
 */

const https = require('https');
const http = require('http');

const API_URL = process.argv[2] || 'http://localhost:3002';
const BASE_URL = API_URL.replace(/\/$/, '');

console.log(`[seed] Populando banco em: ${BASE_URL}`);

// Dados de notícias realistas do Piauí
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
    posicao: 'supermanchete',
    imagem_url: '/uploads/imagens/governo-investimento.jpg',
    destaque: true
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
    posicao: 'destaque',
    imagem_url: '/uploads/imagens/tecnologia-piripiri.jpg',
    destaque: true
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
    posicao: 'destaque',
    destaque: true
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
    posicao: 'destaque',
    destaque: true
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
    posicao: 'destaque',
    destaque: true
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
    posicao: 'destaque',
    destaque: true
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
    posicao: 'geral'
  },
  {
    titulo: 'Preço da gasolina cai 5% em postos de Teresina',
    chapeu: 'Economia',
    resumo: 'Redução reflete queda no preço do petróleo no mercado internacional',
    conteudo: `<p>O preço da gasolina caiu em média 5% nos postos de Teresina esta semana. O litro, que estava custando R$ 5,89, agora pode ser encontrado por R$ 5,59 em alguns estabelecimentos.</p>
<p>A redução reflete a queda no preço do petróleo no mercado internacional e a diminuição de tributos estaduais.</p>`,
    autor: 'Marcos Oliveira',
    categoria: 'geral',
    posicao: 'geral'
  },
  {
    titulo: 'Hospital Regional de Picos amplia leitos de UTI',
    chapeu: 'Saúde',
    resumo: 'Unidade passa de 10 para 20 leitos, reduzindo fila de espera',
    conteudo: `<p>O Hospital Regional de Picos inaugurou 10 novos leitos de UTI, dobrando a capacidade de atendimento. A ampliação deve reduzir significativamente a fila de espera por vagas.</p>
<p>O investimento foi de R$ 5 milhões, recursos do governo estadual e federal.</p>`,
    autor: 'Juliana Barros',
    categoria: 'geral',
    posicao: 'geral'
  },
  {
    titulo: 'Feira de artesanato reúne 200 expositores em Parnaíba',
    chapeu: 'Cultura',
    resumo: 'Evento acontece no fim de semana e tem entrada gratuita',
    conteudo: `<p>A 15ª Feira de Artesanato de Parnaíba reúne 200 expositores de todo o estado. O evento acontece no Parque Nacional da Lagoa do Portinho e tem entrada gratuita.</p>
<p>Serão expostos produtos como cerâmica, tecelagem, bijuterias e gastronomia típica piauiense.</p>`,
    autor: 'Ricardo Alves',
    categoria: 'entretenimento',
    posicao: 'geral'
  },
  {
    titulo: 'Concurso público oferece 300 vagas para professores',
    chapeu: 'Emprego',
    resumo: 'Inscrições começam na próxima semana com salários de até R$ 5 mil',
    conteudo: `<p>A Secretaria de Educação do Piauí lançou edital de concurso público com 300 vagas para professores da rede estadual. As inscrições começam na próxima segunda-feira (7).</p>
<p>Os salários variam de R$ 3.500 a R$ 5.000, dependendo da carga horária e formação.</p>`,
    autor: 'Beatriz Lima',
    categoria: 'geral',
    posicao: 'geral'
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
    posicao: 'geral'
  },
  {
    titulo: 'Piracuruca inaugura novo mercado público',
    chapeu: 'Comércio',
    resumo: 'Espaço moderno tem 80 boxes para comerciantes',
    conteudo: `<p>Piracuruca inaugurou seu novo mercado público com estrutura moderna e 80 boxes para comerciantes. O investimento foi de R$ 1,5 milhão.</p>
<p>O espaço conta com refrigeração, estacionamento e praça de alimentação.</p>`,
    autor: 'Carla Mendes',
    categoria: 'piracuruca',
    posicao: 'geral'
  },
  {
    titulo: 'Campo Maior realiza tradicional Festa do Bode',
    chapeu: 'Tradição',
    resumo: 'Evento celebra 30 anos e espera público de 10 mil pessoas',
    conteudo: `<p>Campo Maior se prepara para a 30ª edição da tradicional Festa do Bode, que acontece no próximo fim de semana. A expectativa é receber 10 mil visitantes.</p>
<p>A programação inclui shows, concurso de melhor bode e gastronomia típica.</p>`,
    autor: 'José Carlos',
    categoria: 'campo-maior',
    posicao: 'geral'
  },
  {
    titulo: 'Barras investe em turismo rural com novas trilhas ecológicas',
    chapeu: 'Turismo',
    resumo: 'Projeto quer atrair visitantes para belezas naturais do município',
    conteudo: `<p>Barras lançou projeto de turismo rural com criação de trilhas ecológicas e capacitação de guias locais. O objetivo é atrair turistas para as belezas naturais da região.</p>
<p>As trilhas passam por cachoeiras, fazendas históricas e áreas de preservação.</p>`,
    autor: 'Sandra Martins',
    categoria: 'barras',
    posicao: 'geral'
  },
  {
    titulo: 'Esperantina comemora safra recorde de soja',
    chapeu: 'Agronegócio',
    resumo: 'Produção aumentou 30% em relação ao ano passado',
    conteudo: `<p>Esperantina celebra safra recorde de soja com aumento de 30% na produção em relação ao ano anterior. O município se consolida como um dos maiores produtores do estado.</p>
<p>O crescimento é atribuído a investimentos em tecnologia e clima favorável.</p>`,
    autor: 'Miguel Santos',
    categoria: 'esperantina',
    posicao: 'geral'
  },
  {
    titulo: 'Batalha recebe unidade móvel de mamografia',
    chapeu: 'Saúde',
    resumo: 'Ação oferece exames gratuitos para mulheres acima de 40 anos',
    conteudo: `<p>Batalha recebeu unidade móvel de mamografia que vai ofertar exames gratuitos para mulheres acima de 40 anos. A ação é parte da campanha Outubro Rosa.</p>
<p>Os atendimentos acontecem na Praça da Matriz durante toda a semana.</p>`,
    autor: 'Lucia Ferreira',
    categoria: 'batalha',
    posicao: 'geral'
  },
  {
    titulo: 'Cocal moderniza sistema de abastecimento de água',
    chapeu: 'Saneamento',
    resumo: 'Obra vai beneficiar 15 mil moradores',
    conteudo: `<p>Cocal está modernizando seu sistema de abastecimento de água com investimento de R$ 3 milhões. A obra vai beneficiar 15 mil moradores e reduzir perdas na rede.</p>
<p>O projeto inclui nova estação de tratamento e substituição de 10 km de tubulações.</p>`,
    autor: 'Paulo Henrique',
    categoria: 'cocal',
    posicao: 'geral'
  },
  {
    titulo: 'Buriti dos Lopes ganha Centro de Referência da Assistência Social',
    chapeu: 'Assistência',
    resumo: 'Equipamento vai atender famílias em situação de vulnerabilidade',
    conteudo: `<p>Buriti dos Lopes inaugurou seu Centro de Referência da Assistência Social (CRAS) que vai atender famílias em situação de vulnerabilidade social.</p>
<p>O espaço oferece serviços de assistência social, psicologia e capacitação profissional.</p>`,
    autor: 'Mariana Costa',
    categoria: 'buriti-dos-lopes',
    posicao: 'geral'
  },
  {
    titulo: 'Brasileira recebe investimento em energia solar',
    chapeu: 'Sustentabilidade',
    resumo: 'Prédios públicos terão painéis fotovoltaicos instalados',
    conteudo: `<p>Brasileira vai receber investimento em energia solar com instalação de painéis fotovoltaicos em prédios públicos. A expectativa é reduzir em 40% os gastos com energia elétrica.</p>
<p>O projeto piloto começa pela prefeitura e escolas municipais.</p>`,
    autor: 'Eduardo Silva',
    categoria: 'brasileira',
    posicao: 'geral'
  },
  {
    titulo: 'Lagoa de São Francisco promove festival de pesca esportiva',
    chapeu: 'Esporte',
    resumo: 'Competição deve atrair 200 pescadores de vários estados',
    conteudo: `<p>Lagoa de São Francisco realizará no próximo mês o 5º Festival de Pesca Esportiva. A competição deve atrair 200 pescadores de vários estados.</p>
<p>Além do torneio, haverá shows, feira gastronômica e atividades para toda a família.</p>`,
    autor: 'Rafael Oliveira',
    categoria: 'lagoa-de-sao-francisco',
    posicao: 'geral'
  }
];

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Popular banco
async function seed() {
  console.log(`[seed] Criando ${noticias.length} notícias...`);
  
  let sucesso = 0;
  let falhas = 0;
  
  for (const noticia of noticias) {
    try {
      const url = `${BASE_URL}/api/posts`;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const result = await makeRequest(url, options, noticia);
      
      if (result.status === 200 || result.status === 201) {
        sucesso++;
        console.log(`✅ [${sucesso}/${noticias.length}] ${noticia.titulo.substring(0, 50)}...`);
      } else {
        falhas++;
        console.warn(`⚠️  Erro ${result.status}: ${noticia.titulo.substring(0, 50)}...`);
      }
      
      // Delay para não sobrecarregar (100ms entre requisições)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      falhas++;
      console.error(`❌ Falha: ${noticia.titulo.substring(0, 50)}...`, error.message);
    }
  }
  
  console.log(`\n[seed] ✅ Concluído!`);
  console.log(`[seed] Sucesso: ${sucesso}`);
  console.log(`[seed] Falhas: ${falhas}`);
  console.log(`[seed] Total: ${noticias.length}`);
  console.log(`\n[seed] Acesse: ${BASE_URL}`);
}

seed().catch(console.error);
