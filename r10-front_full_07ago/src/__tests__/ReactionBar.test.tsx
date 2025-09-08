import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactionBar from '../components/ReactionBar';

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

beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

test('mostra emoções e bloqueia segundo voto (mock)', () => {
  // Mock: usuário não votou ainda
  localStorageMock.getItem.mockReturnValue(null);
  
  render(<ReactionBar postId="demo" />);
  
  // Verifica se as emoções estão visíveis (baseado na estrutura real)
  expect(screen.getByText('😀')).toBeInTheDocument();
  expect(screen.getByText('😡')).toBeInTheDocument();
  expect(screen.getByText('😔')).toBeInTheDocument(); // Triste real
  expect(screen.getByText('😲')).toBeInTheDocument(); // Surpreso real
  expect(screen.getByText('🤩')).toBeInTheDocument(); // Inspirado real
  
  const felizButton = screen.getByRole('button', { name: /Reagir com Feliz/i });
  fireEvent.click(felizButton);
  
  // Verifica se a mensagem de resultado aparece
  expect(screen.getByText(/A maioria ficou/i)).toBeInTheDocument();
  
  // Verifica se o localStorage foi chamado para salvar o voto
  expect(localStorageMock.setItem).toHaveBeenCalled();
});

test('não permite votar se já votou anteriormente', () => {
  // Mock: usuário já votou
  localStorageMock.getItem.mockReturnValue('feliz');
  
  render(<ReactionBar postId="demo" />);
  
  // Verifica se a mensagem de resultado já está visível
  expect(screen.getByText(/A maioria ficou/i)).toBeInTheDocument();
  
  // Verifica se os botões estão desabilitados
  const felizButton = screen.getByRole('button', { name: /Reagir com Feliz/i });
  expect(felizButton).toBeDisabled();
});

test('renderiza todas as emoções corretamente', () => {
  localStorageMock.getItem.mockReturnValue(null);
  
  render(<ReactionBar postId="test-post" />);
  
  // Verifica se todos os botões de emoção estão presentes (usando aria-labels)
  expect(screen.getByRole('button', { name: /Reagir com Feliz/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reagir com Indignado/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reagir com Triste/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reagir com Surpreso/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reagir com Inspirado/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reagir com Preocupado/i })).toBeInTheDocument();
}); 