import React, { useState, useEffect } from 'react';

// Adicionar CSS customizado para animações
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
`;

// Injetar estilos no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

interface ReactionBarProps {
  articleId: string;
}

interface ReactionCounts {
  feliz: number;
  inspirado: number;
  surpreso: number;
  preocupado: number;
  triste: number;
  indignado: number;
}

const reactions = [
  { key: 'feliz', emoji: '😀', label: 'Feliz' },
  { key: 'inspirado', emoji: '🤩', label: 'Inspirado' },
  { key: 'surpreso', emoji: '😲', label: 'Surpreso' },
  { key: 'preocupado', emoji: '😟', label: 'Preocupado' },
  { key: 'triste', emoji: '😔', label: 'Triste' },
  { key: 'indignado', emoji: '😡', label: 'Indignado' }
];

const ReactionBar: React.FC<ReactionBarProps> = ({ articleId }) => {
  const [counts, setCounts] = useState<ReactionCounts>({
    feliz: 8,
    inspirado: 12,
    surpreso: 3,
    preocupado: 15,
    triste: 2,
    indignado: 5
  });
  
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se usuário já reagiu
    const savedReaction = localStorage.getItem(`r10_rx_${articleId}`);
    if (savedReaction) {
      setUserReaction(savedReaction);
      setShowResult(true);
    }
  }, [articleId]);

  const handleReaction = (emotionKey: string) => {
    if (userReaction) return; // Já reagiu

    // Animar botão
    setAnimatingReaction(emotionKey);
    
    // Simular incremento (em produção seria uma API call)
    setCounts(prev => ({
      ...prev,
      [emotionKey]: prev[emotionKey as keyof ReactionCounts] + 1
    }));

    // Salvar reação do usuário
    localStorage.setItem(`r10_rx_${articleId}`, emotionKey);
    setUserReaction(emotionKey);
    setShowResult(true);

    // Parar animação após delay
    setTimeout(() => setAnimatingReaction(null), 1000);

    // Analytics (se disponível)
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'reaction_click', {
        post_id: articleId,
        emotion: emotionKey
      });
    }
  };

  const getMajorityEmotion = () => {
    const entries = Object.entries(counts) as [keyof ReactionCounts, number][];
    if (entries.length === 0) return { key: 'feliz', label: 'Feliz' };
    
    const max = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    const reaction = reactions.find(r => r.key === max[0]);
    return { key: max[0], label: reaction?.label || 'Feliz' };
  };

  const getTotalReactions = () => {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="my-6" data-e2e="reaction-bar">
      {/* Uma linha moderna com emojis */}
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-full shadow-sm border border-gray-200">
        {reactions.map((reaction) => {
          const isSelected = userReaction === reaction.key;
          const count = counts[reaction.key as keyof ReactionCounts];
          
          return (
            <div key={reaction.key} className="relative group">
              <button
                onClick={() => handleReaction(reaction.key)}
                disabled={!!userReaction}
                className={`relative flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 ${
                  isSelected 
                    ? 'bg-blue-100 text-blue-700 transform scale-110' 
                    : 'hover:bg-gray-100 hover:scale-105'
                } ${!!userReaction && !isSelected ? 'opacity-50' : ''}`}
              >
                <span className="text-lg">{reaction.emoji}</span>
                <span className={`text-xs font-bold min-w-[20px] text-center ${
                  isSelected ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
              
              {/* Tooltip no hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {reaction.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Frase personalizada após votar */}
      {showResult && userReaction && (
        <div className="text-center mt-4 p-3 bg-gray-50 rounded-lg animate-fade-in">
          <p className="text-sm text-gray-700">
            Você ficou <strong>{reactions.find(r => r.key === userReaction)?.label.toLowerCase()}</strong> com a matéria, 
            mas a maioria das pessoas ({Math.round((counts[getMajorityEmotion().key as keyof ReactionCounts] || 0) / Math.max(getTotalReactions(), 1) * 100)}%) 
            ficou <strong>{getMajorityEmotion().label.toLowerCase()}</strong>!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReactionBar;