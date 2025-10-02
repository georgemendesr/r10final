import { Post, PosicaoAPI } from '../types/Post';
import { getPosts, updatePost } from '../services/postsService';

// Limites de posições
const POSITION_LIMITS = {
  SUPER_MANCHETE: 1,
  DESTAQUE: 5
};

// Normalizar posição para comparação
const normalizePosition = (posicao: string | undefined): string => {
  if (!posicao) return 'geral';
  const pos = String(posicao).toLowerCase().trim();
  
  if (pos === 'supermanchete' || pos.includes('super') || pos.includes('manchete')) {
    return 'supermanchete';
  }
  if (pos === 'destaque' || pos.includes('destaque')) {
    return 'destaque';
  }
  return 'geral';
};

// Função para reorganizar hierarquia após inserção/atualização
export const reorganizePositionHierarchy = async (
  updatedPostId: string, 
  newPosition: PosicaoAPI
): Promise<void> => {
  try {
    // Buscar todos os posts atuais
    const result = await getPosts();
    const allPosts = Array.isArray(result) ? result : result.posts || [];
    
    // Normalizar a nova posição
    const normalizedNewPosition = normalizePosition(String(newPosition));
    
    // Filtrar posts por posição (excluindo o post que está sendo atualizado)
    const otherPosts = allPosts.filter(post => post.id !== updatedPostId);
    
    const superManchetes = otherPosts.filter(post => normalizePosition(post.posicao) === 'supermanchete');
    const destaques = otherPosts.filter(post => normalizePosition(post.posicao) === 'destaque');
    
    const updates: Array<{ id: string; posicao: string }> = [];
    
    if (normalizedNewPosition === 'supermanchete') {
      // Se está inserindo uma nova SUPER MANCHETE
      
      // 1. Super manchete anterior vira DESTAQUE
      if (superManchetes.length > 0) {
        const currentSuperManchete = superManchetes[0];
        updates.push({ id: currentSuperManchete.id, posicao: 'destaque' });
      }
      
      // 2. Se já temos 5+ destaques, o mais antigo vira GERAL
      if (destaques.length >= POSITION_LIMITS.DESTAQUE) {
        // Ordenar destaques por data (mais antigo primeiro)
        const sortedDestaques = destaques.sort((a, b) => {
          const dateA = new Date(a.dataPublicacao || 0).getTime();
          const dateB = new Date(b.dataPublicacao || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestDestaque = sortedDestaques[0];
        updates.push({ id: oldestDestaque.id, posicao: 'geral' });
      }
      
    } else if (normalizedNewPosition === 'destaque') {
      // Se está inserindo um novo DESTAQUE
      
      // Se já temos 5+ destaques, o mais antigo vira GERAL
      if (destaques.length >= POSITION_LIMITS.DESTAQUE) {
        const sortedDestaques = destaques.sort((a, b) => {
          const dateA = new Date(a.dataPublicacao || 0).getTime();
          const dateB = new Date(b.dataPublicacao || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestDestaque = sortedDestaques[0];
        updates.push({ id: oldestDestaque.id, posicao: 'geral' });
      }
    }
    
    // Executar todas as atualizações
    for (const update of updates) {
      try {
        await updatePost(update.id, { posicao: update.posicao });
      } catch (error) {
        console.error(`❌ Erro ao atualizar post ${update.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na reorganização da hierarquia:', error);
    throw error;
  }
};

// Função para validar limites antes de salvar
export const validatePositionLimits = async (
  excludePostId?: string
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const result = await getPosts();
    const allPosts = Array.isArray(result) ? result : result.posts || [];
    
    // Filtrar posts (excluindo o que está sendo editado, se aplicável)
    const activePosts = excludePostId 
      ? allPosts.filter(post => post.id !== excludePostId)
      : allPosts;
    
    const superManchetes = activePosts.filter(post => 
      normalizePosition(post.posicao) === 'supermanchete'
    );
    const destaques = activePosts.filter(post => 
      normalizePosition(post.posicao) === 'destaque'
    );
    
    return {
      valid: true,
      message: `Atualmente: ${superManchetes.length} Super Manchete, ${destaques.length} Destaques`
    };
    
  } catch (error) {
    console.error('Erro ao validar limites:', error);
    return {
      valid: false,
      message: 'Erro ao verificar limites de posições'
    };
  }
};

export default {
  reorganizePositionHierarchy,
  validatePositionLimits,
  POSITION_LIMITS
};
