import React from 'react';
import HeroGridVertical from '../components/HeroGridVertical';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TestLayoutVertical = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do site */}
      <Header />
      
      {/* Seção de informação do teste */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              📋 Layout Vertical - Versão de Teste
            </h2>
            <p className="text-blue-100">
              Manchete principal em destaque total + Grid horizontal de 4 notícias
            </p>
          </div>
        </div>
      </div>
      
      {/* Hero Grid Vertical */}
      <HeroGridVertical />
      
      {/* Comparação visual */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🎯 Características do Layout Vertical
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-2">100% Destaque</h4>
                <p className="text-sm text-blue-600">Manchete principal ocupa toda a largura superior</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-2">Grid Horizontal</h4>
                <p className="text-sm text-green-600">4 notícias organizadas horizontalmente</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-2">Responsivo</h4>
                <p className="text-sm text-purple-600">Adapta perfeitamente a qualquer tela</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-red-800 mb-2">Breaking News</h4>
                <p className="text-sm text-red-600">Ideal para notícias urgentes</p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-x-4">
            <a 
              href="/test-mosaico" 
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Ver Layout Mosaico
            </a>
            <a 
              href="/" 
              className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Voltar ao Original
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TestLayoutVertical;
