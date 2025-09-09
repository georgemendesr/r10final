import React from 'react';
import { getHomeH1, getHomeSectionTitles } from '../lib/seo';

interface SEOHeaderProps {
  page?: 'home' | 'category';
  category?: string;
  isVisible?: boolean;
}

const SEOHeader: React.FC<SEOHeaderProps> = ({ 
  page = 'home', 
  category, 
  isVisible = false 
}) => {
  if (page === 'home') {
    return (
      <div className={`container mx-auto px-4 max-w-[1250px] ${isVisible ? 'py-4' : 'sr-only'}`}>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {getHomeH1()}
        </h1>
        {isVisible && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <span>📍 {getHomeSectionTitles().piripiri}</span>
            <span>🏛️ {getHomeSectionTitles().politica}</span>
            <span>🚔 {getHomeSectionTitles().policia}</span>
            <span>🎉 {getHomeSectionTitles().eventos}</span>
          </div>
        )}
      </div>
    );
  }

  if (page === 'category' && category) {
    const categoryTitles: { [key: string]: string } = {
      geral: 'Notícias Gerais do Piauí',
      policia: 'Polícia em Destaque',
      politica: 'Política do Piauí',
      municipios: 'Notícias dos Municípios',
      economia: 'Economia do Piauí',
      esportes: 'Esportes do Piauí',
      eventos: 'Eventos do Piauí',
      piripiri: 'Notícias de Piripiri'
    };

    return (
      <div className="container mx-auto px-4 max-w-[1250px] py-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {categoryTitles[category] || `Categoria ${category}`}
        </h1>
      </div>
    );
  }

  return null;
};

export default SEOHeader;
