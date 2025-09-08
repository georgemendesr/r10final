import { Post, PostFilters, PostsResponse } from '../types/Post';
import { LS_KEY, readAllOffline, normalizePos, preloadOfflineFromStatic } from './offlineCache';

// MODO OFFLINE FORÇADO - SEM API
const OFFLINE_ONLY = (import.meta.env.VITE_OFFLINE_ONLY === 'true');
export let OFFLINE_MODE = OFFLINE_ONLY;

// Função para ordenar posts por data de publicação (mais recentes primeiro)
const sortDesc = (a:any,b:any) => new Date(b.publishedAt||0).getTime() - new Date(a.publishedAt||0).getTime();

// URL da API PostgreSQL
const API_BASE_URL = 'http://localhost:3001/api';

// Chave para localStorage
const POSTS_STORAGE_KEY = 'r10_posts';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
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

// Interface para compatibilidade com componentes antigos
interface LegacyPostsResult {
  posts: Post[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Função para mapear dados offline para o formato do frontend
const mapOfflinePostToPost = (offlineData: any): Post => {
  const publishedAt = offlineData.publishedAt || new Date().toISOString();
  const autor = offlineData.autor || 'R10 Piauí';
  const categoria = 'Geral';

  const mappedPost: any = {
    id: offlineData.id.toString(),
    titulo: offlineData.titulo || '',
    subtitulo: offlineData.subtitulo || '',
    chapeu: '',
    conteudo: '',
    posicao: offlineData.posicao || 'GERAL',
    categoria: categoria,
    autor: autor,
    dataPublicacao: publishedAt,
    imagemUrl: offlineData.imagemUrl || '',
    visualizacoes: 0,
    
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
    titulo: apiData.titulo || '',
    subtitulo: apiData.subtitulo || '',
    chapeu: apiData.chapeu || '',
    conteudo: apiData.conteudo || '',
    posicao: apiData.posicao || 'noticia-comum',
    categoria: categoria,
    autor: autor,
    dataPublicacao: publishedAt,
    imagemUrl: apiData.imagemUrl || '',
    visualizacoes: apiData.visualizacoes || 0,
    
    // Propriedades de compatibilidade (inglês) - para manter PostsManager funcionando
    title: apiData.titulo || '',
    subtitle: apiData.subtitulo || '',
    content: apiData.conteudo || '',
    author: autor,
    publishDate: publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    imagemDestaque: apiData.imagemUrl || '',
    subcategorias: [categoria],
    status: 'published',
    tags: [categoria],
    resumo: apiData.subtitulo || '',
    fonte: 'R10 Piauí Pulse',
    views: apiData.visualizacoes || 0,
    slug: `${apiData.id}-${(apiData.titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`
  };
  
  return mappedPost as Post;
};

// --- Novos Fetchers Padronizados
export async function fetchPostsPage(params: Record<string, string | number>): Promise<PagedPosts> {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  
  // MODO OFFLINE FORÇADO
  if (OFFLINE_ONLY) {
    console.log(`📦 OFFLINE-ONLY: Paginando posts (página ${page}, limite ${limit})`);
    const all = readAllOffline().slice().sort(sortDesc);
    const start = (page-1) * limit;
    const items = all.slice(start, start + limit).map(mapOfflinePostToPost);
    const total = all.length;
    const pages = Math.ceil(total / limit);
    console.log(`📦 OFFLINE: ${items.length}/${total} posts (página ${page}/${pages})`);
    return { items, total, page, pages, limit };
  }

  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
  
  // 🔧 HOTFIX: Adicionar admin=1 por padrão para evitar filtro de ano
  if (!q.has('admin')) {
    q.set('admin', '1');
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/posts?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return toPaged(data);
  } catch (error) {
    console.warn('❌ API down, usando paginação offline:', error);
    const all = readAllOffline().slice().sort(sortDesc);
    const start = (page-1) * limit;
    const items = all.slice(start, start + limit).map(mapOfflinePostToPost);
    const total = all.length;
    const pages = Math.ceil(total / limit);
    return { items, total, page, pages, limit };
  }
}

// Quando precisar só de lista (array) com FALLBACK OFFLINE:
export async function fetchPostsArray(params: Record<string, string | number> = {}, limit = 100): Promise<Post[]> {
  // MODO OFFLINE FORÇADO - SEM TENTAR API
  if (OFFLINE_ONLY) {
    return readAllOffline().slice().sort(sortDesc).slice(0, limit);
  }
  
  const url = `${API_BASE_URL}/posts?page=1&limit=${limit}&admin=1`;
  
  try {
    const data = await fetchJSON<{ items:any[] }>(url);
    return data.items?.map(mapApiResponseToPost) ?? [];
  } catch (error) {
    console.warn('API down, usando offline recent', error);
    return readAllOffline().slice().sort(sortDesc).slice(0, limit);
  }
}

// Utilitários para garantir arrays
export const ensureArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
export const fromPage = <T,>(v: any): T[] => Array.isArray(v?.items) ? v.items : ensureArray<T>(v);

// Nova função getPosts com assinatura corrigida e fallback para localStorage
export const getPosts = async (
  filters?: PostFilters,
  page: number = 1,
  limit: number = 20
): Promise<LegacyPostsResult> => {
  // Primeiro, tenta buscar da API PostgreSQL
  try {
    // 🔧 HOTFIX: Adicionar admin=1 para dashboard funcionar (sem filtro de ano)
    let url = `${API_BASE_URL}/posts?page=${page}&limit=${limit}&admin=1`;
    
    if (filters?.posicao && filters.posicao !== 'todas') {
      url += `&position=${filters.posicao}`;
    }
    
    if (filters?.categoria && filters.categoria !== 'todas') {
      url += `&categoria=${filters.categoria}`;
    }

    console.log('🔍 Tentando buscar dados da API PostgreSQL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Encontradas ${data.posts?.length || 0} matérias na API PostgreSQL`);

    return {
      posts: data.posts || [],
      totalCount: data.totalPosts || 0,
      totalPages: data.totalPages || 0,
      currentPage: data.currentPage || 1
    };
  } catch (error) {
    console.error('❌ API PostgreSQL indisponível, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    try {
      const storedData = localStorage.getItem(POSTS_STORAGE_KEY);
      if (!storedData) {
        console.log('📂 Nenhum dado encontrado no localStorage');
        return {
          posts: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: 1
        };
      }

      const parsedData = JSON.parse(storedData);
      const allPosts: Post[] = Array.isArray(parsedData) ? parsedData : (parsedData.posts || []);
      console.log(`📂 Encontradas ${allPosts.length} matérias no localStorage`);

      // Aplicar filtros se fornecidos
      let filteredPosts = allPosts;
      
      if (filters?.posicao && filters.posicao !== 'todas') {
        filteredPosts = filteredPosts.filter(post => post.posicao === filters.posicao);
      }
      
      if (filters?.categoria && filters.categoria !== 'todas') {
        filteredPosts = filteredPosts.filter(post => post.categoria === filters.categoria);
      }

      // Aplicar paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        totalCount: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit),
        currentPage: page
      };
    } catch (localStorageError) {
      console.error('❌ Erro ao buscar dados do localStorage:', localStorageError);
      return {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
  }
};

// Buscar posts por posição específica com FALLBACK OFFLINE
export const getPostsByPosition = async (posicao: string, limit = 20): Promise<Post[]> => {
  const p = normalizePos(posicao);
  
  // MODO OFFLINE FORÇADO - SEM TENTAR API
  if (OFFLINE_ONLY) {
    console.log(`📦 OFFLINE-ONLY: Buscando ${p} (${limit} posts)`);
    const offlinePosts = readAllOffline().filter(i => i.posicao === p).slice(0, limit);
    console.log(`📦 OFFLINE: ${offlinePosts.length} posts para ${p}`);
    return offlinePosts.map(mapOfflinePostToPost);
  }

  const url = `${API_BASE_URL}/posts?posicao=${encodeURIComponent(p)}&limit=${limit}&admin=1`;
  
  try {
    console.log(`🔍 Buscando posts na posição: ${posicao} (normalizado: ${p})`);
    const data = await fetchJSON<{ items: any[] }>(url);
    
    if (Array.isArray(data.items) && data.items.length) {
      console.log(`✅ API: Encontrados ${data.items.length} posts na posição ${p}`);
      return data.items.map(mapApiResponseToPost);
    } else {
      throw new Error('API retornou lista vazia');
    }
  } catch (error) {
    console.warn(`❌ API down para posição ${p}, usando offline:`, error);
    const offlinePosts = readAllOffline().filter(i => i.posicao === p).slice(0, limit);
    console.log(`📦 Offline: ${offlinePosts.length} posts para ${p}`);
    return offlinePosts.map(mapOfflinePostToPost);
  }
};

// Função para rotação automática da supermanchete
export const promoteToSupermanchete = async (postId: string): Promise<void> => {
  try {
    console.log(`🔄 Promovendo post ${postId} para supermanchete...`);
    
    // 1. Primeiro, buscar o post atual da supermanchete
    const currentSupermanchete = await getSupermanchete();
    
    // 2. Se existe uma supermanchete atual, mover para destaque
    if (currentSupermanchete) {
      console.log(`📰 Movendo supermanchete anterior (ID: ${currentSupermanchete.id}) para destaque`);
      await updatePostPosition(currentSupermanchete.id, 'destaque');
    }
    
    // 3. Promover o novo post para supermanchete
    console.log(`⬆️ Promovendo post ${postId} para supermanchete`);
    await updatePostPosition(postId, 'supermanchete');
    
    console.log(`✅ Rotação da supermanchete concluída!`);
  } catch (error) {
    console.error('❌ Erro na rotação da supermanchete:', error);
    throw error;
  }
};

// Função para atualizar posição do post
export const updatePostPosition = async (postId: string, novaPosicao: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ posicao: novaPosicao })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`✅ Posição do post ${postId} atualizada para: ${novaPosicao}`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar posição do post ${postId}:`, error);
    throw error;
  }
};

// Buscar supermanchete
export const getSupermanchete = async (): Promise<Post | null> => {
  try {
    const posts = await getPostsByPosition('supermanchete');
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Erro ao buscar supermanchete:', error);
    return null;
  }
};

// Buscar manchetes principais (agora mapeado para 'destaque')
export const getManchetePrincipal = async (): Promise<Post[]> => {
  try {
    return await getPostsByPosition('destaque');
  } catch (error) {
    console.error('Erro ao buscar manchetes principais:', error);
    return [];
  }
};

// Buscar destaques principais (agora mapeado para 'destaque')
export const getDestaquePrincipal = async (): Promise<Post[]> => {
  try {
    return await getPostsByPosition('destaque');
  } catch (error) {
    console.error('Erro ao buscar destaques principais:', error);
    return [];
  }
};

// Buscar destaques secundários (agora mapeado para 'geral')
export const getDestaqueSecundario = async (): Promise<Post[]> => {
  try {
    return await getPostsByPosition('geral');
  } catch (error) {
    console.error('Erro ao buscar destaques secundários:', error);
    return [];
  }
};

// Buscar notícias comuns
export const getNoticiasComuns = async (limit: number = 20): Promise<Post[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts?position=noticia-comum&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar notícias comuns:', error);
    return [];
  }
};

// Buscar post por ID
export const getPostById = async (id: string): Promise<Post | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar post por ID:', error);
    return null;
  }
};

// Buscar categorias disponíveis
export const getCategorias = async (): Promise<{ categoria: string; total: number }[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
};

// Buscar estatísticas gerais
export const getStats = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { total: 0, supermanchete: 0, manchete: 0, destaque: 0 };
  }
};

// Função para teste de conectividade
export const testConnection = async (): Promise<boolean> => {
  // MODO OFFLINE FORÇADO - não tenta conexão
  if (OFFLINE_ONLY) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return false;
  }
};

// Função para inicializar o serviço
export const initService = async (): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Serviço MySQL conectado com sucesso!');
    } else {
      console.error('❌ Não foi possível conectar com a API MySQL');
    }
  } catch (error) {
    console.error('Erro ao inicializar serviço:', error);
  }
};

// Função para deletar post (não implementada para MySQL)
export const deletePost = async (id: string): Promise<boolean> => {
  console.warn('deletePost não implementado para MySQL API');
  return false;
};

// Exportações para compatibilidade com código existente
export const createPost = async (postData: Partial<Post>): Promise<Post | null> => {
  console.warn('createPost não implementado para MySQL API');
  return null;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<Post | null> => {
  console.warn('updatePost não implementado para MySQL API');
  return null;
};

export const getAllPosts = async (): Promise<Post[]> => {
  const result = await getPosts({}, 1, 1000);
  return result.posts;
};

export const searchPosts = async (searchTerm: string): Promise<Post[]> => {
  console.warn('searchPosts não implementado para MySQL API - use getPosts com filtros');
  return [];
};

// Exportar Post interface para compatibilidade
export type { Post };
