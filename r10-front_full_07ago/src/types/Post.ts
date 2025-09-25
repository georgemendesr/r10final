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
  views?: number; // Campo real de views do backend
  municipio?: string;
  publishedAt?: string;
  publishedTs?: number;
  slug?: string;
  resumo?: string; // Campo para resumo gerado por IA
  tags?: string[]; // Opcional, usado no formulário
}

export interface PostFilters {
  posicao?: string;
  categoria?: string;
  limit?: number; // Opcional para limitar resultados na API
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
