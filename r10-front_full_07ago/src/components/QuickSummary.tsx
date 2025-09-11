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
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Gerar resumo automático usando IA do backend
  const generateAutoSummary = async () => {
    if (!content || content.trim().length < 50) {
      onChange('• Conteúdo insuficiente para gerar resumo automático');
      return;
    }

    setIsGenerating(true);
    try {
      // Limpar tags HTML do conteúdo para enviar para a IA
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Você é um jornalista especializado em resumos objetivos. Responda APENAS com 4 linhas, cada uma começando com "• " seguido de uma frase direta e informativa. NÃO use markdown, NÃO use títulos como "Tópico 1", NÃO use formatação. Apenas bullet points simples.'
            },
            {
              role: 'user',
              content: `Resuma esta notícia em 4 bullet points simples:\n\n${textContent}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiSummary = data.choices[0]?.message?.content?.trim();
        
        if (aiSummary) {
          // Limpar formatação indesejada e garantir bullet points simples
          const formattedSummary = aiSummary
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const clean = line.trim()
                .replace(/^\*\*/g, '') // Remove ** do início
                .replace(/\*\*$/g, '') // Remove ** do final
                .replace(/^\*/g, '') // Remove * do início
                .replace(/^-/g, '') // Remove - do início
                .replace(/^Tópico \d+:/gi, '') // Remove "Tópico X:"
                .replace(/^\d+\./g, '') // Remove "1."
                .trim();
              
              return clean.startsWith('•') ? clean : `• ${clean}`;
            })
            .join('\n');
          
          onChange(formattedSummary);
        } else {
          throw new Error('Resposta da IA vazia');
        }
      } else {
        throw new Error(`Erro na API: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao gerar resumo com IA:', error);
      // Fallback para lógica local em caso de erro
      generateLocalSummary();
    } finally {
      setIsGenerating(false);
    }
  };

  // Função de fallback para gerar resumo local (antigo método)
  const generateLocalSummary = () => {
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
            disabled={isGenerating}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 disabled:text-gray-500 rounded-md text-sm transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                <span>Gerar com IA</span>
              </>
            )}
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