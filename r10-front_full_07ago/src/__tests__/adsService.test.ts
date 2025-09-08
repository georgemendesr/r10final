import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adsService } from '../services/adsService';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do gtag
Object.defineProperty(window, 'gtag', {
  value: vi.fn(),
});

describe('AdsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getBanners', () => {
    it('retorna banners padrão quando localStorage está vazio', () => {
      const banners = adsService.getBanners();
      expect(banners).toHaveLength(5);
      expect(banners[0]).toHaveProperty('id');
      expect(banners[0]).toHaveProperty('titulo');
      expect(banners[0]).toHaveProperty('cliente');
    });

    it('retorna banners do localStorage quando disponível', () => {
      const mockBanners = [
        {
          id: 'test',
          titulo: 'Test Banner',
          cliente: 'Test Client',
          imagem: 'test.jpg',
          link: 'http://test.com',
          posicao: 'top-strip',
          tipo: 'imagem',
          tamanho: '728x90',
          status: 'ativo',
          dataInicio: new Date().toISOString(),
          dataFim: new Date().toISOString(),
          impressoesAtuais: 0,
          cliquesAtuais: 0,
          prioridade: 1,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBanners));
      
      const banners = adsService.getBanners();
      expect(banners).toEqual(mockBanners);
    });
  });

  describe('getAvailablePositions', () => {
    it('retorna todas as posições disponíveis', () => {
      const positions = adsService.getAvailablePositions();
      expect(positions).toHaveLength(5);
      expect(positions.map(p => p.value)).toContain('top-strip');
      expect(positions.map(p => p.value)).toContain('super-banner');
      expect(positions.map(p => p.value)).toContain('news-sidebar');
      expect(positions.map(p => p.value)).toContain('sidebar-article');
      expect(positions.map(p => p.value)).toContain('in-content');
    });
  });

  describe('getStandardSizes', () => {
    it('retorna todos os tamanhos padrão', () => {
      const sizes = adsService.getStandardSizes();
      expect(sizes).toHaveLength(7);
      expect(sizes.map(s => s.value)).toContain('728x90');
      expect(sizes.map(s => s.value)).toContain('300x250');
      expect(sizes.map(s => s.value)).toContain('970x250');
    });
  });

  describe('getBannerStats', () => {
    it('calcula estatísticas corretamente', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        {
          id: 'test1',
          impressoesAtuais: 1000,
          cliquesAtuais: 50,
          cpm: 5.0
        },
        {
          id: 'test2',
          impressoesAtuais: 2000,
          cliquesAtuais: 100,
          cpc: 1.0
        }
      ]));

      const stats = adsService.getBannerStats();
      expect(stats.impressoes).toBe(3000);
      expect(stats.cliques).toBe(150);
      expect(stats.ctr).toBe(5.0); // 150/3000 * 100
    });
  });

  describe('registerImpression', () => {
    it('incrementa impressões do banner', () => {
      const mockBanners = [
        {
          id: 'test',
          impressoesAtuais: 10,
          dataAtualizacao: '2023-01-01T00:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBanners));
      
      adsService.registerImpression('test');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].impressoesAtuais).toBe(11);
    });
  });

  describe('registerClick', () => {
    it('incrementa cliques do banner', () => {
      const mockBanners = [
        {
          id: 'test',
          cliquesAtuais: 5,
          dataAtualizacao: '2023-01-01T00:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBanners));
      
      adsService.registerClick('test');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].cliquesAtuais).toBe(6);
    });
  });
}); 