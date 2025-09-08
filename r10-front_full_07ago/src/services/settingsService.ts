// Tipos e interfaces para configurações
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  seo: {
    googleAnalyticsId?: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  features: {
    commentsEnabled: boolean;
    newsletterEnabled: boolean;
    breakingNewsEnabled: boolean;
    darkModeEnabled: boolean;
  };
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  notifications: boolean;
  savedArticles: string[]; // IDs de artigos salvos
}

// Chaves para armazenamento no localStorage
const SETTINGS_STORAGE_KEY = 'r10_settings';
const USER_PREFS_STORAGE_KEY = 'r10_user_preferences';

// Funções auxiliares para localStorage
const loadSettingsFromStorage = (): SiteSettings | null => {
  const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return storedSettings ? JSON.parse(storedSettings) : null;
};

const saveSettingsToStorage = (settings: SiteSettings): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

const loadUserPreferencesFromStorage = (userId: string): UserPreferences | null => {
  const storedPrefs = localStorage.getItem(`${USER_PREFS_STORAGE_KEY}_${userId}`);
  return storedPrefs ? JSON.parse(storedPrefs) : null;
};

const saveUserPreferencesToStorage = (prefs: UserPreferences): void => {
  localStorage.setItem(`${USER_PREFS_STORAGE_KEY}_${prefs.userId}`, JSON.stringify(prefs));
};

// Funções de gerenciamento de configurações
export const getSettings = async (): Promise<SiteSettings> => {
  let settings = loadSettingsFromStorage();
  
  if (!settings) {
    settings = getDefaultSettings();
    saveSettingsToStorage(settings);
  }
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(settings!), 300);
  });
};

export const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<SiteSettings> => {
  const currentSettings = await getSettings();
  
  const updatedSettings: SiteSettings = {
    ...currentSettings,
    ...newSettings
  };
  
  saveSettingsToStorage(updatedSettings);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(updatedSettings), 300);
  });
};

// Funções de gerenciamento de preferências do usuário
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  let preferences = loadUserPreferencesFromStorage(userId);
  
  if (!preferences) {
    preferences = getDefaultUserPreferences(userId);
    saveUserPreferencesToStorage(preferences);
  }
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(preferences!), 300);
  });
};

export const updateUserPreferences = async (userId: string, newPreferences: Partial<UserPreferences>): Promise<UserPreferences> => {
  const currentPreferences = await getUserPreferences(userId);
  
  const updatedPreferences: UserPreferences = {
    ...currentPreferences,
    ...newPreferences,
    userId // Garantir que o ID do usuário não seja alterado
  };
  
  saveUserPreferencesToStorage(updatedPreferences);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(updatedPreferences), 300);
  });
};

// Funções específicas para artigos salvos
export const saveArticle = async (userId: string, articleId: string): Promise<UserPreferences> => {
  const prefs = await getUserPreferences(userId);
  
  if (!prefs.savedArticles.includes(articleId)) {
    return updateUserPreferences(userId, {
      savedArticles: [...prefs.savedArticles, articleId]
    });
  }
  
  return prefs;
};

export const removeSavedArticle = async (userId: string, articleId: string): Promise<UserPreferences> => {
  const prefs = await getUserPreferences(userId);
  
  return updateUserPreferences(userId, {
    savedArticles: prefs.savedArticles.filter(id => id !== articleId)
  });
};

// Valores padrão
const getDefaultSettings = (): SiteSettings => {
  return {
    siteName: 'R10 Piauí',
    siteDescription: 'Portal de Notícias do Piauí',
    logo: '/uploads/imagens/logor10.png',
    favicon: '/favicon.ico',
    primaryColor: '#E53E3E',
    secondaryColor: '#444444',
    socialLinks: {
      facebook: 'https://facebook.com/r10piaui',
      instagram: 'https://instagram.com/r10piaui',
      youtube: 'https://youtube.com/r10piaui',
      whatsapp: 'https://wa.me/5586999999999'
    },
    contactInfo: {
      email: 'contato@r10piaui.com',
      phone: '(86) 99999-9999',
      address: 'Teresina, Piauí'
    },
    seo: {
      metaDescription: 'Portal de notícias do Piauí com as últimas informações sobre política, esportes, entretenimento e mais.',
      metaKeywords: ['notícias', 'Piauí', 'Teresina', 'jornalismo', 'política', 'esporte']
    },
    features: {
      commentsEnabled: true,
      newsletterEnabled: true,
      breakingNewsEnabled: true,
      darkModeEnabled: false
    }
  };
};

const getDefaultUserPreferences = (userId: string): UserPreferences => {
  return {
    userId,
    theme: 'system',
    fontSize: 'medium',
    notifications: true,
    savedArticles: []
  };
};

// Inicializar configurações padrão
export const initializeSettings = () => {
  const settings = loadSettingsFromStorage();
  if (!settings) {
    saveSettingsToStorage(getDefaultSettings());
  }
}; 