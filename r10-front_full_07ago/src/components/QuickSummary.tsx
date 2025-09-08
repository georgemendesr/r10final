import React, { useState, useEffect } from 'react';
import { Clock, Zap, Eye, CheckCircle, AlertCircle } from 'lucide-react';

interface QuickSummaryProps {
  value: string;
  onChange: (value: string) => void;
  content: string;
}

const QuickSummary: React.FC<QuickSummaryProps> = ({ value, onChange, content }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validar resumo
  useEffect(() => {
    const points = value.split('\n').filter(line => line.trim().startsWith('•'));
    setIsValid(points.length >= 3 && points.length <= 5);
  }, [value]);

  // Função para garantir frases completas
  const ensureCompleteSentence = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    
    // Encontrar o último espaço antes do limite
    const truncated = text.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) { // Se o espaço está a pelo menos 70% do limite
      return truncated.substring(0, lastSpaceIndex);
    }
    
    // Se não encontrar um espaço adequado, procurar por pontuação
    const lastPunctuationIndex = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(',')
    );
    
    if (lastPunctuationIndex > maxLength * 0.6) {
      return truncated.substring(0, lastPunctuationIndex + 1);
    }
    
    // Se ainda não encontrar, usar o limite original mas garantir que não corte no meio de uma palavra
    return truncated;
  };

  // Gerar resumo automático baseado no conteúdo
  const generateAutoSummary = () => {
    // Limpar tags HTML do conteúdo
    const cleanContent = content
      .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
      .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaço
      .replace(/&amp;/g, '&') // Substitui &amp; por &
      .replace(/&lt;/g, '<') // Substitui &lt; por <
      .replace(/&gt;/g, '>') // Substitui &gt; por >
      .replace(/&quot;/g, '"') // Substitui &quot; por "
      .replace(/&#39;/g, "'") // Substitui &#39; por '
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .trim();

    const sentences = cleanContent
      .split(/[.!?]/)
      .filter(sentence => sentence.trim().length > 20)
      .slice(0, 5);

    const summary = sentences.map(sentence => {
      const cleanSentence = sentence.trim();
      const completeSentence = ensureCompleteSentence(cleanSentence, 80);
      return `• ${completeSentence}`;
    }).join('\n');

    onChange(summary);
  };

  // Processar mudanças no textarea para garantir frases completas
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim().startsWith('•')) {
        const content = line.substring(1).trim();
        const completeContent = ensureCompleteSentence(content, 80);
        return `• ${completeContent}`;
      }
      return line;
    });
    
    onChange(processedLines.join('\n'));
  };

  // Renderizar preview do resumo
  const renderPreview = () => {
    const points = value.split('\n').filter(line => line.trim().startsWith('•'));
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Resumo Rápido</h4>
          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
            Para leitores apressados
          </span>
        </div>
        
        <div className="space-y-2">
          {points.map((point, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <p className="text-blue-900 text-sm leading-relaxed">
                {point.substring(1).trim()}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>Tempo de leitura: ~{Math.ceil(points.length * 0.5)} min</span>
            <span>{points.length} pontos principais</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-base font-semibold text-gray-900">
          Resumo Rápido <span className="text-blue-500">⚡</span>
        </label>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={generateAutoSummary}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Gerar Auto</span>
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>{showPreview ? 'Ocultar' : 'Preview'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={value}
          onChange={handleTextareaChange}
          placeholder="Digite os pontos principais da matéria...

Exemplo:
• Governador anuncia investimento de R$ 50 milhões
• Projeto beneficiará 12 municípios da região
• Obras devem começar em março de 2025
• Expectativa de gerar 500 empregos diretos"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24 resize-none text-sm ${
            isValid 
              ? 'border-green-300 bg-green-50' 
              : value 
                ? 'border-orange-300 bg-orange-50' 
                : 'border-gray-300'
          }`}
        />

        {/* Status de validação */}
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : value ? (
            <AlertCircle className="w-4 h-4 text-orange-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-400" />
          )}
          
          <span className={`text-sm ${
            isValid 
              ? 'text-green-600' 
              : value 
                ? 'text-orange-600' 
                : 'text-gray-500'
          }`}>
            {isValid 
              ? 'Resumo válido! Aparecerá no topo da matéria' 
              : value 
                ? 'Adicione mais pontos (mínimo 3, máximo 5)' 
                : 'Resumo aparecerá no topo da matéria para leitores apressados'
            }
          </span>
        </div>

        {/* Estatísticas */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {value.split('\n').filter(line => line.trim().startsWith('•')).length} pontos
          </span>
          <span>
            ~{Math.ceil(value.length / 200)} min de leitura
          </span>
        </div>
      </div>

      {/* Preview */}
      {showPreview && value && (
        <div className="mt-4">
          {renderPreview()}
        </div>
      )}


    </div>
  );
};

export default QuickSummary; 