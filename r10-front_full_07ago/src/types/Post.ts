// --- POSIÇÕES DA API (valores reais) ---
export type PosicaoAPI = 'supermanchete' | 'destaque' | 'geral' | 'municipios' | 'manchete' | string;

// --- POSIÇÕES CANÔNICAS PARA EXIBIÇÃO ---
export type PosicaoCanonica = 'SUPER MANCHETE' | 'DESTAQUE' | 'GERAL' | 'MUNICIPIOS';

export interface Post {
  id: string;
  titulo: string;
  subtitulo?: string;
  chapeu?: string;
  conteudo: string;
  posicao: PosicaoAPI; // Usar tipo da API
  categoria: string;
  autor: string;
  dataPublicacao: string;
  imagemUrl?: string;
  visualizacoes?: number;
  municipio?: string;
  publishedAt?: string;
  publishedTs?: number;
  slug?: string;
}

export interface PostFilters {
  posicao?: string;
  categoria?: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
