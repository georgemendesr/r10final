const http = require('http');

console.log('🧪 Testando correção de base64...');

// Criar uma imagem base64 de teste (1x1 pixel transparente PNG)
const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

const postData = JSON.stringify({
  titulo: 'Teste Correção Base64',
  subtitulo: 'Teste de upload de imagem base64',
  conteudo: 'Este é um teste para verificar se a correção de base64 está funcionando.',
  autor: 'Sistema de Teste',
  categoria: 'geral',
  posicao: 'geral',
  imagemUrl: testBase64
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.imagemUrl && !response.imagemUrl.startsWith('data:image/')) {
        console.log('✅ SUCESSO! Base64 foi convertido para arquivo!');
        console.log('📁 Novo caminho:', response.imagemUrl);
        console.log('🆔 Post ID:', response.id);
        
        // Testar se o arquivo é acessível
        const fileOptions = {
          hostname: 'localhost',
          port: 3002,
          path: response.imagemUrl,
          method: 'GET'
        };
        
        const fileReq = http.request(fileOptions, (fileRes) => {
          if (fileRes.statusCode === 200) {
            console.log('🎉 Arquivo da imagem é acessível via HTTP!');
          } else {
            console.log('⚠️ Arquivo criado mas não acessível via HTTP:', fileRes.statusCode);
          }
        });
        
        fileReq.on('error', (error) => {
          console.error('❌ Erro ao acessar arquivo:', error.message);
        });
        
        fileReq.end();
        
      } else {
        console.log('❌ FALHOU: Base64 não foi processado');
        console.log('📄 Resposta:', response);
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error);
      console.log('📄 Dados recebidos:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message, error.code);
  console.log('🔍 Detalhes:', { hostname: options.hostname, port: options.port, path: options.path });
});

req.write(postData);
req.end();
