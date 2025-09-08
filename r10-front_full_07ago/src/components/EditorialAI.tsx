import React, { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, AlertCircle, Zap, Info, HelpCircle } from 'lucide-react';
import { generateTitles, generateSubtitles, generateChapeus } from '../services/aiService';

interface EditorialAIProps {
  type: 'titulo' | 'subtitulo' | 'chapeu';
  content: string;
  currentValue: string;
  onSelect: (value: string) => void;
  maxLength: number;
  title?: string; // Para subtítulos
}

const EditorialAI: React.FC<EditorialAIProps> = ({
  type,
  content,
  currentValue,
  onSelect,
  maxLength,
  title = ''
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isUsingAI, setIsUsingAI] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const typeLabels = {
    titulo: 'Títulos',
    subtitulo: 'Subtítulos', 
    chapeu: 'Chapéus'
  };

  const generateSuggestions = async () => {
    if (!content || content.length < 50) {
      setError('Escreva pelo menos 50 caracteres no conteúdo para gerar sugestões');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let aiSuggestions: string[] = [];

      switch (type) {
        case 'titulo':
          aiSuggestions = await generateTitles(content, maxLength);
          break;
        case 'subtitulo':
          aiSuggestions = await generateSubtitles(content, title, maxLength);
          break;
        case 'chapeu':
          aiSuggestions = await generateChapeus(content, maxLength);
          break;
      }

      setSuggestions(aiSuggestions);
      setIsUsingAI(true);
      
    } catch (err) {
      console.error('Erro na IA, usando fallback:', err);
      setError('IA indisponível, gerando sugestões locais');
      setIsUsingAI(false);
      
      // Fallback para sugestões locais
      const fallbackSuggestions = generateFallbackSuggestions(type, content, maxLength, title);
      setSuggestions(fallbackSuggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackSuggestions = (type: string, content: string, maxLength: number, title: string): string[] => {
    const firstSentence = content.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 10);
    
    switch (type) {
      case 'titulo':
        return [
          words.slice(0, 6).join(' '),
          `Novo: ${words.slice(1, 6).join(' ')}`,
          `${words.slice(0, 5).join(' ')} em destaque`
        ].map(s => s.length > maxLength ? s.substring(0, maxLength-3) + '...' : s);
        
      case 'subtitulo':
        return [
          `Entenda os detalhes sobre ${words.slice(0, 4).join(' ').toLowerCase()}`,
          `Confira as principais informações sobre ${words.slice(0, 3).join(' ').toLowerCase()}`,
          `Saiba mais sobre os desdobramentos do caso`
        ].map(s => s.length > maxLength ? s.substring(0, maxLength-3) + '...' : s);
        
      case 'chapeu':
        const text = content.toLowerCase();
        if (text.includes('política') || text.includes('governo')) return ['POLÍTICA', 'GOVERNO', 'ELEIÇÕES'];
        if (text.includes('polícia') || text.includes('crime')) return ['SEGURANÇA', 'POLÍCIA', 'CRIME'];
        if (text.includes('saúde') || text.includes('hospital')) return ['SAÚDE', 'MEDICINA', 'BEM-ESTAR'];
        return ['GERAL', 'NOTÍCIAS', 'ATUALIDADE'];
        
      default:
        return [];
    }
  };

  const handleCopy = (suggestion: string, index: number) => {
    onSelect(suggestion);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusIcon = () => {
    if (isGenerating) return <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />;
    if (isUsingAI) return <Zap className="w-4 h-4 text-green-600" />;
    return <Sparkles className="w-4 h-4 text-purple-600" />;
  };

  const getStatusText = () => {
    if (isGenerating) return 'Gerando...';
    if (isUsingAI) return `IA - Sugestões de ${typeLabels[type]}`;
    return `Local - Sugestões de ${typeLabels[type]}`;
  };

  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-purple-800">
            {getStatusText()}
          </span>
          {!isUsingAI && suggestions.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Modo Offline
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Ícone de informação clicável */}
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 hover:bg-purple-100 rounded-full transition-colors"
              title="Informações sobre o uso da IA"
            >
              <Info className="w-3 h-3 text-purple-600" />
            </button>
            
            {/* Tooltip com informações */}
            {showInfo && (
              <div className="absolute right-0 top-6 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs z-10">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-amber-800">
                      <strong>Importante:</strong> As sugestões são baseadas apenas no conteúdo fornecido. 
                      Sempre verifique a precisão das informações antes de publicar.
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Zap className="w-3 h-3 text-green-600" />
                      <span>IA Online - Sugestões inteligentes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Modo Local - Sugestões básicas</span>
                    </div>
                  </div>
                </div>
                {/* Seta do tooltip */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
              </div>
            )}
          </div>

          <button
            onClick={generateSuggestions}
            disabled={isGenerating || !content}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-orange-600 text-xs mb-2 bg-orange-50 p-2 rounded">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <span className="text-sm text-gray-800 flex-1 mr-2">
                {suggestion}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${suggestion.length > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
                  {suggestion.length}/{maxLength}
                </span>
                <button
                  onClick={() => handleCopy(suggestion, index)}
                  className="p-1 hover:bg-purple-100 rounded transition-colors"
                  title="Usar esta sugestão"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-purple-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !isGenerating && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <HelpCircle className="w-3 h-3" />
            <span>Clique em "Gerar" para obter sugestões</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorialAI; 