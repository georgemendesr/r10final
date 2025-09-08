import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('App', () => {
  it('renderiza sem quebrar', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verifica se o app carrega
    expect(document.body).toBeInTheDocument();
  });

  it('tem roteamento funcionando', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verifica se há elementos de navegação
    const links = document.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });
});