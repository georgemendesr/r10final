// Teste para verificar se o problema da quinta matéria ainda ocorre
async function testDestaquesPersistency() {
    console.log('🧪 Iniciando teste de persistência dos destaques...\n');
    
    try {
        // 1. Verificar estado inicial
        console.log('📋 STEP 1: Verificando estado inicial...');
        const response1 = await fetch('http://127.0.0.1:3002/api/posts?limit=20');
        const data1 = await response1.json();
        
        const destaques1 = data1.posts.filter(p => p.section === 'destaque');
        console.log(`✅ Destaques encontrados: ${destaques1.length}`);
        destaques1.forEach((post, index) => {
            console.log(`   ${index + 1}. ID: ${post.id} | ${post.title.substring(0, 50)}...`);
        });
        
        if (destaques1.length < 5) {
            console.log('❌ PROBLEMA: Menos de 5 destaques encontrados inicialmente!\n');
            return;
        }
        
        // 2. Simular uma edição simples em um destaque (sem mudança de posição)
        const primeiroDestaque = destaques1[0];
        console.log(`\n📝 STEP 2: Editando matéria ID ${primeiroDestaque.id} (sem mudança de posição)...`);
        
        const editPayload = {
            title: primeiroDestaque.title + ' [TESTE EDITADO]',
            content: primeiroDestaque.content,
            section: 'destaque', // Mantém a mesma seção
            category: primeiroDestaque.category,
            tags: primeiroDestaque.tags
        };
        
        const editResponse = await fetch(`http://127.0.0.1:3002/api/posts/${primeiroDestaque.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(editPayload)
        });
        
        if (!editResponse.ok) {
            console.log('❌ Erro na edição:', await editResponse.text());
            return;
        }
        
        console.log('✅ Edição realizada com sucesso');
        
        // 3. Verificar se ainda temos 5 destaques
        console.log('\n🔍 STEP 3: Verificando estado após edição...');
        const response2 = await fetch('http://127.0.0.1:3002/api/posts?limit=20');
        const data2 = await response2.json();
        
        const destaques2 = data2.posts.filter(p => p.section === 'destaque');
        console.log(`📊 Destaques após edição: ${destaques2.length}`);
        destaques2.forEach((post, index) => {
            console.log(`   ${index + 1}. ID: ${post.id} | ${post.title.substring(0, 50)}...`);
        });
        
        // 4. Análise dos resultados
        console.log('\n📈 ANÁLISE DOS RESULTADOS:');
        if (destaques2.length === 5) {
            console.log('✅ SUCESSO: 5 destaques mantidos após edição');
        } else {
            console.log(`❌ PROBLEMA: ${destaques2.length} destaques após edição (deveria ser 5)`);
            console.log('   Possível causa: Lógica de reorganização sendo acionada desnecessariamente');
        }
        
        // 5. Desfazer alteração de teste
        console.log('\n🔄 STEP 4: Desfazendo alteração de teste...');
        const restorePayload = {
            title: primeiroDestaque.title, // Título original
            content: primeiroDestaque.content,
            section: 'destaque',
            category: primeiroDestaque.category,
            tags: primeiroDestaque.tags
        };
        
        await fetch(`http://127.0.0.1:3002/api/posts/${primeiroDestaque.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(restorePayload)
        });
        
        console.log('✅ Alteração de teste desfeita\n');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

testDestaquesPersistency();