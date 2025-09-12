// TESTE ESPECÍFICO: Simular edição que causa reorganização

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarEdicaoProblematica() {
    console.log('🧪 TESTANDO SE EDIÇÃO CAUSA REORGANIZAÇÃO INDEVIDA...\n');
    
    // 1. Estado inicial
    console.log('1️⃣ VERIFICANDO ESTADO INICIAL...');
    const response1 = await fetch('http://localhost:3002/api/posts');
    const posts1 = await response1.json();
    
    const destaquesBefore = posts1.filter(p => p.posicao === 'destaque').length;
    const destaque = posts1.find(p => p.posicao === 'destaque');
    
    console.log(`📊 Destaques atuais: ${destaquesBefore}`);
    console.log(`🎯 Testando edição no ID ${destaque.id}: ${destaque.titulo.substring(0, 40)}...`);
    
    // 2. Fazer edição SEM mudar posição
    console.log('\n2️⃣ FAZENDO EDIÇÃO SEM MUDAR POSIÇÃO...');
    const editResponse = await fetch(`http://localhost:3002/api/posts/${destaque.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            titulo: destaque.titulo + ' [EDITADO]',
            posicao: 'destaque'  // MESMA posição
        })
    });
    
    const editResult = await editResponse.json();
    console.log('✅ Edição enviada');
    
    // 3. Verificar se houve reorganização
    await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar processamento
    
    console.log('\n3️⃣ VERIFICANDO SE HOUVE REORGANIZAÇÃO INDEVIDA...');
    const response2 = await fetch('http://localhost:3002/api/posts');
    const posts2 = await response2.json();
    
    const destaquesAfter = posts2.filter(p => p.posicao === 'destaque').length;
    
    console.log(`📊 Destaques após edição: ${destaquesAfter}`);
    
    if (destaquesBefore === destaquesAfter && destaquesAfter === 5) {
        console.log('🎉 SUCESSO! Não houve reorganização indevida!');
    } else {
        console.log('🚨 PROBLEMA! Houve reorganização indevida!');
        console.log(`   Antes: ${destaquesBefore} → Depois: ${destaquesAfter}`);
        
        // Mostrar o que mudou
        const lostDestaques = posts1.filter(p1 => 
            p1.posicao === 'destaque' && 
            !posts2.find(p2 => p2.id === p1.id && p2.posicao === 'destaque')
        );
        
        if (lostDestaques.length > 0) {
            console.log('\n📉 DESTAQUES PERDIDOS:');
            lostDestaques.forEach(p => {
                console.log(`   ID ${p.id}: ${p.titulo.substring(0, 50)}...`);
            });
        }
    }
    
    // 4. Reverter edição
    console.log('\n4️⃣ REVERTENDO EDIÇÃO...');
    await fetch(`http://localhost:3002/api/posts/${destaque.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            titulo: destaque.titulo,
            posicao: 'destaque'
        })
    });
    console.log('🔄 Edição revertida');
}

testarEdicaoProblematica().catch(console.error);