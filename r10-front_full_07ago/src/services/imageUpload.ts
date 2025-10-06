// 🖼️ Serviço de Upload de Imagens para o Servidor R10
// Envia imagens diretamente para o disco persistente do Render

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || '/api';

/**
 * Faz upload de uma imagem para o servidor
 * @param file - Arquivo de imagem a ser enviado
 * @returns URL completa da imagem ou null em caso de erro
 */
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Buscar token de autenticação
    const token = getAuthToken();
    if (!token) {
      console.error('❌ Token de autenticação não encontrado');
      return null;
    }
    
    console.log('📤 Enviando imagem:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ Erro no upload:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Upload concluído:', data.imageUrl);
    
    return data.imageUrl || data.url; // Retornar URL completa
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    return null;
  }
};

/**
 * Valida uma imagem antes do upload
 * @param file - Arquivo a ser validado
 * @returns Objeto com resultado da validação
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `Imagem muito grande. Máximo 5MB. (Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB)` 
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      error: `Formato não suportado. Use JPG, PNG, GIF ou WebP. (Tipo: ${file.type})` 
    };
  }
  
  return { valid: true };
};

/**
 * Deleta uma imagem do servidor
 * @param filename - Nome do arquivo a ser deletado
 * @returns true se deletado com sucesso, false caso contrário
 */
export const deleteImage = async (filename: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('❌ Token de autenticação não encontrado');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/upload/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('❌ Erro ao deletar imagem:', response.statusText);
      return false;
    }
    
    console.log('✅ Imagem deletada:', filename);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    return false;
  }
};

/**
 * Busca o token de autenticação do localStorage
 */
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('r10_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

/**
 * Extrai o nome do arquivo de uma URL
 * @param url - URL completa da imagem
 * @returns Nome do arquivo ou null
 */
export const extractFilenameFromUrl = (url: string): string | null => {
  try {
    const matches = url.match(/\/uploads\/([^?]+)/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
};
