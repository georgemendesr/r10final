import React from 'react';
import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import SocialLinks from './SocialLinks';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-neutral900 text-white font-body">
      {/* Conteúdo Principal do Footer */}
      <div className="container mx-auto px-4 max-w-[1250px] py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* Coluna 1 - Sobre o Portal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/uploads/imagens/logor10.png"
                alt="R10 Piauí - Logo Oficial"
                className="h-6 md:h-8 w-auto"
              />
              <h3 className="text-lg md:text-xl font-bold text-white">R10 Piauí</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Qualidade em primeiro lugar. Desde 2014. O portal de notícias mais completo do Piauí. 
              Informação de qualidade, atualizada e confiável para você ficar por dentro de tudo 
              que acontece no estado.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <SocialLinks 
                variant="footer" 
                iconSize="sm" 
                showLabels={true}
              />
            </div>
          </div>

          {/* Coluna 2 - Editorias */}
          <div className="space-y-4">
            <h4 className="text-base md:text-lg font-bold text-white border-b border-brand/30 pb-2">
              Editorias
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-ed-policia rounded-full"></div>
                  Polícia
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-ed-politica rounded-full"></div>
                  Política
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-ed-esporte rounded-full"></div>
                  Esporte
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-ed-entretenimento rounded-full"></div>
                  Entretenimento
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-ed-geral rounded-full"></div>
                  Geral
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Municípios */}
          <div className="space-y-4">
            <h4 className="text-base md:text-lg font-bold text-white border-b border-brand/30 pb-2">
              Municípios
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Teresina
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Pedro II
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Campo Maior
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Barras
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Esperantina
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Picos
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Piripiri
              </a>
              <a href="#" className="text-gray-300 hover:text-brand transition-colors text-sm">
                Parnaíba
              </a>
            </div>
          </div>

          {/* Coluna 4 - Contato */}
          <div className="space-y-4">
            <h4 className="text-base md:text-lg font-bold text-white border-b border-brand/30 pb-2">
              Contato
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand" />
                <span className="text-gray-300 text-sm">contato@r10piaui.com.br</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand" />
                <span className="text-gray-300 text-sm">(86) 99999-9999</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-brand" />
                <span className="text-gray-300 text-sm">Teresina, Piauí</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha de Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 max-w-[1250px] py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © 2024 R10 Piauí. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-brand transition-colors text-sm">
                Política de Privacidade
              </a>
              <a href="#" className="text-gray-400 hover:text-brand transition-colors text-sm">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-brand hover:bg-brand/80 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
};

export default Footer; 