// Configuração SEO otimizada para R10 Piauí
export function buildSiteMeta() {
  const title = 'Notícias do Piauí e Piripiri em Tempo Real | R10 Piauí';
  const description = 'Últimas notícias de Piripiri e do Piauí. Política, polícia, esportes e eventos em tempo real. Acesse o R10 Piauí agora!';
  const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
  const image = `${url}/img/og-default.jpg`;
  return { title, description, url, image };
}

// SEO para categorias específicas
export function buildCategoryMeta(categoria: string) {
  const categorias = {
    geral: {
      title: 'Notícias Gerais do Piauí | R10 Piauí',
      description: 'Acompanhe as principais notícias gerais do Piauí e região. Informações atualizadas sobre acontecimentos locais.',
    },
    policia: {
      title: 'Notícias Policiais do Piauí | R10 Piauí',
      description: 'Últimas notícias policiais do Piauí e Piripiri. Ocorrências, investigações e segurança pública em tempo real.',
    },
    politica: {
      title: 'Política do Piauí | R10 Piauí',
      description: 'Cobertura completa da política piauiense. Eleições, governo, prefeituras e decisões que impactam o Piauí.',
    },
    municipios: {
      title: 'Notícias dos Municípios do Piauí | R10 Piauí',
      description: 'Notícias de todos os municípios do Piauí. Política local, eventos e acontecimentos nas cidades piauienses.',
    },
    economia: {
      title: 'Economia do Piauí | R10 Piauí',
      description: 'Notícias econômicas do Piauí. Negócios, empregos, desenvolvimento regional e oportunidades econômicas.',
    },
    esportes: {
      title: 'Esportes do Piauí | R10 Piauí',
      description: 'Cobertura esportiva completa do Piauí. Futebol local, times piauienses e esportes regionais.',
    },
    eventos: {
      title: 'Eventos do Piauí | R10 Piauí',
      description: 'Agenda de eventos do Piauí e Piripiri. Shows, festas, cultura e entretenimento na região.',
    },
    piripiri: {
      title: 'Notícias de Piripiri Hoje | R10 Piauí',
      description: 'Acompanhe as últimas notícias de Piripiri: política, polícia, eventos e tudo que acontece na cidade em tempo real.',
    }
  };

  const categoryMeta = categorias[categoria as keyof typeof categorias];
  const site = buildSiteMeta();
  
  return {
    title: categoryMeta?.title || site.title,
    description: categoryMeta?.description || site.description,
    url: typeof window !== 'undefined' ? window.location.href : `${site.url}/categoria/${categoria}`,
    image: `${site.url}/img/og-${categoria}.jpg`
  };
}

// SEO para artigos individuais com otimização para cidade + assunto
export function buildArticleMeta(post: { 
  title: string; 
  subtitle?: string; 
  imagemDestaque?: string; 
  slug?: string; 
  id?: string;
  categoria?: string;
  cidade?: string;
}) {
  const site = buildSiteMeta();
  
  // Lista de cidades do Piauí para detecção automática
  const cidadesPiaui = [
    'Piripiri', 'Teresina', 'Parnaíba', 'Floriano', 'Picos', 'Campo Maior',
    'Barras', 'União', 'Altos', 'José de Freitas', 'Esperantina', 'Valença',
    'Oeiras', 'Amarante', 'São Raimundo Nonato', 'Bom Jesus', 'Corrente',
    'Uruçuí', 'Regeneração', 'Pedro II', 'Piracuruca', 'Luzilândia',
    'Batalha', 'Água Branca', 'Buriti dos Lopes', 'Cocal', 'São João do Piauí'
  ];

  // Detecta cidade no título automaticamente
  let cidadeDetectada = post.cidade;
  if (!cidadeDetectada) {
    for (const cidade of cidadesPiaui) {
      if (post.title.includes(cidade)) {
        cidadeDetectada = cidade;
        break;
      }
    }
  }
  
  // Aplica fórmula: cidade + assunto + R10 Piauí
  let optimizedTitle = post.title;
  
  // Se detectou cidade e ela não está no início do título
  if (cidadeDetectada && !post.title.toLowerCase().startsWith(cidadeDetectada.toLowerCase())) {
    optimizedTitle = `${cidadeDetectada}: ${post.title}`;
  }
  
  // Garante que termine com R10 Piauí
  if (!optimizedTitle.includes('R10 Piauí')) {
    optimizedTitle = `${optimizedTitle} | R10 Piauí`;
  }
  
  const title = optimizedTitle;
  const description = post.subtitle || `Notícia completa sobre ${post.title.toLowerCase()} ${cidadeDetectada ? `em ${cidadeDetectada}` : 'no Piauí'} - R10 Piauí. Acompanhe os detalhes e repercussões.`;
  const url = typeof window !== 'undefined' ? window.location.href : `${site.url}/noticia/${post.slug || post.id}`;
  const image = post.imagemDestaque || `${site.url}/img/og-default.jpg`;
  
  return { title, description, url, image };
}

// H1 otimizado para home
export function getHomeH1() {
  return 'Notícias do Piauí em Tempo Real';
}

// H2s otimizados para seções da home
export function getHomeSectionTitles() {
  return {
    piripiri: 'Últimas de Piripiri',
    politica: 'Notícias de Política',
    policia: 'Polícia em Destaque',
    eventos: 'Eventos Locais',
    destaque: 'Destaques do Piauí',
    geral: 'Notícias Gerais',
    municipios: 'Notícias dos Municípios do Piauí',
    maisLidas: 'Mais Lidas',
    aoVivo: 'Ao Vivo Agora'
  };
}
