import React, { useState, useEffect, memo } from 'react';
import { getArticleReactions, reactionConfig, ReactionCounts } from '../services/reactionsService';

interface ReactionResultsProps {
  articleId: string;
}

const ReactionResults: React.FC<ReactionResultsProps> = memo(({ articleId }) => {
  const [counts, setCounts] = useState<ReactionCounts>({
    feliz: 0,
    inspirado: 0,
    surpreso: 0,
    preocupado: 0,
    triste: 0,
    indignado: 0
  });

  useEffect(() => {
    // 🔧 FIX: Carregar dados reais do serviço com async/await
    const loadReactions = async () => {
      try {
        const articleReactions = await getArticleReactions(articleId);
        setCounts(articleReactions);
      } catch (error) {
        console.error('Erro ao carregar reações:', error);
      }
    };
    
    loadReactions();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.articleId === articleId) {
        loadReactions();
      }
    };
    window.addEventListener('reaction-updated', handler as EventListener);
    return () => window.removeEventListener('reaction-updated', handler as EventListener);
  }, [articleId]);

  const totalReactions = Object.values(counts).reduce<number>((sum, count) => sum + (count as number), 0);
  
  // Mostrar apenas as 3 reações com mais votos
  const topReactions = reactionConfig
    .map((reaction: typeof reactionConfig[number]) => ({
      ...reaction,
      count: counts[reaction.key as keyof ReactionCounts],
      percentage: totalReactions > 0 ? Math.round((counts[reaction.key as keyof ReactionCounts] / totalReactions) * 100) : 0
    }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 3);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span className="text-lg">📊</span>
            Como os leitores se sentiram:
          </span>
          <div className="flex items-center gap-3">
            {topReactions.map((reaction, index) => (
              <div key={reaction.key} className="flex items-center gap-1 group relative">
                <div className="relative">
                  <span className="text-xl group-hover:scale-110 transition-transform duration-200 cursor-pointer">
                    {reaction.emoji}
                  </span>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                  )}
                  
                  {/* Tooltip com o nome da reação */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {reaction.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded-full border border-gray-200">
                  {reaction.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ReactionResults.displayName = 'ReactionResults';

export default ReactionResults;
