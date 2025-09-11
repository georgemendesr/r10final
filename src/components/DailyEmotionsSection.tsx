import React, { useState, useEffect, memo } from 'react';
import { getGlobalReactionStats, getReactionPercentages, reactionConfig, initializeReactionsData } from '../services/reactionsService';

const DailyEmotionsSection: React.FC = memo(() => {
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    // Inicializar dados se necessário
    initializeReactionsData();
    
    // Carregar estatísticas reais
    const reactionPercentages = getReactionPercentages();
    
    setPercentages(reactionPercentages);
  }, []);

  // Encontrar o valor máximo para calcular a largura das barras
  const maxPercentage = Math.max(...Object.values(percentages));

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-6 font-body">
      <div className="container mx-auto px-4 max-w-[1250px]">
        {/* Título da Seção */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            COMO OS LEITORES SE SENTEM
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mx-auto rounded-full shadow-lg"></div>
          <p className="text-gray-600 text-lg mt-4 font-medium">Acompanhe o sentimento da nossa comunidade</p>
        </div>

        {/* Grid de Emoções */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
          {reactionConfig.map((emotion) => {
            const percentage = percentages[emotion.key] || 0;
            const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
            
            return (
              <div
                key={emotion.key}
                className={`
                  ${emotion.bgColor} ${emotion.borderColor} 
                  border-2 rounded-2xl p-4 md:p-6 text-center 
                  transform hover:scale-105 transition-all duration-300 
                  hover:shadow-lg cursor-pointer group
                `}
              >
                {/* Emoji */}
                <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {emotion.emoji}
                </div>
                
                {/* Percentual */}
                <div className={`text-2xl md:text-3xl font-black ${emotion.color} mb-2`}>
                  {percentage}%
                </div>
                
                {/* Label */}
                <div className="text-sm md:text-base font-semibold text-gray-700 mb-3">
                  {emotion.label}
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${emotion.barColor} h-2 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

DailyEmotionsSection.displayName = 'DailyEmotionsSection';

export default DailyEmotionsSection;
