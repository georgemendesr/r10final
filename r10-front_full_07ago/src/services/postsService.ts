import { Post, PostFilters, PostsResponse } from '../types/Post';
import * as api from './api';
import { LS_KEY, readAllOffline, normalizePos, preloadOfflineFromStatic } from './offlineCache';

// MODO OFFLINE FORÇADO - SEM API
const OFFLINE_ONLY = false; // FORÇANDO MODO ONLINE PARA TESTAR RESUMO
export let OFFLINE_MODE = false;

// Função para ordenar posts por data de publicação (mais recentes primeiro)
const sortDesc = (a:any,b:any) => new Date(b.publishedAt||0).getTime() - new Date(a.publishedAt||0).getTime();

// URL da API - fixado para 127.0.0.1 para garantir consistência com proxy
const API_HOST = '127.0.0.1'; // sempre 127.0.0.1 para funcionar com localhost e IP
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || `http://${API_HOST}:3002/api`;
console.debug('[postsService] API_BASE_URL=', API_BASE_URL);

// Chave para localStorage
const POSTS_STORAGE_KEY = 'r10_posts';

async function fetchJSON<T>(url: string): Promise<T> {
  const bust = `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
  const res = await fetch(bust, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// --- Novos tipos padronizados
export type PagedPosts = {
  items: Post[];
  page: number;
  pages: number;
  total: number;
  limit: number;
};

// --- Normalizador defensivo
function toPaged(data: any): PagedPosts {
  let items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.posts)
        ? data.posts
        : Array.isArray(data?.data)
          ? data.data
          : [];

  // Aplicar mapeamento apenas se os items não estão no formato esperado
  items = items.map((item: any) => mapApiResponseToPost(item));

  const total = Number(data?.total ?? data?.totalPosts ?? items.length ?? 0);
  const limit = Number(data?.limit ?? data?.postsPerPage ?? (Array.isArray(data) ? data.length : 0) ?? 0);
  const page  = Number(data?.page ?? data?.currentPage ?? 1);
  const pages = Number(data?.pages ?? data?.totalPages ?? (limit ? Math.ceil(total / limit) : 1));

  return { items, page, pages, total, limit };
}

// --- Finalmente vamos definir esses mappers

// Mapear notícias offline (estáticas) para o formato esperado
const mapOfflinePost = (offlineData: any): Post => {
  const publishedAt = offlineData.publishedAt || offlineData.dataPublicacao || new Date().toISOString();
  const autor = offlineData.autor || 'R10 Piauí';
  const categoria = offlineData.categoria || 'Geral';

  const mappedPost: any = {
    // Estrutura em português
    id: offlineData.id?.toString() || '',
    titulo: offlineData.titulo || '',
    subtitulo: offlineData.subtitulo || '',
    chapeu: offlineData.chapeu || '',
    conteudo: offlineData.conteudo || '',
    posicao: offlineData.posicao || 'noticia-comum',
    categoria: categoria,
    autor: autor,
    dataPublicacao: publishedAt,
    imagemUrl: offlineData.imagemUrl || '',
    visualizacoes: offlineData.visualizacoes || 0,
    
    // Compatibilidade
    title: offlineData.titulo || '',
    subtitle: offlineData.subtitulo || '',
    content: '',
    author: autor,
    publishDate: publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    imagemDestaque: offlineData.imagemUrl || '',
    subcategorias: [categoria],
    status: 'published',
    tags: [categoria],
    resumo: offlineData.subtitulo || '',
    fonte: 'R10 Piauí Pulse',
    views: 0,
    slug: offlineData.slug || `${offlineData.id}-${(offlineData.titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  };
  
  return mappedPost as Post;
};

// Função para mapear dados da API MySQL para o formato do frontend
const mapApiResponseToPost = (apiData: any): Post => {
  // Usar os novos campos da API normalizada
  const publishedAt = apiData.publishedAt || apiData.dataPublicacao || new Date().toISOString();
  const autor = apiData.autor || 'R10 Piauí';
  const categoria = apiData.categoria || 'Geral';

  const mappedPost: any = {
    // Nova estrutura (português) - usando campos corretos da API
    id: apiData.id.toString(),
    titulo: apiData.titulo || apiData.title || '',
    subtitulo: apiData.subtitulo || apiData.subtitle || '',
    chapeu: apiData.chapeu || '',
    conteudo: apiData.conteudo || apiData.content || '',
    posicao: apiData.posicao || 'noticia-comum',
    categoria: categoria,
    autor: autor,
    dataPublicacao: publishedAt,
    imagemUrl: apiData.imagemUrl || apiData.imagemDestaque || '',
    visualizacoes: apiData.visualizacoes || apiData.views || 0,
    
    // Propriedades de compatibilidade (inglês) - para manter PostsManager funcionando
    title: apiData.titulo || apiData.title || '',
    subtitle: apiData.subtitulo || apiData.subtitle || '',
    content: apiData.conteudo || apiData.content || '',
    author: autor,
    publishDate: publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    imagemDestaque: apiData.imagemUrl || apiData.imagemDestaque || '',
    subcategorias: [categoria],
    status: 'published',
    tags: [categoria],
    resumo: apiData.resumo || '', // ✅ SÓ MUDEI ESTA LINHA!
    fonte: 'R10 Piauí Pulse',
    views: apiData.visualizacoes || apiData.views || 0,
    slug: apiData.slug || `${apiData.id}-${(apiData.titulo || apiData.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  };
  
  return mappedPost as Post;
};

// --- Novos Fetchers Padronizados
export async function fetchPostsPage(params: Record<string, string | number>): Promise<PagedPosts> {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  
  // MODO OFFLINE FORÇADO
  if (OFFLINE_ONLY) {
    console.log(`🔄 fetchPostsPage() - MODO OFFLINE FORÇADO`);
    const allPosts = readAllOffline();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = allPosts.slice(startIndex, endIndex).map(mapOfflinePost);
    const total = allPosts.length;
    const pages = Math.ceil(total / limit);
    
    return { items, page, pages, total, limit };
  }
  
  // Testar conectividade com a API
  try {
  const base = `${API_BASE_URL}/posts?page=${page}&limit=${limit}`;
  const url = `${base}&_ts=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) {
      console.warn(`⚠️ fetchPostsPage() - API não disponível (${response.status}), mudando para offline`);
      OFFLINE_MODE = true;
      const allPosts = readAllOffline();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = allPosts.slice(startIndex, endIndex).map(mapOfflinePost);
      const total = allPosts.length;
      const pages = Math.ceil(total / limit);
      
      return { items, page, pages, total, limit };
    }

    const data = await response.json();
    console.log(`✅ fetchPostsPage() - API respondeu, página ${page}, ${data.length || 0} items`);
    return toPaged(data);
  } catch (error) {
    console.warn(`⚠️ fetchPostsPage() - Erro na API, mudando para offline:`, error);
    OFFLINE_MODE = true;
    const allPosts = readAllOffline();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = allPosts.slice(startIndex, endIndex).map(mapOfflinePost);
    const total = allPosts.length;
    const pages = Math.ceil(total / limit);
    
    return { items, page, pages, total, limit };
  }
}

// Legacy: fetch homepage
export async function fetchHomepage(): Promise<{hero?: Post[], highlights?: Post[], latest?: Post[]}> {
  if (OFFLINE_ONLY) {
    console.log(`🔄 fetchHomepage() - MODO OFFLINE FORÇADO`);
    const allPosts = readAllOffline().map(mapOfflinePost);
    const sorted = [...allPosts].sort(sortDesc);
    return {
      hero: sorted.slice(0, 1),
      highlights: sorted.slice(1, 6),
      latest: sorted.slice(6, 16)
    };
  }
  
  try {
    const data = await fetchJSON<any>(`${API_BASE_URL}/home`);
    console.log(`✅ fetchHomepage() - API respondeu`);
    return {
      hero: data.hero?.map(mapApiResponseToPost) ?? [],
      highlights: data.highlights?.map(mapApiResponseToPost) ?? [],
      latest: data.latest?.map(mapApiResponseToPost) ?? []
    };
  } catch (error) {
    console.warn(`⚠️ fetchHomepage() - Erro na API, mudando para offline:`, error);
    OFFLINE_MODE = true;
    const allPosts = readAllOffline().map(mapOfflinePost);
    const sorted = [...allPosts].sort(sortDesc);
    return {
      hero: sorted.slice(0, 1),
      highlights: sorted.slice(1, 6),
      latest: sorted.slice(6, 16)
    };
  }
}

// --- Legacy API Support

// Função principal para buscar posts
export async function getPosts(filters?: PostFilters): Promise<Post[]> {
  console.log('🔄 getPosts chamado, filtros:', filters);
  console.log('🔧 OFFLINE_ONLY:', OFFLINE_ONLY, 'OFFLINE_MODE:', OFFLINE_MODE);
  console.log('🌐 API_BASE_URL:', API_BASE_URL);
  
  if (OFFLINE_ONLY) {
    console.log('📱 MODO OFFLINE FORÇADO - Usando dados estáticos');
    return readAllOffline().map(mapOfflinePost);
  }
  
  try {
    // Tentar conectar à API PostgreSQL
    const params = new URLSearchParams();
    if (filters?.categoria && filters.categoria !== 'todas') {
      params.append('categoria', filters.categoria);
    }
    if (filters?.posicao && filters.posicao !== 'todas') {
      params.append('posicao', filters.posicao);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const url = `${API_BASE_URL}/posts${params.toString() ? '?' + params.toString() : ''}`;
    console.log('🔗 Tentando conectar à API:', url);
    
  const urlBust = `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
  console.log('📡 Fazendo fetch para:', urlBust);
  const response = await fetch(urlBust, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    
    console.log('📞 Response status:', response.status, 'ok:', response.ok);
    
    if (!response.ok) {
      console.warn(`⚠️ API retornou status ${response.status}, mudando para modo offline`);
      OFFLINE_MODE = true;
      return readAllOffline().map(mapOfflinePost);
    }
    
    const data = await response.json();
    console.log(`✅ API PostgreSQL respondeu com ${data.length || 0} posts`);
    
    // Mapear resposta da API para o formato esperado
    if (Array.isArray(data)) {
      return data.map(mapApiResponseToPost);
    } else if (data.items && Array.isArray(data.items)) {
      return data.items.map(mapApiResponseToPost);
    } else {
      console.warn('⚠️ Formato de resposta inesperado da API:', data);
      return [];
    }
    
  } catch (error) {
    console.warn('⚠️ Erro ao conectar com a API PostgreSQL, mudando para modo offline:', error);
    OFFLINE_MODE = true;
    return readAllOffline().map(mapOfflinePost);
  }
}

// Função para buscar um post específico por ID
export async function getPostById(id: string): Promise<Post | null> {
  console.log('🔍 Buscando post por ID:', id);
  
  if (OFFLINE_ONLY) {
    console.log('📱 MODO OFFLINE FORÇADO - Buscando nos dados estáticos');
    const allPosts = readAllOffline();
    const post = allPosts.find(p => p.id?.toString() === id);
    return post ? mapOfflinePost(post) : null;
  }
  
  try {
  const response = await fetch(`${API_BASE_URL}/posts/${id}?_ts=${Date.now()}&_cache=${Math.random()}`, { 
    cache: 'no-store', 
    headers: { 
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    } 
  });
    
    if (!response.ok) {
      console.warn(`⚠️ Post ${id} não encontrado na API, tentando offline`);
      const allPosts = readAllOffline();
      const post = allPosts.find(p => p.id?.toString() === id);
      return post ? mapOfflinePost(post) : null;
    }
    
    const data = await response.json();
    console.log(`✅ Post ${id} encontrado na API`);
    return mapApiResponseToPost(data);
    
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar post ${id} na API:`, error);
    const allPosts = readAllOffline();
    const post = allPosts.find(p => p.id?.toString() === id);
    return post ? mapOfflinePost(post) : null;
  }
}

// Função para deletar um post
export async function deletePost(id: string): Promise<boolean> {
  console.log('🗑️ Tentando deletar post:', id);
  
  try {
    await api.del(`/posts/${id}`);
    console.log(`✅ Post ${id} deletado com sucesso`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao deletar post:', error);
    return false;
  }
}

// Função para criar um novo post
export async function createPost(postData: Partial<Post>): Promise<Post | null> {
  console.log('📝 Criando novo post:', postData.titulo);
  
  try {
    const data = await api.post<any>(`/posts`, postData as any);
    console.log('✅ Post criado com sucesso:', data.id);
    return mapApiResponseToPost(data);
  } catch (error) {
    console.error('❌ Erro ao criar post:', error);
    return null;
  }
}

// Função para atualizar um post
export async function updatePost(id: string, postData: Partial<Post>): Promise<Post | null> {
  console.log('📝 Atualizando post:', id);
  
  try {
    const data = await api.put<any>(`/posts/${id}`, postData as any);
    console.log(`✅ Post ${id} atualizado com sucesso`);
    return mapApiResponseToPost(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar post:', error);
    return null;
  }
}

// --- Compatibilidade com PostForm

// Buscar posts para o formulário
export async function getPostForEdit(id: string): Promise<any> {
  const post = await getPostById(id);
  if (!post) return null;
  
  // Retornar no formato esperado pelo PostForm
  return {
    id: post.id,
    titulo: post.titulo,
    subtitulo: post.subtitulo,
    chapeu: post.chapeu,
    conteudo: post.conteudo,
    categoria: post.categoria,
    autor: post.autor,
    posicao: post.posicao,
    imagemUrl: post.imagemUrl,
    tags: post.tags || [],
    publishedAt: post.dataPublicacao
  };
}

// --- Helpers utilitários

// Garantir que sempre retornamos um array
export function ensureArray(data: any): Post[] {
  if (Array.isArray(data)) return data;
  if (data?.posts && Array.isArray(data.posts)) return data.posts;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

// Salvar posts no localStorage (fallback)
function savePostsToLocalStorage(posts: Post[]) {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.warn('Erro ao salvar posts no localStorage:', error);
  }
}

// Carregar posts do localStorage
function loadPostsFromLocalStorage(): Post[] {
  try {
    const data = localStorage.getItem(POSTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('Erro ao carregar posts do localStorage:', error);
    return [];
  }
}

// --- Inicialização

// Precarregar dados estáticos se necessário
if (OFFLINE_ONLY) {
  console.log('📱 Modo offline forçado ativado, precarregando dados estáticos...');
  preloadOfflineFromStatic();
}

// Função para buscar posts por posição específica
export async function getPostsByPosition(posicao: string, limit?: number): Promise<Post[]> {
  console.log('🔍 Buscando posts por posição:', posicao, limit ? `(limite: ${limit})` : '');
  
  try {
    // Tentar filtrar pela API para reduzir carga e evitar divergências
  let fetched = await getPosts({ posicao, limit });
    console.log('🔍 Posts retornados da API:', fetched.length, fetched.map(p => ({ id: p.id, titulo: p.titulo, posicao: p.posicao })));
    
    // Por segurança, filtrar novamente no cliente com normalização
    const want = normalizePos(posicao);
    console.log('🔍 Posição normalizada procurada:', want);
    
    let filteredPosts = fetched.filter(post => {
      const p = normalizePos(post.posicao || '');
      console.log('🔍 Comparando:', post.posicao, '->', p, '===', want, '?', p === want);
      return p === want;
    });
    
    // Aplicar limite se especificado
    if (limit && limit > 0) {
      filteredPosts = filteredPosts.slice(0, limit);
    }
    
    // Fallback: se nada passou no filtro mas a API retornou itens, devolve os primeiros
    if (filteredPosts.length === 0 && fetched.length > 0) {
      console.warn(`⚠️ Nenhum item bateu exatamente com posicao="${posicao}" após normalização. Devolvendo ${Math.min(limit || fetched.length, fetched.length)} itens como fallback.`);
      filteredPosts = (limit && limit > 0) ? fetched.slice(0, limit) : fetched;
    }

    console.log(`✅ Encontrados ${filteredPosts.length} posts com posição "${posicao}"`);
    return filteredPosts;
  } catch (error) {
    console.error('❌ Erro ao buscar posts por posição:', error);
    return [];
  }
}

// Alias para compatibilidade - função para buscar posts como array
export async function fetchPostsArray(limit?: number): Promise<Post[]> {
  console.log('🔍 Buscando array de posts', limit ? `(limite: ${limit})` : '');
  
  try {
    const allPosts = await getPosts();
    let posts = allPosts;
    
    // Aplicar limite se especificado
    if (limit && limit > 0) {
      posts = posts.slice(0, limit);
    }
    
    console.log(`✅ Retornando ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('❌ Erro ao buscar array de posts:', error);
    return [];
  }
}

// Fallback direto para destacar posts por posicao=destaque
export async function getHighlights(limit = 5): Promise<Post[]> {
  try {
    const url = `${API_BASE_URL}/posts?posicao=destaque&limit=${limit}`;
    const data: any = await fetchJSON<any>(url);
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.posts) ? data.posts : []));
    return arr.map(mapApiResponseToPost);
  } catch (e) {
    console.warn('⚠️ getHighlights fallback falhou, retornando []', e);
    return [];
  }
}

// Top artigos mais lidos
export async function getMostRead(limit = 5): Promise<Post[]> {
  try {
    const url = `${API_BASE_URL}/posts/most-read?limit=${limit}`;
    const data: any = await fetchJSON<any>(url);
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.posts)
          ? data.posts
          : [];
    return arr.map(mapApiResponseToPost);
  } catch (e) {
    console.warn('⚠️ getMostRead falhou, retornando []', e);
    return [];
  }
}

// Função para inicializar o serviço de posts
export async function initService(): Promise<void> {
  console.log('🔧 Inicializando serviço de posts...');
  
  try {
    // Testar conexão com a API
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Conexão com API de posts estabelecida');
    } else {
      console.warn('⚠️ API de posts não está respondendo, mas prosseguindo...');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao testar conexão com API de posts:', error);
  }
  
  console.log('✅ Serviço de posts inicializado');
}

export type { Post };
