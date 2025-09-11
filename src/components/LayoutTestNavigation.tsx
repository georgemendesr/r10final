import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette } from 'lucide-react';

const LayoutTestNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center gap-2"
      >
        <Palette size={20} />
        <span className="hidden md:inline">Testar Layouts</span>
      </button>
      
      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border p-4 min-w-[250px]">
          <h3 className="font-semibold text-gray-800 mb-3">🎨 Versões de Layout</h3>
          
          <div className="space-y-2">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              📰 Layout Original (Atual)
            </Link>
            
            <Link
              to="/test-vertical"
              className="block px-3 py-2 rounded-md text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              📋 Layout Vertical
            </Link>
            
            <Link
              to="/test-mosaico"
              className="block px-3 py-2 rounded-md text-sm hover:bg-green-50 hover:text-green-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              🎨 Layout Mosaico
            </Link>
          </div>
          
          <hr className="my-3" />
          
          <a
            href="/preparar-teste-layouts.html"
            target="_blank"
            className="block px-3 py-2 rounded-md text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors text-center"
            onClick={() => setIsOpen(false)}
          >
            🚀 Preparar Dados de Teste
          </a>
        </div>
      )}
    </div>
  );
};

export default LayoutTestNavigation;
