import React, { useState, useEffect, memo } from 'react';
import { 
  getArticleReactions, 
  getUserReaction, 
  saveUserReaction, 
  reactionConfig,
  ReactionCounts
} from '../services/reactionsService';

interface ReactionVotingProps {
  articleId: string;
  onVote?: (reaction: string) => void;
}

const ReactionVoting: React.FC<ReactionVotingProps> = memo(({ articleId, onVote }) => {
  const [counts, setCounts] = useState<ReactionCounts>({
    feliz: 0,
    inspirado: 0,
    surpreso: 0,
    preocupado: 0,
    triste: 0,
    indignado: 0
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [animatingVote, setAnimatingVote] = useState<string | null>(null);

  useEffect(() => {
    const articleReactions = getArticleReactions(articleId);
    const savedUserVote = getUserReaction(articleId);
    
    setCounts(articleReactions);
    if (savedUserVote) {
      setUserVote(savedUserVote);
    }
  }, [articleId]);

  const handleVote = (reactionKey: string) => {
    if (userVote === reactionKey) return;

    const newCounts = { ...counts };
    
    if (userVote) {
      newCounts[userVote as keyof ReactionCounts] = Math.max(0, newCounts[userVote as keyof ReactionCounts] - 1);
    }
    
    newCounts[reactionKey as keyof ReactionCounts] += 1;
    
    setAnimatingVote(reactionKey);
    setTimeout(() => setAnimatingVote(null), 1000);
    
    setCounts(newCounts);
    setUserVote(reactionKey);
    
    const allReactions = JSON.parse(localStorage.getItem('r10_reactions_data') || '{}');
    allReactions[articleId] = newCounts;
    localStorage.setItem('r10_reactions_data', JSON.stringify(allReactions));
    saveUserReaction(articleId, reactionKey);
    
    onVote?.(reactionKey);
  };

  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
        Como esta matéria te deixa?
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {reactionConfig.map((reaction) => {
          const count = counts[reaction.key as keyof ReactionCounts];
          const percentage = getPercentage(count);
          const isSelected = userVote === reaction.key;
          const isAnimating = animatingVote === reaction.key;
          
          return (
            <button
              key={reaction.key}
              onClick={() => handleVote(reaction.key)}
              className={`
                relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'bg-blue-100 border-blue-300 text-blue-700 scale-105' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:scale-105'
                }
                ${isAnimating ? 'animate-pulse' : ''}
                group
              `}
              title={`${reaction.label} - ${percentage}%`}
            >
              <div className={`text-2xl mb-2 transition-transform duration-300 ${isSelected ? 'scale-125' : 'group-hover:scale-110'}`}>
                {reaction.emoji}
              </div>
              
              <div className="text-xs font-semibold text-gray-700 mb-2">
                {reaction.label}
              </div>
              
              <div className={`text-sm font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                {percentage}%
              </div>
              
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {userVote && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Você escolheu: <strong>{reactionConfig.find(r => r.key === userVote)?.label}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Toque em outra reação para alterar seu voto
          </p>
        </div>
      )}
    </div>
  );
});

ReactionVoting.displayName = 'ReactionVoting';

export default ReactionVoting;