const http = require('http');

console.log('🔍 Testando API com detalhes da imagem...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts?posicao=supermanchete',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const posts = JSON.parse(data);
      if (posts.length > 0) {
        const post = posts[0];
        console.log('✅ Supermanchete completa:');
        console.log('📰 ID:', post.id);
        console.log('📰 Título:', post.titulo);
        console.log('📝 Subtítulo:', post.subtitulo);
        console.log('🖼️ ImagemUrl:', post.imagemUrl);
        console.log('🎯 ImagemDestaque:', post.imagemDestaque);
        console.log('📅 PublishedAt:', post.publishedAt);
        console.log('📍 Posição:', post.posicao);
        
        if (post.imagemUrl && post.imagemUrl !== '/placeholder.svg') {
          console.log('✅ IMAGEM: OK');
        } else {
          console.log('❌ IMAGEM: Problema detectado');
        }
        
        if (post.subtitulo) {
          console.log('✅ SUBTÍTULO: OK');
        } else {
          console.log('❌ SUBTÍTULO: Não encontrado');
        }
      }
    } catch (e) {
      console.log('❌ Erro ao parsear:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

req.end();
