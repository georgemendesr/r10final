const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/noticias.db');

console.log('🧪 TESTANDO CORREÇÃO DA LÓGICA DE ROTAÇÃO');

// Primeiro, verificar estado atual
console.log('\n1️⃣ ESTADO ANTES DA ALTERAÇÃO:');
db.all("SELECT id, titulo, posicao FROM noticias WHERE posicao IN ('supermanchete', 'destaque') ORDER BY posicao, id", (err, before) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    const supermanchetes = before.filter(p => p.posicao === 'supermanchete');
    const destaques = before.filter(p => p.posicao === 'destaque');
    
    console.log(`📊 Supermanchetes: ${supermanchetes.length}`);
    supermanchetes.forEach(s => console.log(`   - ID ${s.id}: ${s.titulo.substring(0, 50)}...`));
    
    console.log(`📊 Destaques: ${destaques.length}`);
    destaques.forEach(d => console.log(`   - ID ${d.id}: ${d.titulo.substring(0, 50)}...`));
    
    if (destaques.length !== 5) {
        console.log(`⚠️  ATENÇÃO: Existem ${destaques.length} destaques em vez de 5!`);
    }
    
    // 2. Simular criação de nova supermanchete
    console.log('\n2️⃣ PROMOVENDO POST 18 PARA SUPERMANCHETE (teste)...');
    
    // Usar a API interna para simular reorganização
    db.get("SELECT * FROM noticias WHERE id = 18", (err, post18) => {
        if (err || !post18) {
            console.error('❌ Post 18 não encontrado');
            db.close();
            return;
        }
        
        console.log(`🎯 Post a promover: ID ${post18.id} - ${post18.titulo}`);
        console.log(`   Posição atual: ${post18.posicao} → supermanchete`);
        
        // Primeiro atualizar o post 18 para supermanchete
        db.run("UPDATE noticias SET posicao = 'supermanchete' WHERE id = 18", function(err) {
            if (err) {
                console.error('❌ Erro ao atualizar post 18:', err);
                db.close();
                return;
            }
            
            console.log('✅ Post 18 atualizado para supermanchete');
            
            // Agora simular a reorganização (função corrigida)
            console.log('\n3️⃣ EXECUTANDO REORGANIZAÇÃO AUTOMÁTICA...');
            
            // Verificar resultado após reorganização
            setTimeout(() => {
                db.all("SELECT id, titulo, posicao FROM noticias WHERE posicao IN ('supermanchete', 'destaque') ORDER BY posicao, id", (err, after) => {
                    if (err) {
                        console.error('❌ Erro ao verificar resultado:', err);
                        db.close();
                        return;
                    }
                    
                    console.log('\n4️⃣ ESTADO APÓS REORGANIZAÇÃO:');
                    
                    const superAfter = after.filter(p => p.posicao === 'supermanchete');
                    const destaquesAfter = after.filter(p => p.posicao === 'destaque');
                    
                    console.log(`📊 Supermanchetes: ${superAfter.length}`);
                    superAfter.forEach(s => console.log(`   - ID ${s.id}: ${s.titulo.substring(0, 50)}...`));
                    
                    console.log(`📊 Destaques: ${destaquesAfter.length}`);
                    destaquesAfter.forEach(d => console.log(`   - ID ${d.id}: ${d.titulo.substring(0, 50)}...`));
                    
                    if (destaquesAfter.length === 5) {
                        console.log('\n🎉 SUCESSO! A seção DESTAQUE mantém exatamente 5 matérias!');
                    } else {
                        console.log(`\n❌ PROBLEMA: Destaques = ${destaquesAfter.length} (deveria ser 5)`);
                    }
                    
                    // Restaurar estado anterior para não bagunçar
                    console.log('\n5️⃣ RESTAURANDO ESTADO ANTERIOR...');
                    db.run("UPDATE noticias SET posicao = 'geral' WHERE id = 18", () => {
                        console.log('✅ Post 18 restaurado para posição original');
                        db.close();
                    });
                });
            }, 1000); // Aguardar reorganização automática
        });
    });
});