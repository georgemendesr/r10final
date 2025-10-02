// Serviço centralizado para gerenciamento de reações (versão ativa)
// Replica (com ajustes mínimos) o arquivo de backup encontrado em r10-front_full_07ago
// Agora disponível em src/services para que os imports funcionem.

// Tipagem mínima para evitar erro de TS quando 'env' não estiver declarado
// @ts-ignore - acesso dinâmico ao env do Vite sem tipagem estrita aqui
const API_BASE_URL: string = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:3002';

export interface ReactionCounts {
  feliz: number;
  inspirado: number;
  surpreso: number;
  preocupado: number;
  triste: number;
  indignado: number;
}

export interface ReactionStats extends ReactionCounts {}

export interface DailyReactionsResponse {
  period: string;
  timestamp: string;
  total: number;
  counts: ReactionCounts;
  percentages: Record<keyof ReactionCounts, number>;
}

export interface PostReactionsResponse {
  postId: string;
  reactions: ReactionCounts;
  total: number;
  userReaction: string | null;
  success?: boolean;
  action?: string;
}

export const reactionConfig = [
  { key: 'feliz', emoji: '😊', label: 'Feliz', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', barColor: 'bg-green-500' },
  { key: 'inspirado', emoji: '🤩', label: 'Inspirado', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', barColor: 'bg-pink-500' },
  { key: 'surpreso', emoji: '😲', label: 'Surpreso', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', barColor: 'bg-yellow-500' },
  { key: 'preocupado', emoji: '😟', label: 'Preocupado', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', barColor: 'bg-orange-500' },
  { key: 'triste', emoji: '😔', label: 'Triste', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', barColor: 'bg-blue-500' },
  { key: 'indignado', emoji: '😡', label: 'Indignado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', barColor: 'bg-red-500' }
] as const;

const emptyCounts: ReactionCounts = {
  feliz: 0,
  inspirado: 0,
  surpreso: 0,
  preocupado: 0,
  triste: 0,
  indignado: 0
};

// ========== API ===========
export const getArticleReactions = async (articleId: string): Promise<ReactionCounts> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/${articleId}/reactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PostReactionsResponse = await res.json();
    return data.reactions || emptyCounts;
  } catch (err) {
    console.error('[Reactions] Falha ao carregar reações do artigo', articleId, err);
    return emptyCounts;
  }
};

export const reactToPost = async (articleId: string, reactionType: keyof ReactionCounts): Promise<PostReactionsResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/${articleId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: reactionType })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: PostReactionsResponse = await res.json();
    return data;
  } catch (err) {
    console.error('[Reactions] Falha ao reagir', articleId, reactionType, err);
    return { postId: articleId, reactions: emptyCounts, total: 0, userReaction: null, success: false };
  }
};

export const getDailyReactions = async (): Promise<DailyReactionsResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reactions/daily`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[Reactions] Falha daily reactions', err);
    return {
      period: 'last_24_hours',
      timestamp: new Date().toISOString(),
      total: 0,
      counts: emptyCounts,
      percentages: { feliz: 0, inspirado: 0, surpreso: 0, preocupado: 0, triste: 0, indignado: 0 }
    };
  }
};

// ========== LocalStorage (fallback / legado) ==========
const STORAGE_KEY = 'r10_reactions_data';
const loadAllLocal = (): Record<string, ReactionCounts> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};
const saveAllLocal = (all: Record<string, ReactionCounts>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

export const getUserReaction = (articleId: string): string | null => localStorage.getItem(`r10_user_reaction_${articleId}`);
export const saveUserReaction = (articleId: string, reaction: string) => localStorage.setItem(`r10_user_reaction_${articleId}`, reaction);

export const incrementReaction = async (articleId: string, reactionType: keyof ReactionCounts) => {
  // Tenta API primeiro
  const api = await reactToPost(articleId, reactionType);
  if (api?.success && api.reactions) return api.reactions;
  // Fallback local
  const all = loadAllLocal();
  const current = all[articleId] || { ...emptyCounts };
  current[reactionType] += 1;
  all[articleId] = current;
  saveAllLocal(all);
  return current;
};

export const getGlobalReactionStats = (): ReactionStats => {
  const all = loadAllLocal();
  const totals: ReactionCounts = { ...emptyCounts };
  Object.values(all).forEach(r => {
    (Object.keys(r) as (keyof ReactionCounts)[]).forEach(k => { totals[k] += r[k]; });
  });
  return totals;
};

export const getReactionPercentages = (): Record<keyof ReactionCounts, number> => {
  const stats = getGlobalReactionStats();
  const total = Object.values(stats).reduce((s, v) => s + v, 0);
  if (!total) return { feliz: 0, inspirado: 0, surpreso: 0, preocupado: 0, triste: 0, indignado: 0 };
  return {
    feliz: Math.round((stats.feliz / total) * 100),
    inspirado: Math.round((stats.inspirado / total) * 100),
    surpreso: Math.round((stats.surpreso / total) * 100),
    preocupado: Math.round((stats.preocupado / total) * 100),
    triste: Math.round((stats.triste / total) * 100),
    indignado: Math.round((stats.indignado / total) * 100)
  };
};

export const initializeReactionsData = () => {
  const existing = loadAllLocal();
  if (Object.keys(existing).length) return;
  const seed: Record<string, ReactionCounts> = {
    '1': { feliz: 4, inspirado: 3, surpreso: 2, preocupado: 1, triste: 0, indignado: 0 }
  };
  saveAllLocal(seed);
};
