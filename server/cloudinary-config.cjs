// Configuração do Cloudinary
const cloudinary = require('cloudinary').v2;

// 🔍 DEBUG: Verificar se variáveis estão definidas
console.log('🔍 [CLOUDINARY] Verificando variáveis de ambiente...');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Definida' : '❌ NÃO DEFINIDA');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Definida' : '❌ NÃO DEFINIDA');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Definida' : '❌ NÃO DEFINIDA');

// Configurar credenciais (do .env ou variáveis de ambiente)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Sempre usar HTTPS
});

console.log('✅ [CLOUDINARY] Configuração aplicada');

// Helper: Upload de buffer para Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    console.log('📤 [CLOUDINARY] Iniciando upload...');
    console.log('  Filename:', filename);
    console.log('  Buffer size:', buffer.length, 'bytes');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'r10-piaui', // Organiza as imagens em uma pasta
        public_id: filename.replace(/\.[^.]+$/, ''), // Remove extensão
        resource_type: 'image',
        format: 'auto', // Detecta formato automaticamente
        transformation: [
          { quality: 'auto:good' }, // Otimização automática de qualidade
          { fetch_format: 'auto' } // Converte para WebP quando possível
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ [CLOUDINARY] Erro no upload:', error);
          console.error('  Mensagem:', error.message);
          console.error('  HTTP Code:', error.http_code);
          reject(error);
        } else {
          console.log('✅ [CLOUDINARY] Upload bem-sucedido!');
          console.log('  URL:', result.secure_url);
          console.log('  Public ID:', result.public_id);
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

// Helper: Deletar imagem do Cloudinary
async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(`r10-piaui/${publicId}`);
    console.log('🗑️ Imagem deletada do Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao deletar do Cloudinary:', error);
    throw error;
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
