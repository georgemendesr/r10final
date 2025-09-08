import { INSTAGRAM_CONFIG, getApiUrl, validateInstagramConfig, InstagramPostData, InstagramPostType } from '../config/instagram';

// Validação das credenciais
const configErrors = validateInstagramConfig();
if (configErrors.length > 0) {
  console.warn('⚠️ Instagram não configurado:', configErrors.join(', '));
}

// Configuração simples e direta
const BASE = import.meta.env.PROD ? '' : 'http://localhost:8080';

export async function socialGenerate(payload: InstagramPostData) {
  try {
    const response = await fetch(`${BASE}/api/social/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const json = await response.json().catch(() => ({}));
    
    if (!response.ok || !json.ok) {
      throw new Error(json.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return json;
  } catch (error) {
    console.error('❌ Erro ao gerar artes:', error);
    throw new Error(`Falha ao gerar artes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function socialPublish(type: 'feed' | 'story', gen: any, post: any): Promise<any> {
  try {
    // Construir caption do Instagram
    const caption = `${post.title}\n\n📰 Leia mais em: www.r10piaui.com`;
    
    const response = await fetch(`${BASE}/api/social/instagram/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: gen,
        caption: caption,
        type: type,
        postId: post.id,
        title: post.title
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Falha ao publicar no Instagram');
    }

    return data;
  } catch (error) {
    console.error('Erro ao publicar:', error);
    throw error;
  }
}

// Função para testar a conectividade da API
export async function testInstagramAPI(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl('GENERATE'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Teste de Conexão',
        hat: 'Teste',
        imageUrl: 'https://picsum.photos/1080/1350'
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Teste de API falhou:', error);
    return false;
  }
} 