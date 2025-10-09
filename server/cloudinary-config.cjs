// Configuração do Cloudinary
const cloudinary = require('cloudinary').v2;

// Configurar credenciais (do .env ou variáveis de ambiente)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Sempre usar HTTPS
});

// Helper: Upload de buffer para Cloudinary
async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
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
          console.error('❌ Erro ao fazer upload no Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Upload Cloudinary bem-sucedido:', result.secure_url);
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
