import React, { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import SocialLinks from './SocialLinks';
import SearchModal from './SearchModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Badge: usar apenas o selo fornecido pelo cliente
  const [badgeFailed, setBadgeFailed] = useState(false);

  return (
    <>
  <header role="banner" className="bg-white py-4 md:py-6 lg:py-8 font-body shadow-sm">
        {/* Skip to content link */}
        <a 
          href="#conteudo" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Ir para o conteúdo
        </a>
        
        <div className="container mx-auto px-4 flex items-center justify-between max-w-[1250px] relative">
          {/* Redes Sociais - Lado Esquerdo */}
          <div className="hidden md:block">
            <SocialLinks variant="header" />
          </div>
          
          {/* Logo - Perfeitamente Centralizado */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link 
              to="/" 
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="R10 Piauí - página inicial"
              data-e2e="logo"
            >
              <img 
                src="/uploads/imagens/logor10.png" 
                alt="R10 Piauí - Qualidade em primeiro lugar" 
                className="h-16 md:h-20 lg:h-24 w-auto" 
              />
              {/* Selo de 11 Anos - Oculto no mobile */}
              <div className="relative hidden md:flex items-center ml-2 lg:ml-3">
                <img 
                  src="/uploads/imagens/selo11anos.png" 
                  alt="11 anos desde 2014" 
                  className="h-8 md:h-10 lg:h-12 w-auto" 
                  onError={() => setBadgeFailed(true)}
                  style={{ display: badgeFailed ? 'none' : undefined }}
                />
              </div>
            </Link>
          </div>
          

          
          {/* Busca e Menu - Lado Direito */}
          <nav aria-label="Navegação principal" data-e2e="nav-principal">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Botão Buscar - Oculto no mobile */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex h-10 lg:h-12 px-3 lg:px-4 border border-gray-300 rounded-full items-center gap-2 hover:bg-gray-50 transition-colors font-rubik shadow-sm"
                aria-label="Buscar"
                data-e2e="btn-buscar"
              >
                <Search className="w-4 h-4 text-gray-600" aria-hidden="true" />
                <span className="text-sm font-medium">Buscar</span>
              </button>
              
              {/* Botão Menu Expansível */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-10 w-10 md:h-12 md:w-12 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isMenuOpen}
                data-e2e="btn-menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
                )}
              </button>
            </div>
          </nav>
        </div>
        
        {/* Menu Expansível - Melhorado para Mobile */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
            <div className="container mx-auto px-4 py-4 md:py-6 max-w-[1250px]">
              {/* Redes Sociais no Mobile */}
              <div className="md:hidden mb-4 pb-4 border-b border-gray-200">
                <SocialLinks variant="header" />
              </div>
              
              {/* Busca no Mobile */}
              <div className="md:hidden mb-4">
                <button 
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-gray-50 transition-colors font-rubik shadow-sm"
                  aria-label="Buscar"
                >
                  <Search className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <span className="text-gray-500">Buscar no site...</span>
                </button>
              </div>
              
              <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
                <Link 
                  to="/categoria/politica" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  POLÍTICA
                </Link>
                <Link 
                  to="/categoria/policial" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  POLICIAL
                </Link>
                <Link 
                  to="/categoria/esportes" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ESPORTES
                </Link>
                <Link 
                  to="/categoria/piripiri" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  PIRIPIRI
                </Link>
                <Link 
                  to="/municipios" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  MUNICÍPIOS
                </Link>
                <Link 
                  to="/categoria/entretenimento" 
                  className="uppercase text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 md:py-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ENTRETENIMENTO
                </Link>
              </nav>
              
              {/* Teste de Layouts */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">🎨 Teste de Layouts</p>
                <div className="flex flex-wrap gap-2">
                  <Link 
                    to="/" 
                    className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📰 Original
                  </Link>
                  <Link 
                    to="/test-vertical" 
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📋 Vertical
                  </Link>
                  <Link 
                    to="/test-mosaico" 
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm hover:bg-orange-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🎨 Mosaico
                  </Link>
                  <Link 
                    to="/test-premium" 
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm hover:bg-purple-200 transition-colors font-bold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🏆 Premium
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Modal de Busca */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default Header;