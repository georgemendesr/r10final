import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdBanner from '../components/AdBanner';
import { adsService } from '../services/adsService';

// Mock do adsService
vi.mock('../services/adsService', () => ({
  adsService: {
    getActiveBanner: vi.fn(),
    registerImpression: vi.fn(),
    registerClick: vi.fn(),
  }
}));

// Mock do IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

const mockBanner = {
  id: 'test-banner',
  titulo: 'Banner de Teste',
  cliente: 'Cliente Teste',
  imagem: 'https://example.com/banner.jpg',
  link: 'https://example.com',
  posicao: 'top-strip' as const,
  tipo: 'imagem' as const,
  tamanho: '728x90' as const,
  status: 'ativo' as const,
  dataInicio: new Date().toISOString(),
  dataFim: new Date(Date.now() + 86400000).toISOString(),
  impressoesAtuais: 100,
  cliquesAtuais: 5,
  prioridade: 1 as const,
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString()
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('renderiza banner quando há banner ativo', () => {
  (adsService.getActiveBanner as any).mockReturnValue(mockBanner);
  
  render(<AdBanner position="top-strip" />);
  
  expect(screen.getByAltText('Banner de Teste')).toBeInTheDocument();
  // Removido: expect(screen.getByText('Publicidade')).toBeInTheDocument();
  // Texto "Publicidade" foi removido conforme solicitado
});

test('não renderiza nada quando não há banner ativo', () => {
  (adsService.getActiveBanner as any).mockReturnValue(null);
  
  const { container } = render(<AdBanner position="top-strip" />);
  
  expect(container.firstChild).toBeNull();
});

test('aplica classes de tamanho corretas para news-sidebar', () => {
  (adsService.getActiveBanner as any).mockReturnValue({
    ...mockBanner,
    posicao: 'news-sidebar'
  });
  
  render(<AdBanner position="news-sidebar" />);
  
  const banner = screen.getByAltText('Banner de Teste');
  expect(banner).toHaveClass('w-full', 'h-80');
});

test('banner não contém informações de desenvolvimento', () => {
  // Mock NODE_ENV para development
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  
  (adsService.getActiveBanner as any).mockReturnValue(mockBanner);
  
  render(<AdBanner position="top-strip" />);
  
  // Verifica que NÃO existem informações de desenvolvimento
  expect(screen.queryByText(/Cliente: Cliente Teste/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/CTR:/i)).not.toBeInTheDocument();
  
  // Restaura o NODE_ENV original
  process.env.NODE_ENV = originalEnv;
}); 