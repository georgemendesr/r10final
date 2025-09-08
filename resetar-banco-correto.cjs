// resetar-banco-correto.cjs
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Corrigir caminho do banco - usar a estrutura atual do projeto
const dbPath = path.join(__dirname, 'server', 'noticias.db');

console.log('🚀 RESETANDO BANCO COM ESTRUTURA CORRETA\n');
console.log('📁 Banco:', dbPath);
console.log('='.repeat(60));

const db = new sqlite3.Database(dbPath);

// Limpar e recriar tabela
db.serialize(() => {
  
  // 1. DELETAR TABELA ANTIGA
  db.run("DROP TABLE IF EXISTS noticias", (err) => {
    if (err) console.error('Erro ao deletar:', err);
    else console.log('✅ Tabela antiga removida');
  });
  
  // 2. CRIAR TABELA NOVA - estrutura compatível com a API
  db.run(`
    CREATE TABLE noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      subtitulo TEXT,
      chapeu TEXT,
      conteudo TEXT,
      autor TEXT,
      categoria TEXT,
      posicao TEXT,
      imagem TEXT,
      imagemUrl TEXT,
      imagem_destaque TEXT,
      slug TEXT UNIQUE,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) console.error('Erro ao criar tabela:', err);
    else console.log('✅ Tabela criada com estrutura correta\n');
  });
  
  // 3. INSERIR NOTÍCIAS FICTÍCIAS - ajustar categorias e posições para normalização da API
  const noticias = [
    // ========== SUPER MANCHETE (1) ==========
    {
      titulo: "Governo anuncia pacote de R$ 500 milhões para infraestrutura estadual",
      subtitulo: "Investimentos serão distribuídos entre obras de pavimentação, pontes e saneamento básico em todas as regiões",
      chapeu: "INVESTIMENTO RECORDE",
      conteudo: "O governo estadual anunciou nesta segunda-feira um pacote robusto de investimentos que promete transformar a infraestrutura do estado. Os recursos serão aplicados ao longo dos próximos 24 meses.",
      autor: "João Silva",
      categoria: "politica", // normalizado para minúsculo
      posicao: "supermanchete", // normalizado
      imagemUrl: "https://picsum.photos/1200/600?random=1"
    },
    
    // ========== DESTAQUES (5) ==========
    {
      titulo: "Operação policial desarticula quadrilha de roubo de cargas",
      subtitulo: "Mais de 20 pessoas foram presas em ação conjunta das forças de segurança",
      chapeu: "SEGURANÇA PÚBLICA",
      conteudo: "Uma megaoperação policial realizada na madrugada desta terça-feira resultou na prisão de mais de 20 suspeitos.",
      autor: "Maria Santos",
      categoria: "policia",
      posicao: "destaque",
      imagemUrl: "https://picsum.photos/800/600?random=2"
    },
    {
      titulo: "Festival de música reúne 50 mil pessoas no final de semana",
      subtitulo: "Evento contou com apresentações de artistas nacionais e internacionais",
      chapeu: "CULTURA",
      conteudo: "O Festival de Música da cidade superou todas as expectativas e se consolidou como um dos maiores eventos culturais do estado.",
      autor: "Carlos Lima",
      categoria: "entretenimento",
      posicao: "destaque",
      imagemUrl: "https://picsum.photos/800/600?random=3"
    },
    {
      titulo: "Time local conquista campeonato estadual após 10 anos",
      subtitulo: "Vitória por 3 a 1 garantiu título inédito para a nova geração de torcedores",
      chapeu: "FUTEBOL",
      conteudo: "Em partida emocionante no estádio lotado, o time da casa conquistou o título estadual após uma década de jejum.",
      autor: "Pedro Souza",
      categoria: "esporte",
      posicao: "destaque",
      imagemUrl: "https://picsum.photos/800/600?random=4"
    },
    {
      titulo: "Deputados aprovam projeto de lei para redução de impostos",
      subtitulo: "Medida beneficia pequenas e médias empresas do setor de serviços",
      chapeu: "ECONOMIA",
      conteudo: "A Assembleia Legislativa aprovou por ampla maioria o projeto que reduz a carga tributária para o setor de serviços.",
      autor: "Ana Costa",
      categoria: "politica",
      posicao: "destaque",
      imagemUrl: "https://picsum.photos/800/600?random=5"
    },
    {
      titulo: "Novo shopping center gera 2 mil empregos diretos",
      subtitulo: "Empreendimento é o maior investimento privado dos últimos 5 anos",
      chapeu: "DESENVOLVIMENTO",
      conteudo: "A inauguração do novo centro comercial marca uma nova fase de desenvolvimento econômico para a região.",
      autor: "Roberto Dias",
      categoria: "geral",
      posicao: "destaque",
      imagemUrl: "https://picsum.photos/800/600?random=6"
    },
    
    // ========== GERAL (7) ==========
    {
      titulo: "Prefeitura inicia recapeamento de principais avenidas",
      subtitulo: "Obras devem durar três meses e vão modernizar 50 km de vias",
      chapeu: "INFRAESTRUTURA",
      conteudo: "A prefeitura municipal deu início ao maior programa de recapeamento asfáltico dos últimos anos.",
      autor: "Lucas Mendes",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=7"
    },
    {
      titulo: "Hospital regional amplia número de leitos de UTI",
      subtitulo: "Unidade passa a contar com 50 novos leitos equipados",
      chapeu: "SAÚDE",
      conteudo: "O Hospital Regional inaugurou nova ala de terapia intensiva com equipamentos de última geração.",
      autor: "Fernanda Lima",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=8"
    },
    {
      titulo: "Escola pública vence olimpíada nacional de matemática",
      subtitulo: "Estudantes superam mais de 500 escolas participantes",
      chapeu: "EDUCAÇÃO",
      conteudo: "Alunos da rede pública conquistaram o primeiro lugar na Olimpíada Brasileira de Matemática.",
      autor: "Juliana Rocha",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=9"
    },
    {
      titulo: "Campanha de vacinação atinge 90% da meta estabelecida",
      subtitulo: "Mais de 200 mil pessoas foram imunizadas em apenas duas semanas",
      chapeu: "PREVENÇÃO",
      conteudo: "A campanha de vacinação contra a gripe superou as expectativas da Secretaria de Saúde.",
      autor: "André Luiz",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=10"
    },
    {
      titulo: "Feira de tecnologia apresenta inovações para agricultura",
      subtitulo: "Evento reúne startups e produtores rurais em busca de soluções",
      chapeu: "AGRONEGÓCIO",
      conteudo: "A Feira de Tecnologia Agrícola trouxe as últimas novidades em automação e sustentabilidade para o campo.",
      autor: "Paulo Ribeiro",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=11"
    },
    {
      titulo: "Transporte público ganha 30 novos ônibus com ar-condicionado",
      subtitulo: "Frota renovada promete mais conforto para os passageiros",
      chapeu: "MOBILIDADE",
      conteudo: "A empresa de transporte público apresentou os novos veículos que começam a circular na próxima semana.",
      autor: "Camila Torres",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=12"
    },
    {
      titulo: "Parque municipal recebe melhorias e nova iluminação LED",
      subtitulo: "Espaço de lazer ganha equipamentos de ginástica e playground",
      chapeu: "LAZER",
      conteudo: "O principal parque da cidade passou por completa revitalização e está pronto para receber visitantes.",
      autor: "Ricardo Santos",
      categoria: "geral",
      posicao: "geral",
      imagemUrl: "https://picsum.photos/600/400?random=13"
    }
  ];
  
  // Inserir notícias - ajustar campos para compatibilidade com API
  const stmt = db.prepare(`
    INSERT INTO noticias (
      titulo, subtitulo, chapeu, conteudo, autor, 
      categoria, posicao, imagemUrl, imagem, imagem_destaque, slug
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let inseridos = 0;
  const total = noticias.length;
  
  noticias.forEach((noticia, index) => {
    // Gerar slug
    const slug = noticia.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    stmt.run(
      noticia.titulo,
      noticia.subtitulo,
      noticia.chapeu,
      noticia.conteudo,
      noticia.autor,
      noticia.categoria,
      noticia.posicao,
      noticia.imagemUrl, // imagemUrl
      noticia.imagemUrl, // imagem (compatibilidade)
      noticia.imagemUrl, // imagem_destaque (compatibilidade)
      slug,
      (err) => {
        if (err) {
          console.error(`❌ Erro ao inserir notícia ${index + 1}:`, err);
        } else {
          inseridos++;
          const emoji = noticia.posicao === 'supermanchete' ? '🔴' : 
                       noticia.posicao === 'destaque' ? '⭐' : '📰';
          console.log(`${emoji} [${noticia.posicao.toUpperCase()}] ${noticia.titulo.substring(0, 50)}...`);
          
          if (inseridos === total) {
            // Verificar resultado final
            console.log('\n' + '='.repeat(60));
            console.log('📊 VERIFICAÇÃO FINAL');
            console.log('='.repeat(60));
            
            db.get("SELECT COUNT(*) as total FROM noticias", (err, result) => {
              if (!err) {
                console.log(`\n✅ Total de notícias inseridas: ${result.total}`);
                
                // Mostrar distribuição
                db.all(`
                  SELECT posicao, categoria, COUNT(*) as qtd 
                  FROM noticias 
                  GROUP BY posicao, categoria
                  ORDER BY posicao, categoria
                `, (err, rows) => {
                  if (!err) {
                    console.log('\n📍 Distribuição por POSIÇÃO:');
                    const posicoes = {};
                    rows.forEach(row => {
                      if (!posicoes[row.posicao]) posicoes[row.posicao] = 0;
                      posicoes[row.posicao] += row.qtd;
                    });
                    Object.entries(posicoes).forEach(([pos, qtd]) => {
                      console.log(`  - ${pos}: ${qtd} notícias`);
                    });
                    
                    console.log('\n📂 Distribuição por CATEGORIA:');
                    const categorias = {};
                    rows.forEach(row => {
                      if (!categorias[row.categoria]) categorias[row.categoria] = 0;
                      categorias[row.categoria] += row.qtd;
                    });
                    Object.entries(categorias).forEach(([cat, qtd]) => {
                      console.log(`  - ${cat}: ${qtd} notícias`);
                    });
                  }
                  
                  console.log('\n' + '='.repeat(60));
                  console.log('✅ BANCO RESETADO COM SUCESSO!');
                  console.log('='.repeat(60));
                  console.log('\n📌 Agora execute:');
                  console.log('  1. npm run api:3002 (reiniciar API)');
                  console.log('  2. cd r10-front_full_07ago && npm run dev (reiniciar frontend)');
                  console.log('  3. Acesse: http://localhost:5175');
                  
                  db.close();
                });
              }
            });
          }
        }
      }
    );
  });
  
  stmt.finalize();
});
