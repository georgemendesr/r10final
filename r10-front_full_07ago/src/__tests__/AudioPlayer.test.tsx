import { render, screen } from '@testing-library/react';
import AudioPlayer from '../components/AudioPlayer';

// Mock das APIs
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    onvoiceschanged: null,
  },
});

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createBuffer: vi.fn(),
    decodeAudioData: vi.fn(),
  })),
});

global.fetch = vi.fn();

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza com texto "Ouvir matéria"', () => {
    render(<AudioPlayer content="Teste de conteúdo para narração" />);
    
    expect(screen.getByText('Ouvir matéria')).toBeInTheDocument();
  });

  test('mostra botão de play inicialmente', () => {
    const { container } = render(<AudioPlayer content="Teste de conteúdo" />);
    
    const playButton = container.querySelector('[data-e2e="audio-player-button"]');
    expect(playButton).toBeInTheDocument();
    expect(playButton).not.toBeDisabled();
  });

  test('mostra tempo de duração', () => {
    render(<AudioPlayer content="Teste de conteúdo" />);
    
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
  });

  test('não mostra ícone de configurações', () => {
    render(<AudioPlayer content="Teste de conteúdo" />);
    
    // Não deve mostrar ícone de configurações
    expect(screen.queryByTitle('Configurações de voz')).not.toBeInTheDocument();
  });

  test('não mostra informações técnicas na interface', () => {
    render(<AudioPlayer content="Teste de conteúdo" />);
    
    // Não deve mostrar informações técnicas
    expect(screen.queryByText(/Azure Neural/)).not.toBeInTheDocument();
    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Uso mensal/)).not.toBeInTheDocument();
  });

  test('interface limpa sem elementos desnecessários', () => {
    render(<AudioPlayer content="Teste de conteúdo" />);
    
    // Deve ter apenas os elementos essenciais
    expect(screen.getByText('Ouvir matéria')).toBeInTheDocument();
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
    
    // Não deve ter configurações ou informações técnicas
    expect(screen.queryByText(/Velocidade/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Voz do Narrador/)).not.toBeInTheDocument();
    expect(screen.queryByText(/apresentação/)).not.toBeInTheDocument();
  });
}); 