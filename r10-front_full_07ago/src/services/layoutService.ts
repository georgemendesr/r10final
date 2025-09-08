// src/services/layoutService.ts

export type SectionKey = 
  | 'superManchete' 
  | 'destaques' 
  | 'noticiasGerais' 
  | 'maisLidas' 
  | 'reacoes' 
  | 'r10Play' 
  | 'municipios';

export interface Section {
  id: SectionKey;
  name: string;
  enabled: boolean;
}

const LAYOUT_STORAGE_KEY = 'r10_homepage_layout';

// Ordem e estado padrão das seções
const defaultSections: Section[] = [
  { id: 'superManchete', name: 'Super Manchete', enabled: true },
  { id: 'destaques', name: 'Destaques (Hero Grid)', enabled: true },
  { id: 'noticiasGerais', name: 'Notícias Gerais (com Banner)', enabled: true },
  { id: 'maisLidas', name: 'Mais Lidas', enabled: true },
  { id: 'reacoes', name: 'Reações dos Leitores', enabled: true },
  { id: 'r10Play', name: 'R10 Play', enabled: true },
  { id: 'municipios', name: 'Municípios', enabled: true },
];

export const getLayoutConfig = (): Section[] => {
  try {
    const storedOrder = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (storedOrder) {
      const parsedOrder: Section[] = JSON.parse(storedOrder);
      
      // Garante que todas as seções padrão existam na configuração salva.
      // Isso permite adicionar novas seções no código sem quebrar a configuração do usuário.
      const allSectionIds = new Set(parsedOrder.map(s => s.id));
      const missingSections = defaultSections.filter(s => !allSectionIds.has(s.id));
      
      // Atualiza as seções existentes com quaisquer novas propriedades (como 'enabled')
      const updatedOrder = parsedOrder.map(storedSection => {
        const defaultSection = defaultSections.find(d => d.id === storedSection.id);
        return { ...defaultSection, ...storedSection };
      });

      return [...updatedOrder, ...missingSections];
    }
    return defaultSections;
  } catch (error) {
    console.error("Falha ao carregar a configuração de layout do localStorage", error);
    return defaultSections;
  }
};

export const saveLayoutConfig = (sections: Section[]): void => {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(sections));
  } catch (error) {
    console.error("Falha ao salvar a configuração de layout no localStorage", error);
  }
};

// ========== CONFIGURAÇÃO DE LAYOUTS DO HEROGRID ==========

export type HeroGridLayoutType = 'original' | 'vertical' | 'mosaico' | 'premium';

const HERO_LAYOUT_STORAGE_KEY = 'r10_hero_grid_layout';

// Configuração dos layouts do HeroGrid disponíveis
export const HERO_LAYOUT_CONFIG = {
  original: {
    id: 'original',
    name: 'Layout Original',
    description: 'Layout clássico com supermanchete + grid lateral',
    icon: '📰',
    component: 'HeroGrid'
  },
  vertical: {
    id: 'vertical',
    name: 'Layout Vertical',
    description: 'Manchete principal em destaque total + grid horizontal de 4 notícias',
    icon: '📋',
    component: 'HeroGridVertical'
  },
  mosaico: {
    id: 'mosaico',
    name: 'Layout Mosaico',
    description: 'Grid assimétrico estilo revista 2/3 + 1/3 + linha inferior',
    icon: '🎨',
    component: 'HeroGridMosaico'
  },
  premium: {
    id: 'premium',
    name: 'Layout Premium',
    description: 'Design magazine profissional com hero gigante + seção trending',
    icon: '🏆',
    component: 'HeroGridPremium'
  }
} as const;

// Função para obter o layout ativo do HeroGrid
export const getActiveHeroLayout = (): HeroGridLayoutType => {
  try {
    const saved = localStorage.getItem(HERO_LAYOUT_STORAGE_KEY);
    return (saved as HeroGridLayoutType) || 'original';
  } catch (error) {
    console.error("Erro ao carregar layout do HeroGrid", error);
    return 'original';
  }
};

// Função para definir o layout ativo do HeroGrid
export const setActiveHeroLayout = (layout: HeroGridLayoutType): void => {
  try {
    localStorage.setItem(HERO_LAYOUT_STORAGE_KEY, layout);
    console.log(`🎨 Layout do HeroGrid alterado para: ${HERO_LAYOUT_CONFIG[layout].name}`);
    
    // Força refresh da página para aplicar o novo layout
    window.location.reload();
  } catch (error) {
    console.error("Erro ao salvar layout do HeroGrid", error);
  }
};

// Função para obter a configuração do layout ativo do HeroGrid
export const getActiveHeroLayoutConfig = () => {
  const activeLayout = getActiveHeroLayout();
  return HERO_LAYOUT_CONFIG[activeLayout];
};
