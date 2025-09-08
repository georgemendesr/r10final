import React, { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, Save, CheckCircle, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { getLayoutConfig, saveLayoutConfig, Section } from '../services/layoutService';
import HeroLayoutManager from './HeroLayoutManager';

const LayoutManager: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = getLayoutConfig();
    setSections(config);
  }, []);

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].enabled = !newSections[index].enabled;
    setSections(newSections);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    setSections(newSections);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveSection(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleSave = () => {
    saveLayoutConfig(sections);
    setSaved(true);
    
    // Se a página inicial estiver aberta em outra aba/janela, ela será atualizada
    const homepageWindows = [window.parent, window.opener];
    homepageWindows.forEach(win => {
      if (win && win.location && win.location.pathname === '/') {
        win.location.reload();
      }
    });
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Gerenciador de Layouts do HeroGrid */}
      <HeroLayoutManager />
      
      {/* Gerenciador de Seções da Página */}
      <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Seções da Página Inicial</h3>
          <p className="text-sm text-gray-600">Reorganize e configure a ordem das seções</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Pré-visualizar</span>
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Salvo!' : 'Salvar Layout'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              group flex items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200
              hover:border-red-300 hover:bg-gray-100 transition-all cursor-move
              ${draggedIndex === index ? 'opacity-50 border-red-400' : ''}
              ${!section.enabled ? 'opacity-60' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
              
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => moveSection(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveSection(index, index + 1)}
                  disabled={index === sections.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 ml-4">
              <div className="font-medium text-gray-900">
                {index + 1}. {section.name}
              </div>
              <div className="text-xs text-gray-500">
                {section.enabled ? 'Ativa' : 'Desativada'}
              </div>
            </div>

            <button
              onClick={() => toggleSection(index)}
              className={`
                p-2 rounded-lg transition-colors
                ${section.enabled 
                  ? 'text-green-600 hover:bg-green-50 bg-green-100' 
                  : 'text-gray-400 hover:bg-gray-200 bg-gray-100'
                }
              `}
              title={section.enabled ? 'Desativar seção' : 'Ativar seção'}
            >
              {section.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-blue-800 text-sm">
          <h4 className="font-semibold mb-2">Como usar:</h4>
          <ul className="space-y-1">
            <li>• <strong>Arrastar:</strong> Clique e arraste pela área cinza para reordenar</li>
            <li>• <strong>Setas:</strong> Use as setas ↑↓ para mover uma posição</li>
            <li>• <strong>Olho:</strong> Clique para ativar/desativar a seção</li>
            <li>• <strong>Salvar:</strong> Clique em "Salvar Layout" para aplicar as mudanças</li>
            <li>• <strong>Ver mudanças:</strong> Use "Pré-visualizar" ou navegue para a página inicial</li>
          </ul>
        </div>
      </div>

      {saved && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800">
              <p className="font-semibold">Layout salvo com sucesso!</p>
              <p className="text-sm">As mudanças foram aplicadas. Navegue para a página inicial para vê-las.</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LayoutManager;
