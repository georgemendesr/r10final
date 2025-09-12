async function checkAPIResponse() {
    try {
        console.log('📡 Fazendo requisição para a API...');
        const response = await fetch('http://127.0.0.1:3002/api/posts?limit=5');
        const text = await response.text();
        
        console.log('📥 Resposta raw da API:');
        console.log(text);
        console.log('\n---\n');
        
        const data = JSON.parse(text);
        console.log('📊 Dados parseados:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

checkAPIResponse();