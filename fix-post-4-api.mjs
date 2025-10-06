// Atualizar imagem do post 4 via API
const API_BASE = 'https://r10piaui.onrender.com/api';

// URL de imagem válida sobre educação/universidade
const newImageUrl = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop';

// Você precisa do seu token JWT aqui
const TOKEN = 'SEU_TOKEN_JWT_AQUI';

async function updatePost4Image() {
  try {
    console.log('🔧 Atualizando imagem do post 4 via API...');
    
    const response = await fetch(`${API_BASE}/posts/4`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        imagemUrl: newImageUrl,
        imagemDestaque: newImageUrl
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('✅ Post 4 atualizado!');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

updatePost4Image();
