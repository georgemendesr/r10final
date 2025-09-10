import { useEffect } from 'react';

/**
 * Hook para incrementar automaticamente as views de um post quando ele é visualizado
 */
export const usePostView = (postId: string | number | undefined) => {
  useEffect(() => {
    if (!postId) return;

    const incrementView = async () => {
      try {
        console.log(`👁️ Incrementando view para post ${postId}`);
        
        const response = await fetch(`/api/posts/${postId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`👁️ View incrementada com sucesso. Total: ${data.views}`);
        } else {
          console.warn(`⚠️ Falha ao incrementar view para post ${postId}`);
        }
      } catch (error) {
        console.error('❌ Erro ao incrementar view:', error);
      }
    };

    // Incrementar view com um pequeno delay para evitar múltiplas chamadas
    const timer = setTimeout(incrementView, 1000);

    return () => clearTimeout(timer);
  }, [postId]);
};

export default usePostView;
