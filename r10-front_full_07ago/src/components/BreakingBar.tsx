import React from 'react';

const BreakingBar = () => {
  const latestNews = [
    "Prefeito anuncia novo hospital para região norte",
    "Chuvas intensas atingem 12 municípios do interior", 
    "Festival de verão movimenta economia local",
    "Universidade abre inscrições para 500 vagas",
    "Operação policial prende quadrilha no centro",
    "Governo investe R$ 30 milhões em educação",
    "Nova ponte liga dois municípios importantes"
  ];

  return (
    <div className="bg-breakingRed text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4 max-w-[1180px] flex items-center">
        <span className="bg-white text-breakingRed px-4 py-1 rounded text-sm font-bold uppercase flex-shrink-0 mr-4">
          ÚLTIMAS
        </span>
        
        <div className="flex-1 overflow-hidden">
          <div className="animate-[scroll_20s_linear_infinite] whitespace-nowrap flex">
            {[...Array(3)].map((_, cycle) => (
              <div key={cycle} className="flex">
                {latestNews.map((news, index) => (
                  <span key={`${cycle}-${index}`} className="inline-block mr-20 text-sm font-medium">
                    • {news}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingBar;