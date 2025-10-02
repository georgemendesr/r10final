const http = require('http');

console.log('🔍 Testando se a API está retornando a imagem corrigida...');

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
        console.log('✅ Dados da supermanchete:');
        console.log('   ID:', post.id);
        console.log('   Título:', post.titulo);
        console.log('   Imagem URL:', post.imagemUrl);
        console.log('   Imagem Destaque:', post.imagemDestaque);
        console.log('   Subtítulo:', post.subtitulo);
        
        if (post.imagemUrl === '/uploads/publicity-card.jpg') {
          console.log('\n🎉 SUCESSO! A imagem que você fez upload está sendo retornada pela API!');
        } else {
          console.log('\n❌ PROBLEMA: A imagem não é a que você fez upload');
        }
      } else {
        console.log('❌ Nenhuma supermanchete encontrada');
      }
    } catch (e) {
      console.log('❌ Erro ao parsear resposta:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na conexão:', error.message);
});

req.end();
