import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';

// Wrapper para componentes que usam React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

test('renderiza menu principal e botão de busca', () => {
  render(
    <RouterWrapper>
      <Header />
    </RouterWrapper>
  );
  
  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByText(/Buscar/i)).toBeInTheDocument();
});

test('renderiza logo do portal', () => {
  render(
    <RouterWrapper>
      <Header />
    </RouterWrapper>
  );
  
  const logo = screen.getByAltText(/R10 Piauí - Qualidade em primeiro lugar/i);
  expect(logo).toBeInTheDocument();
});

test('renderiza elementos do header', () => {
  render(
    <RouterWrapper>
      <Header />
    </RouterWrapper>
  );
  
  // Verifica se os elementos principais do header estão presentes
  expect(screen.getByText(/Buscar/i)).toBeInTheDocument();
  expect(screen.getByAltText(/R10 Piauí - Qualidade em primeiro lugar/i)).toBeInTheDocument();
  expect(screen.getByAltText(/R10 Piauí - 11 Anos/i)).toBeInTheDocument();
}); 