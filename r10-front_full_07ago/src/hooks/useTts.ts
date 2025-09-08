import { useState, useEffect } from 'react';

interface Post {
  id: string;
  posicao?: string;
}

interface TtsResponse {
  ok: boolean;
  audioUrl?: string;
  error?: string;
  cached?: boolean;
  elevenLabsUsed?: boolean;
  vinhetaUsada?: string;
}

export function useTts(post: Post | null) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TtsResponse | null>(null);

  // Verificar se a posição é elegível para ElevenLabs
  const checkEligibility = (posicao?: string): boolean => {
    if (!posicao) return false;
    
    const eligiblePositions = [
      'supermanchete', 
      'super-manchete', 
      'manchete',
      'destaque', 
      'destaqueprincipal', 
      'destaque-principal'
    ];
    
    return eligiblePositions.includes(posicao.toLowerCase());
  };

  useEffect(() => {
    if (!post?.id) {
      setEnabled(false);
      return;
    }
    
    const isEligible = checkEligibility(post.posicao);
    setEnabled(isEligible);
  }, [post]);

  const onClick = async () => {
    if (!enabled || loading || !post?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Pegar dados reais da página atual com seletores mais precisos
      const articleTitle = (
        document.querySelector('article h1, .article-title, h1.title, main h1')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim() ||
        ''
      );
      
      const articleSubtitle = (
        document.querySelector('article .subtitle, .article-subtitle, .text-gray-600, .lead')?.textContent?.trim() ||
        document.querySelector('.text-gray-600')?.textContent?.trim() ||
        ''
      );
      
      const articleContent = (
        // Tentar primeiro seletores específicos de artigo
        Array.from(document.querySelectorAll('article .content p, article .article-body p, .post-content p')).map(p => p.textContent?.trim()).filter(Boolean).join(' ') ||
        // Fallback para seletores mais gerais
        Array.from(document.querySelectorAll('article p, main p, .content p')).map(p => p.textContent?.trim()).filter(Boolean).join(' ') ||
        // Último recurso: qualquer parágrafo
        Array.from(document.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean).slice(0, 10).join(' ') ||
        ''
      );
      
      
      // Usar o backend TTS enviando dados reais
      const response = await fetch(`http://localhost:8080/api/articles/${post.id}/tts/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: articleTitle || 'Notícia',
          subtitle: articleSubtitle || '',
          content: articleContent || 'Conteúdo não encontrado',
          posicao: post.posicao || 'geral'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || 'Erro ao gerar áudio');
      }

      setUrl(data.audioUrl);
      setResponse(data); // Salvar response completa para vinheta
      
    } catch (err) {
      console.error('❌ Erro ao gerar TTS:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar áudio');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUrl(undefined);
    setError(null);
    setLoading(false);
  };

  return { 
    enabled, 
    loading, 
    url, 
    error,
    response,
    onClick,
    reset
  };
} 