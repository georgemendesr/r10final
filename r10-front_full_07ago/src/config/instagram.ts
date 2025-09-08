// Configuração do Instagram Auto-post
export const INSTAGRAM_CONFIG = {
  // Credenciais do Instagram Business
  BUSINESS_ID: process.env.IG_BUSINESS_ID || process.env.IG_USER_ID,
  ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN,
  GRAPH_VERSION: process.env.IG_GRAPH_VERSION || 'v19.0',
  
  // URLs do site
  SITE_URL: process.env.SITE_URL || 'http://localhost:8080',
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'http://localhost:8080',
  
  // Configurações de temporário
  TEMP_SECRET: process.env.SOCIAL_TMP_SECRET || 'r10',
  TEMP_TTL_MIN: Number(process.env.SOCIAL_TMP_TTL_MIN || '20'),
  
  // URLs da API
  API_BASE: import.meta.env.DEV
    ? 'http://localhost:8080'
    : (process.env.SITE_URL || 'http://localhost:8080'),
  
  // Endpoints
  ENDPOINTS: {
    GENERATE: '/api/social/generate',
    PUBLISH: '/api/social/instagram/publish',
    PREVIEW: '/api/social/generate/preview',
    PUBLISH_NEW: '/api/social/instagram/publish-new'
  }
} as const;

// Validação das credenciais
export function validateInstagramConfig(): string[] {
  const errors: string[] = [];
  
  if (!INSTAGRAM_CONFIG.BUSINESS_ID) {
    errors.push('IG_BUSINESS_ID ou IG_USER_ID não configurado');
  }
  
  if (!INSTAGRAM_CONFIG.ACCESS_TOKEN) {
    errors.push('IG_ACCESS_TOKEN não configurado');
  }
  
  return errors;
}

// Helper para obter URL completa da API
export function getApiUrl(endpoint: keyof typeof INSTAGRAM_CONFIG.ENDPOINTS): string {
  return `${INSTAGRAM_CONFIG.API_BASE}${INSTAGRAM_CONFIG.ENDPOINTS[endpoint]}`;
}

// Tipos para TypeScript
export type InstagramPostType = 'feed' | 'story';
export type InstagramPostData = {
  title: string;
  hat?: string;
  imageUrl?: string;
  editorial?: string;
  postId?: string;
}; 