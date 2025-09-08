// Configuração de API Keys
// Este arquivo é carregado independentemente das variáveis de ambiente

export const API_CONFIG = {
  // Groq API
  GROQ_API_KEY: '',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  
  // Hugging Face API (fallback)
  HF_API_KEY: '',
  HF_API_URL: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
  
  // Outros serviços
  ELEVEN_API_KEY: '',
  ELEVEN_VOICE_ID: ''
};

console.log('🔧 API_CONFIG carregado');
console.log('🔑 GROQ_API_KEY disponível:', !!API_CONFIG.GROQ_API_KEY);
console.log('🔑 GROQ_API_KEY length:', API_CONFIG.GROQ_API_KEY.length);
