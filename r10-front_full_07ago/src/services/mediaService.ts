// Tipos e interfaces para mídia
export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  alt?: string;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number; // Contador de uso em matérias
}

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MediaFilter {
  type?: MediaType;
  searchTerm?: string;
  tags?: string[];
}

// Chave para armazenamento no localStorage
const MEDIA_STORAGE_KEY = 'r10_media';

// Funções auxiliares para localStorage
const loadMediaFromStorage = (): MediaItem[] => {
  const storedMedia = localStorage.getItem(MEDIA_STORAGE_KEY);
  return storedMedia ? JSON.parse(storedMedia) : [];
};

const saveMediaToStorage = (media: MediaItem[]): void => {
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media));
};

// Gerar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// CRUD de Mídia
export const getMediaItems = async (filters?: MediaFilter): Promise<MediaItem[]> => {
  let mediaItems = loadMediaFromStorage();
  
  // Aplicar filtros se existirem
  if (filters) {
    if (filters.type) {
      mediaItems = mediaItems.filter(item => item.type === filters.type);
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      mediaItems = mediaItems.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    if (filters.tags && filters.tags.length > 0) {
      mediaItems = mediaItems.filter(item => 
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }
  }
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(mediaItems), 300);
  });
};

export const getMediaItemById = async (id: string): Promise<MediaItem | null> => {
  const mediaItems = loadMediaFromStorage();
  const mediaItem = mediaItems.find(item => item.id === id);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(mediaItem || null), 300);
  });
};

export const createMediaItem = async (file: File, metadata: Partial<MediaItem>): Promise<MediaItem> => {
  // Em uma implementação real, aqui faríamos upload para um serviço de armazenamento
  // Para simulação, vamos criar uma URL de dados
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const mediaItems = loadMediaFromStorage();
      
      // Determinar o tipo de mídia com base no MIME type
      let type: MediaType = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      // Criar o item de mídia
      const newMediaItem: MediaItem = {
        id: generateId(),
        title: metadata.title || file.name,
        type,
        url: reader.result as string,
        thumbnailUrl: type === 'image' ? reader.result as string : undefined,
        fileSize: file.size,
        dimensions: metadata.dimensions,
        alt: metadata.alt || file.name,
        tags: metadata.tags || [],
        uploadedBy: metadata.uploadedBy || 'Usuário Atual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };
      
      mediaItems.push(newMediaItem);
      saveMediaToStorage(mediaItems);
      
      setTimeout(() => resolve(newMediaItem), 300);
    };
    
    reader.readAsDataURL(file);
  });
};

export const updateMediaItem = async (id: string, metadata: Partial<MediaItem>): Promise<MediaItem | null> => {
  const mediaItems = loadMediaFromStorage();
  const itemIndex = mediaItems.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return Promise.resolve(null);
  }
  
  const updatedItem: MediaItem = {
    ...mediaItems[itemIndex],
    ...metadata,
    updatedAt: new Date().toISOString()
  };
  
  mediaItems[itemIndex] = updatedItem;
  saveMediaToStorage(mediaItems);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(updatedItem), 300);
  });
};

export const deleteMediaItem = async (id: string): Promise<boolean> => {
  const mediaItems = loadMediaFromStorage();
  const filteredItems = mediaItems.filter(item => item.id !== id);
  
  if (filteredItems.length === mediaItems.length) {
    return Promise.resolve(false);
  }
  
  saveMediaToStorage(filteredItems);
  
  // Simular chamada assíncrona
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 300);
  });
};

// Funções adicionais
export const incrementUsageCount = async (id: string): Promise<void> => {
  const mediaItems = loadMediaFromStorage();
  const itemIndex = mediaItems.findIndex(item => item.id === id);
  
  if (itemIndex !== -1) {
    mediaItems[itemIndex].usageCount += 1;
    saveMediaToStorage(mediaItems);
  }
  
  return Promise.resolve();
};

// Adicionar dados iniciais para teste (remover em produção)
export const initializeTestData = () => {
  // Verificar se já existem itens de mídia
  const existingMedia = loadMediaFromStorage();
  if (existingMedia.length > 0) return;

  const testMedia: MediaItem[] = [
    {
      id: "1",
      title: "Ônibus em Teresina",
      type: "image",
      url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop&crop=center",
      thumbnailUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&h=200&fit=crop&crop=center",
      fileSize: 1024000,
      dimensions: {
        width: 800,
        height: 600
      },
      alt: "Ônibus circulando em avenida de Teresina",
      tags: ["transporte", "Teresina", "urbano"],
      uploadedBy: "João Silva",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 1
    },
    {
      id: "2",
      title: "Festival de Pedro II",
      type: "image",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop&crop=center",
      thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=200&fit=crop&crop=center",
      fileSize: 2048000,
      dimensions: {
        width: 800,
        height: 600
      },
      alt: "Multidão em festival cultural em Pedro II",
      tags: ["festival", "Pedro II", "cultura", "evento"],
      uploadedBy: "Maria Santos",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 1
    },
    {
      id: "3",
      title: "Entrevista com Prefeito",
      type: "audio",
      url: "https://example.com/audio/entrevista-prefeito.mp3",
      fileSize: 5120000,
      alt: "Entrevista com o prefeito de Piripiri",
      tags: ["entrevista", "Piripiri", "prefeito", "áudio"],
      uploadedBy: "Carlos Oliveira",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 1
    }
  ];
  
  saveMediaToStorage(testMedia);
}; 