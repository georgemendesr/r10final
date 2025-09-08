import React from 'react';
import HeroGridPremium from '../components/HeroGridPremium';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TestLayoutPremium = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do site */}
      <Header />
      
      {/* Seção de informação do teste */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-6">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              🏆 Layout Premium - Versão Profissional
            </h2>
            <p className="text-purple-100 mb-2">
              Design magazine premium com hero gigante + grid moderno + seção trending
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">📱 Mobile First</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">🎨 Visual Premium</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">⚡ Performance</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">🔥 Trending Section</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Grid Premium */}
      <HeroGridPremium />
      
      {/* Comparação visual */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🎯 Características do Layout Premium
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="text-2xl mb-2">🎭</div>
                <h4 className="font-bold text-purple-800 mb-2">Hero Gigante</h4>
                <p className="text-purple-600 text-sm">Destaque principal com overlay profissional e gradientes premium</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="text-2xl mb-2">🏗️</div>
                <h4 className="font-bold text-blue-800 mb-2">Grid Moderno</h4>
                <p className="text-blue-600 text-sm">Layout assimétrico profissional com cards elevados e animações</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="text-2xl mb-2">🔥</div>
                <h4 className="font-bold text-green-800 mb-2">Seção Trending</h4>
                <p className="text-green-600 text-sm">Área "Em Alta" com mini-cards e indicador visual de popularidade</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-bold text-orange-800 mb-2">Responsivo</h4>
                <p className="text-orange-600 text-sm">Perfeito em mobile, tablet e desktop com transições suaves</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              <a 
                href="/test-vertical" 
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                📋 Ver Layout Vertical
              </a>
              <a 
                href="/test-mosaico" 
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
              >
                🎨 Ver Layout Mosaico
              </a>
              <a 
                href="/" 
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                📰 Voltar ao Original
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TestLayoutPremium;
