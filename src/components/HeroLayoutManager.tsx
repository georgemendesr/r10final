import React, { useState, useEffect } from 'react';
import { 
  getActiveHeroLayout, 
  setActiveHeroLayout, 
  HERO_LAYOUT_CONFIG, 
  HeroGridLayoutType 
} from '../services/layoutService';

const HeroLayoutManager = () => {
  const [activeLayout, setActiveLayoutState] = useState<HeroGridLayoutType>(() => getActiveHeroLayout());
  const [isChanging, setIsChanging] = useState(false);

  // Atualiza o estado quando o layout muda
  useEffect(() => {
    const currentLayout = getActiveHeroLayout();
    setActiveLayoutState(currentLayout);
  }, []);

  const handleLayoutChange = async (layout: HeroGridLayoutType) => {
    if (layout === activeLayout || isChanging) return;
    
    setIsChanging(true);
    
    try {
      // Confirma a mudança com o usuário
      const layoutName = HERO_LAYOUT_CONFIG[layout].name;
      const confirmed = window.confirm(
        `Deseja alterar para o ${layoutName}?\n\nA página será recarregada para aplicar as mudanças.`
      );
      
      if (confirmed) {
        setActiveHeroLayout(layout);
        // A função setActiveHeroLayout já faz o reload da página
      }
    } catch (error) {
      console.error('Erro ao alterar layout:', error);
      alert('Erro ao alterar o layout. Tente novamente.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">🎨</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Layouts do HeroGrid</h2>
          <p className="text-gray-600 text-sm">Escolha o layout da seção principal de notícias</p>
        </div>
      </div>

      {/* Layout Ativo */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{HERO_LAYOUT_CONFIG[activeLayout].icon}</span>
          <div>
            <h3 className="font-semibold text-green-800">Layout Ativo</h3>
            <p className="text-green-700">{HERO_LAYOUT_CONFIG[activeLayout].name}</p>
            <p className="text-green-600 text-sm">{HERO_LAYOUT_CONFIG[activeLayout].description}</p>
          </div>
        </div>
      </div>

      {/* Grid de Layouts Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(HERO_LAYOUT_CONFIG).map(([key, config]) => {
          const isActive = key === activeLayout;
          const layoutKey = key as HeroGridLayoutType;
          
          return (
            <div
              key={key}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                }
                ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => handleLayoutChange(layoutKey)}
            >
              {isActive && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <span className="text-3xl">{config.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${isActive ? 'text-green-800' : 'text-gray-900'}`}>
                    {config.name}
                  </h3>
                  <p className={`text-sm ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                    {config.description}
                  </p>
                  
                  {!isActive && (
                    <button
                      className="mt-3 px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayoutChange(layoutKey);
                      }}
                      disabled={isChanging}
                    >
                      {isChanging ? 'Alterando...' : 'Ativar Layout'}
                    </button>
                  )}
                  
                  {isActive && (
                    <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                      ✓ Layout Ativo
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <h4 className="font-semibold mb-2">Informações Importantes:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Todos os layouts mantêm as cores e tipologia das categorias</li>
              <li>• A mudança de layout recarrega a página automaticamente</li>
              <li>• O layout escolhido será aplicado apenas na página inicial</li>
              <li>• Páginas de teste (/test-*) não são afetadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroLayoutManager;
