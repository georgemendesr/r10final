export const SOCIAL = {
  instagram: 'https://www.instagram.com/r10piaui',
  facebook:  'https://www.facebook.com/r10piaui',
  youtube:   'https://www.youtube.com/@r10piaui',
  tiktok:    'https://www.tiktok.com/@r10piaui',
} as const;

export const BRAND_NAME = 'R10 Piauí';

// Tipos para TypeScript
export type SocialPlatform = keyof typeof SOCIAL;
export type SocialUrl = typeof SOCIAL[SocialPlatform];

// Helper para obter todas as URLs como array (útil para SEO)
export const getSocialUrls = (): string[] => Object.values(SOCIAL);

// Helper para obter informações de uma rede específica
export const getSocialInfo = (platform: SocialPlatform) => ({
  url: SOCIAL[platform],
  handle: '@r10piaui',
  name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} do ${BRAND_NAME}`
}); 