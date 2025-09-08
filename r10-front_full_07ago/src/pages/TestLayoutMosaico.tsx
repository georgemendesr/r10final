import React from 'react';
import HeroGridMosaico from '../components/HeroGridMosaico';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TestLayoutMosaico = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do site */}
      <Header />
      
      {/* Seção de informação do teste */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-4">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              🎨 Layout Mosaico - Versão de Teste
            </h2>
            <p className="text-green-100">
              Grid assimétrico tipo revista: 2/3 principal + coluna lateral + linha inferior
            </p>
          </div>
        </div>
      </div>
      
      {/* Hero Grid Mosaico */}
      <HeroGridMosaico />
      
      {/* Comparação visual */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-[1250px]">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🏗️ Características do Layout Mosaico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-2">Grid 2/3 + 1/3</h4>
                <p className="text-sm text-green-600">Principal 66% + lateral 33%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-2">Tipo Revista</h4>
                <p className="text-sm text-blue-600">Layout assimétrico profissional</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-2">Múltiplos Focos</h4>
                <p className="text-sm text-purple-600">Vários pontos de atenção</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-semibold text-orange-800 mb-2">Flexível</h4>
                <p className="text-sm text-orange-600">Ideal para conteúdo diverso</p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-x-4">
            <a 
              href="/test-vertical" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Ver Layout Vertical
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

export default TestLayoutMosaico;
