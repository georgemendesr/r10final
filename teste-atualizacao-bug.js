const sqlite3 = require('sqlite3').verbose();

console.log('🧪 TESTE: ATUALIZAÇÃO SEM MUDANÇA DE POSIÇÃO\n');

// Primeiro, vamos estabelecer um estado conhecido
const db = new sqlite3.Database('./server/noticias.db');

console.log('1️⃣ ESTADO INICIAL:');

db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao IN ("supermanchete", "destaque") ORDER BY posicao DESC, updated_at DESC', (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log(`📊 Supermanchetes e Destaques atuais: ${rows.length}`);
    rows.forEach((row, i) => {
        console.log(`   ${i+1}. ID ${row.id} [${row.posicao.toUpperCase()}] - ${row.titulo.substring(0,40)}...`);
    });
    
    if (rows.length === 0) {
        console.log('🚨 Não há destaques ou supermanchetes para testar!');
        db.close();
        return;
    }
    
    // Pegar o primeiro destaque para testar
    const testePost = rows.find(r => r.posicao === 'destaque');
    if (!testePost) {
        console.log('🚨 Não há destaques para testar!');
        db.close();
        return;
    }
    
    console.log(`\n2️⃣ TESTANDO ATUALIZAÇÃO SEM MUDANÇA DE POSIÇÃO:`);
    console.log(`   Atualizando ID ${testePost.id} (${testePost.titulo.substring(0,30)}...)`);
    console.log(`   Mantendo posição: ${testePost.posicao}`);
    
    // Simular uma atualização via API
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    fetch(`http://localhost:3002/api/posts/${testePost.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            titulo: testePost.titulo + ' [TESTE ATUALIZADO]',
            posicao: testePost.posicao  // MESMA posição
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('❌ Erro na API:', data.error);
            return;
        }
        
        console.log('✅ Atualização enviada via API');
        
        // Aguardar um pouco e verificar se as posições mudaram
        setTimeout(() => {
            console.log('\n3️⃣ VERIFICANDO SE HOUVE REORGANIZAÇÃO INDEVIDA:');
            
            db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao IN ("supermanchete", "destaque") ORDER BY posicao DESC, updated_at DESC', (err, newRows) => {
                if (err) {
                    console.error('❌ Erro ao verificar:', err);
                    return;
                }
                
                console.log(`📊 Após atualização: ${newRows.length} supermanchetes/destaques`);
                newRows.forEach((row, i) => {
                    console.log(`   ${i+1}. ID ${row.id} [${row.posicao.toUpperCase()}] - ${row.titulo.substring(0,40)}...`);
                });
                
                // Comparar
                const initialCount = rows.filter(r => r.posicao === 'destaque').length;
                const finalCount = newRows.filter(r => r.posicao === 'destaque').length;
                
                if (initialCount === finalCount && finalCount === 5) {
                    console.log('\n🎉 SUCESSO! Não houve reorganização indevida!');
                    console.log(`   Destaques mantidos: ${finalCount}`);
                } else {
                    console.log('\n🚨 PROBLEMA! Houve reorganização indevida!');
                    console.log(`   Destaques antes: ${initialCount} → depois: ${finalCount}`);
                }
                
                // Reverter o teste
                db.run(`UPDATE noticias SET titulo = ? WHERE id = ?`, 
                    [testePost.titulo, testePost.id], 
                    (err) => {
                        if (!err) {
                            console.log('🔄 Teste revertido');
                        }
                        db.close();
                    }
                );
            });
        }, 1000);
    })
    .catch(error => {
        console.error('❌ Erro de rede:', error);
        db.close();
    });
});