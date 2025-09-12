const http = require('http');

console.log('🧪 TESTANDO REORGANIZAÇÃO VIA API');

// Primeiro verificar estado atual
console.log('\n1️⃣ VERIFICANDO ESTADO ATUAL...');

const checkState = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/posts?posicao=destaque',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const destaques = JSON.parse(data);
                    console.log(`📊 Destaques atuais: ${destaques.length}`);
                    destaques.forEach(d => console.log(`   - ID ${d.id}: ${d.titulo.substring(0, 50)}...`));
                    resolve(destaques.length);
                } catch (err) {
                    reject(err);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
};

// Função para promover um post para supermanchete via API
const promoteToSupermanchete = (postId) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ posicao: 'supermanchete' });
        
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: `/api/posts/${postId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ Post ${postId} promovido para supermanchete via API`);
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
};

// Executar teste
async function runTest() {
    try {
        // 1. Estado inicial
        const initialCount = await checkState();
        
        // 2. Promover post 17 para supermanchete
        console.log('\n2️⃣ PROMOVENDO POST 17 PARA SUPERMANCHETE VIA API...');
        await promoteToSupermanchete(17);
        
        // 3. Aguardar reorganização e verificar novamente
        console.log('\n3️⃣ AGUARDANDO REORGANIZAÇÃO AUTOMÁTICA...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n4️⃣ ESTADO APÓS REORGANIZAÇÃO:');
        const finalCount = await checkState();
        
        if (finalCount === 5) {
            console.log('\n🎉 SUCESSO! A reorganização manteve exatamente 5 destaques!');
        } else {
            console.log(`\n❌ PROBLEMA! Destaques finais: ${finalCount} (deveria ser 5)`);
        }
        
        // 4. Restaurar estado (promover post 17 de volta para geral)
        console.log('\n5️⃣ RESTAURANDO POST 17 PARA GERAL...');
        await promoteToSupermanchete(17); // Primeiro promover para supermanchete novamente para forçar reorganização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Agora mover para geral
        const restoreData = JSON.stringify({ posicao: 'geral' });
        const restoreOptions = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/posts/17',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(restoreData)
            }
        };
        
        const restoreReq = http.request(restoreOptions, (res) => {
            console.log('✅ Post 17 restaurado para geral');
        });
        
        restoreReq.write(restoreData);
        restoreReq.end();
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

runTest();