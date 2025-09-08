import { Post, PosicaoCanonica, PosicaoAPI } from '../types/Post';

// Mapear posições para prioridades numericas
const PRIORITY_MAP: Record<PosicaoCanonica, number> = {
  'SUPER MANCHETE': 1,
  'DESTAQUE': 2,
  'GERAL': 4,
  'MUNICIPIOS': 5,
};

// Função auxiliar para identificar se é a matéria principal do destaque
const isMainDestaque = (post: Post, allPosts: Post[]): boolean => {
  const posicao = normalizePosicao(post.posicao);
  if (posicao !== 'DESTAQUE') return false;
  
  // Encontrar todos os destaques ordenados por data de publicação
  const destaques = allPosts
    .filter(p => normalizePosicao(p.posicao) === 'DESTAQUE')
    .sort((a, b) => {
      const dateA = new Date(a.dataPublicacao || a.publishedAt || 0);
      const dateB = new Date(b.dataPublicacao || b.publishedAt || 0);
      return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
    });
  
  // A matéria principal é a primeira da lista
  return destaques.length > 0 && destaques[0].id === post.id;
};

// Função para normalizar posição para as posições canônicas
const normalizePosicao = (posicao: PosicaoAPI | undefined): PosicaoCanonica => {
  if (!posicao) return 'GERAL';
  
  const pos = String(posicao).toLowerCase().trim();
  
  // Verificar exatamente o que vem da API
  if (pos === 'supermanchete' || pos.includes('super') || pos.includes('manchete')) {
    return 'SUPER MANCHETE';
  }
  
  if (pos === 'destaque' || pos.includes('destaque')) {
    return 'DESTAQUE';
  }
  
  if (pos.includes('municip')) {
    return 'MUNICIPIOS';
  }
  
  return 'GERAL';
};

// Função principal para ordenar posts por grupos de prioridade
export const sortPostsByPriority = (posts: Post[], sortField?: 'date' | 'title'): Post[] => {
  const sorted = [...posts].sort((a, b) => {
    // 1. Primeiro por grupo de prioridade
    const priorityA = PRIORITY_MAP[normalizePosicao(a.posicao)];
    const priorityB = PRIORITY_MAP[normalizePosicao(b.posicao)];
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // 2. Lógica especial para DESTAQUE: artigo principal vai para posição 2 no dashboard
    if (normalizePosicao(a.posicao) === 'DESTAQUE' && normalizePosicao(b.posicao) === 'DESTAQUE') {
      const isMainA = isMainDestaque(a, posts);
      const isMainB = isMainDestaque(b, posts);
      
      // Se apenas um é o principal, ele tem prioridade (menor número = maior prioridade)
      if (isMainA && !isMainB) return -1;
      if (!isMainA && isMainB) return 1;
    }
    
    // 3. Dentro do mesmo grupo, ordenar por critério secundário
    if (sortField === 'title') {
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    }
    
    // Por padrão, ordenar por data (mais recente primeiro)
    const dateA = new Date(a.dataPublicacao || 0);
    const dateB = new Date(b.dataPublicacao || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sorted;
};

// Função para obter o badge de posição
export const getPosicaoBadge = (posicao: PosicaoAPI | undefined) => {
  const canonical = normalizePosicao(posicao);
  
  switch (canonical) {
    case 'SUPER MANCHETE':
      return {
        text: 'SUPER MANCHETE',
        className: 'bg-red-100 text-red-800 border-red-200 font-bold'
      };
    case 'DESTAQUE':
      return {
        text: 'DESTAQUE',
        className: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold'
      };
    case 'MUNICIPIOS':
      return {
        text: 'MUNICÍPIOS',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    default:
      return null; // Não exibe badge para GERAL
  }
};

// Função para aplicar filtros mantendo a priorização
export const filterAndSortPosts = (
  posts: Post[],
  searchTerm: string = '',
  categoria: string = '',
  sortField?: 'date' | 'title'
): Post[] => {
  let filtered = posts;
  
  // Aplicar filtros
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(post =>
      post.titulo.toLowerCase().includes(term) ||
      (post.categoria && post.categoria.toLowerCase().includes(term)) ||
      (post.autor && post.autor.toLowerCase().includes(term))
    );
  }
  
  if (categoria) {
    filtered = filtered.filter(post => post.categoria === categoria);
  }
  
  // Ordenar mantendo priorização
  return sortPostsByPriority(filtered, sortField);
};

export default {
  sortPostsByPriority,
  getPosicaoBadge,
  filterAndSortPosts
};
