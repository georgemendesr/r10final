// Serviço simplificado de Posts (adaptado)
export interface Post {
  id: number|string;
  titulo: string; subtitulo?: string; conteudo: string; categoria: string; posicao?: string; chapeu?: string; imagemUrl?: string;
  createdAt?: string; publishedAt?: string; autor?: string; resumo?: string;
}

export interface PostFilters { categoria?: string; posicao?: string; limit?: number; }

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

function mapApi(p:any): Post {
  return {
    id: p.id,
    titulo: p.titulo || p.title,
    subtitulo: p.subtitulo || p.subtitle || '',
    conteudo: p.conteudo || p.content || '',
    categoria: p.categoria || p.category || 'geral',
    posicao: p.posicao || p.position || 'geral',
    chapeu: p.chapeu || '',
    imagemUrl: p.imagemUrl || p.imagem_url || p.imagem_destaque || p.imagem || '',
    createdAt: p.createdAt || p.created_at,
    publishedAt: p.publishedAt || p.published_at,
    autor: p.autor || p.author || 'Redação',
    resumo: p.resumo || ''
  };
}

export async function getPosts(filters?: PostFilters): Promise<Post[]> {
  const params = new URLSearchParams();
  if (filters?.categoria && filters.categoria !== 'todas') params.append('categoria', filters.categoria);
  if (filters?.posicao && filters.posicao !== 'todas') params.append('posicao', filters.posicao);
  if (filters?.limit) params.append('limit', String(filters.limit));
  // Forçar admin=1 para receber formato {posts:[...]}
  params.append('admin','1');
  const url = `${API_BASE}/posts?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao buscar posts');
  const data = await res.json();
  if (Array.isArray(data)) return data.map(mapApi);
  if (Array.isArray(data.posts)) return data.posts.map(mapApi);
  if (Array.isArray(data.items)) return data.items.map(mapApi);
  return [];
}

export async function getPostsByPosition(posicao: string, limit=5): Promise<Post[]> {
  return getPosts({ posicao, limit });
}

export async function deletePost(id: number|string) {
  const res = await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar');
  return res.json();
}

export async function createPost(postData: Partial<Post>) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  if (!res.ok) throw new Error('Erro ao criar post');
  const data = await res.json();
  return mapApi(data);
}

export async function updatePost(id: string | number, postData: Partial<Post>) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  if (!res.ok) throw new Error('Erro ao atualizar post');
  const data = await res.json();
  return mapApi(data);
}

export async function getPostById(id: string | number): Promise<Post | null> {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Erro ao buscar post');
  }
  const data = await res.json();
  return mapApi(data);
}

export function ensureArray<T>(val: T|T[]|undefined|null): T[] {
  if (Array.isArray(val)) return val; if (val == null) return []; return [val];
}
