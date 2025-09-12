const sqlite3 = require('sqlite3').verbose();

console.log('🚨 INVESTIGAÇÃO URGENTE: QUINTA MATÉRIA SUMIU NOVAMENTE!\n');

const db = new sqlite3.Database('./server/noticias.db');

// Verificar histórico de alterações nas últimas horas
db.all(`
    SELECT id, titulo, posicao, updated_at, created_at 
    FROM noticias 
    WHERE updated_at > datetime('now', '-2 hours')
    ORDER BY updated_at DESC
`, (err, recent) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log(`🔍 ALTERAÇÕES NAS ÚLTIMAS 2 HORAS (${recent.length} registros):`);
    recent.forEach((row, i) => {
        const timeAgo = new Date(Date.now() - new Date(row.updated_at)).getMinutes();
        console.log(`   ${i+1}. ID ${row.id} [${row.posicao.toUpperCase()}] - ${timeAgo}min atrás`);
        console.log(`      ${row.titulo.substring(0,60)}...`);
        console.log(`      Atualizado: ${row.updated_at}`);
    });
    
    console.log(`\n🚨 SUSPEITA: ${recent.length} alterações recentes podem ter causado reorganização!`);
    
    // Restaurar o quinto destaque AGORA
    db.all(`
        SELECT id, titulo, posicao, updated_at 
        FROM noticias 
        WHERE posicao = 'geral'
        ORDER BY updated_at DESC 
        LIMIT 3
    `, (err, candidates) => {
        if (err) {
            console.error('❌ Erro ao buscar candidatos:', err);
            return;
        }
        
        console.log('\n🎯 PROMOVENDO URGENTEMENTE PARA DESTAQUE:');
        const victim = candidates[0];
        
        if (victim) {
            console.log(`   Promovendo ID ${victim.id}: ${victim.titulo.substring(0,50)}...`);
            
            db.run(`
                UPDATE noticias 
                SET posicao = 'destaque', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [victim.id], (err) => {
                if (err) {
                    console.error('❌ Erro ao promover:', err);
                    return;
                }
                
                console.log('✅ RESTAURADO! Verificando...');
                
                db.all('SELECT COUNT(*) as count FROM noticias WHERE posicao = "destaque"', (err, result) => {
                    if (err) {
                        console.error('❌ Erro ao verificar:', err);
                        return;
                    }
                    
                    const count = result[0].count;
                    if (count === 5) {
                        console.log('🎉 RESOLVIDO! Agora temos 5 destaques novamente!');
                    } else {
                        console.log(`🚨 AINDA PROBLEMA: ${count} destaques em vez de 5!`);
                    }
                    
                    db.close();
                });
            });
        } else {
            console.log('❌ Não há candidatos para promover!');
            db.close();
        }
    });
});