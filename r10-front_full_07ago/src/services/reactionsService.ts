// Serviço centralizado para gerenciamento de reações
export interface ReactionCounts {
  feliz: number;
  inspirado: number;
  surpreso: number;
  preocupado: number;
  triste: number;
  indignado: number; // Padronizado como "indignado"
}

export interface ReactionStats {
  feliz: number;
  inspirado: number;
  surpreso: number;
  preocupado: number;
  triste: number;
  indignado: number;
}

// Configuração das reações padronizada
export const reactionConfig = [
  { key: 'feliz', emoji: '😊', label: 'Feliz', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', barColor: 'bg-green-500' },
  { key: 'inspirado', emoji: '🤩', label: 'Inspirado', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', barColor: 'bg-pink-500' },
  { key: 'surpreso', emoji: '😲', label: 'Surpreso', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', barColor: 'bg-yellow-500' },
  { key: 'preocupado', emoji: '😟', label: 'Preocupado', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', barColor: 'bg-orange-500' },
  { key: 'triste', emoji: '😔', label: 'Triste', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', barColor: 'bg-blue-500' },
  { key: 'indignado', emoji: '😡', label: 'Indignado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', barColor: 'bg-red-500' }
] as const;

// Chave para armazenamento centralizado
const REACTIONS_STORAGE_KEY = 'r10_reactions_data';

// Função para carregar todas as reações de todos os artigos
const loadAllReactionsFromStorage = (): Record<string, ReactionCounts> => {
  const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

// Função para salvar reações de um artigo específico
const saveReactionToStorage = (articleId: string, reactions: ReactionCounts): void => {
  const allReactions = loadAllReactionsFromStorage();
  allReactions[articleId] = reactions;
  localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(allReactions));
};

// Obter reações de um artigo específico
export const getArticleReactions = (articleId: string): ReactionCounts => {
  const allReactions = loadAllReactionsFromStorage();
  return allReactions[articleId] || {
    feliz: 8,
    inspirado: 12,
    surpreso: 3,
    preocupado: 15,
    triste: 2,
    indignado: 5
  };
};

// Incrementar reação de um artigo
export const incrementReaction = (articleId: string, reactionType: keyof ReactionCounts): ReactionCounts => {
  const currentReactions = getArticleReactions(articleId);
  const updatedReactions = {
    ...currentReactions,
    [reactionType]: currentReactions[reactionType] + 1
  };
  
  saveReactionToStorage(articleId, updatedReactions);
  return updatedReactions;
};

// Obter estatísticas globais de todas as reações
export const getGlobalReactionStats = (): ReactionStats => {
  const allReactions = loadAllReactionsFromStorage();
  
  // Somar todas as reações de todos os artigos
  const totals: ReactionCounts = {
    feliz: 0,
    inspirado: 0,
    surpreso: 0,
    preocupado: 0,
    triste: 0,
    indignado: 0
  };

  Object.values(allReactions).forEach(articleReactions => {
    totals.feliz += articleReactions.feliz;
    totals.inspirado += articleReactions.inspirado;
    totals.surpreso += articleReactions.surpreso;
    totals.preocupado += articleReactions.preocupado;
    totals.triste += articleReactions.triste;
    totals.indignado += articleReactions.indignado;
  });

  return totals;
};

// Obter percentuais das reações
export const getReactionPercentages = (): Record<keyof ReactionCounts, number> => {
  const stats = getGlobalReactionStats();
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return {
      feliz: 0,
      inspirado: 0,
      surpreso: 0,
      preocupado: 0,
      triste: 0,
      indignado: 0
    };
  }

  return {
    feliz: Math.round((stats.feliz / total) * 100),
    inspirado: Math.round((stats.inspirado / total) * 100),
    surpreso: Math.round((stats.surpreso / total) * 100),
    preocupado: Math.round((stats.preocupado / total) * 100),
    triste: Math.round((stats.triste / total) * 100),
    indignado: Math.round((stats.indignado / total) * 100)
  };
};

// Verificar se usuário já reagiu a um artigo
export const getUserReaction = (articleId: string): string | null => {
  return localStorage.getItem(`r10_user_reaction_${articleId}`);
};

// Salvar reação do usuário
export const saveUserReaction = (articleId: string, reactionType: string): void => {
  localStorage.setItem(`r10_user_reaction_${articleId}`, reactionType);
};

// Inicializar dados de teste se não existirem
export const initializeReactionsData = (): void => {
  const existing = loadAllReactionsFromStorage();
  
  // Se já existem dados, não sobrescrever
  if (Object.keys(existing).length > 0) return;

  // Criar dados de exemplo para alguns artigos
  const testData: Record<string, ReactionCounts> = {
    '1': { feliz: 45, inspirado: 32, surpreso: 23, preocupado: 18, triste: 12, indignado: 8 },
    '2': { feliz: 38, inspirado: 28, surpreso: 34, preocupado: 25, triste: 15, indignado: 22 },
    '3': { feliz: 52, inspirado: 41, surpreso: 19, preocupado: 14, triste: 9, indignado: 6 },
    '4': { feliz: 29, inspirado: 35, surpreso: 28, preocupado: 31, triste: 18, indignado: 12 },
    '5': { feliz: 67, inspirado: 54, surpreso: 42, preocupado: 21, triste: 11, indignado: 15 }
  };

  localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(testData));
  console.log('✅ Dados de reações inicializados com sucesso!');
};
