import { get, post, put, del } from './api';

export interface Banner {
  id: string;
  titulo: string;
  cliente: string;
  imagem: string;
  link: string;
  posicao: 'top-strip' | 'super-banner' | 'sidebar-article' | 'in-content' | 'news-sidebar';
  tipo: 'imagem' | 'html' | 'video' | 'gif';
  tamanho: '728x90' | '300x250' | '160x600' | '320x50' | '970x250' | '300x600' | 'personalizado';
  status: 'ativo' | 'pausado' | 'expirado' | 'agendado';
  dataInicio: string;
  dataFim: string;
  impressoesMax?: number;
  cliquesMax?: number;
  impressoesAtuais: number;
  cliquesAtuais: number;
  cpm?: number;
  cpc?: number;
  valorTotal?: number;
  prioridade: 1 | 2 | 3 | 4 | 5;
  segmentacao?: {
    categorias?: string[];
    dispositivos?: ('desktop' | 'tablet' | 'mobile')[];
    horarios?: string[];
    dias?: string[];
  };
  conteudoHtml?: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export type NewBanner = Omit<Banner, 'id' | 'impressoesAtuais' | 'cliquesAtuais' | 'dataCriacao' | 'dataAtualizacao'>;

export async function listBanners(authenticated: boolean = true): Promise<Banner[]> {
  const path = authenticated ? `/banners` : `/banners/public`;
  const res = await get<{ items: Banner[] }>(path);
  return res.items || [];
}

export async function createBanner(data: NewBanner): Promise<Banner> {
  return post<Banner>(`/banners`, data as any);
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
  return put<Banner>(`/banners/${id}`, updates as any);
}

export async function deleteBanner(id: string): Promise<{ ok: boolean } | Banner> {
  return del<any>(`/banners/${id}`);
}

export function getAvailablePositions(): Array<{ value: Banner['posicao']; label: string; description: string }>{
  return [
    { value: 'top-strip', label: 'Topo da Página', description: 'Banner horizontal no topo (728x90)' },
    { value: 'super-banner', label: 'Super Banner', description: 'Na NewsGeneralSection (970x250)' },
    { value: 'news-sidebar', label: 'Sidebar Notícias', description: 'Coluna direita da NewsGeneralSection (w-full h-80)' },
    { value: 'sidebar-article', label: 'Sidebar Artigo', description: 'AdBox na página de artigo (300x250)' },
    { value: 'in-content', label: 'Dentro do Texto', description: 'No meio do conteúdo (300x250)' }
  ];
}

export function getStandardSizes(): Array<{ value: Banner['tamanho']; label: string; dimensions: string }>{
  return [
    { value: '728x90', label: 'Leaderboard', dimensions: '728x90px' },
    { value: '300x250', label: 'Medium Rectangle', dimensions: '300x250px' },
    { value: '160x600', label: 'Wide Skyscraper', dimensions: '160x600px' },
    { value: '320x50', label: 'Mobile Banner', dimensions: '320x50px' },
    { value: '970x250', label: 'Billboard', dimensions: '970x250px' },
    { value: '300x600', label: 'Half Page', dimensions: '300x600px' },
    { value: 'personalizado', label: 'Personalizado', dimensions: 'Definir manualmente' }
  ];
}

export function computeBannerStats(banners: Banner[]): { impressoes: number; cliques: number; ctr: number; receita: number; periodo: string }{
  const impressoes = banners.reduce((s, b) => s + (b.impressoesAtuais || 0), 0);
  const cliques = banners.reduce((s, b) => s + (b.cliquesAtuais || 0), 0);
  const ctr = impressoes > 0 ? Number(((cliques / impressoes) * 100).toFixed(2)) : 0;
  const receita = banners.reduce((sum, b) => {
    let val = 0;
    if (b.cpm && b.impressoesAtuais) val += (b.impressoesAtuais / 1000) * b.cpm;
    if (b.cpc && b.cliquesAtuais) val += b.cliquesAtuais * b.cpc;
    if (b.valorTotal) val += b.valorTotal;
    return sum + val;
  }, 0);
  return { impressoes, cliques, ctr, receita: Number(receita.toFixed(2)), periodo: 'total' };
}

export async function uploadImage(file: File): Promise<string> {
  // Temporário: converter para DataURL. Futuro: endpoint de upload.
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo deve ser uma imagem'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result || ''));
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function selectActiveByPosition(position: Banner['posicao'], banners: Banner[]): Banner | null {
  const now = new Date();
  const eligible = banners
    .filter(b => b.posicao === position)
    .filter(b => b.status !== 'pausado')
    .filter(b => {
      const ini = b.dataInicio ? new Date(b.dataInicio) : null;
      const fim = b.dataFim ? new Date(b.dataFim) : null;
      if (ini && now < ini) return false;
      if (fim && now > fim) return false;
      if (b.impressoesMax && b.impressoesAtuais >= b.impressoesMax) return false;
      if (b.cliquesMax && b.cliquesAtuais >= b.cliquesMax) return false;
      return true;
    })
    .sort((a, b) => (a.prioridade as number) - (b.prioridade as number));
  if (!eligible.length) return null;
  const idx = Math.floor(Date.now() / 10000) % eligible.length;
  return eligible[idx];
}

/**
 * Registra uma impressão (visualização) de banner
 */
export async function recordImpression(bannerId: string): Promise<void> {
  try {
    await post(`/banners/${bannerId}/impressao`, {});
  } catch (error) {
    console.error(`Erro ao registrar impressão do banner ${bannerId}:`, error);
  }
}

/**
 * Registra um clique em banner
 */
export async function recordClick(bannerId: string): Promise<void> {
  try {
    await post(`/banners/${bannerId}/clique`, {});
  } catch (error) {
    console.error(`Erro ao registrar clique do banner ${bannerId}:`, error);
  }
}
