const sqlite3 = require('sqlite3').verbose();

console.log('🔍 INVESTIGANDO A LACUNA NO DESTAQUE...\n');

const db = new sqlite3.Database('./server/noticias.db');

// Primeiro, vamos ver qual matéria deve ser promovida para destaque
db.all(`
    SELECT id, titulo, posicao, updated_at 
    FROM noticias 
    WHERE posicao = 'geral'
    ORDER BY updated_at DESC 
    LIMIT 5
`, (err, gerais) => {
    if (err) {
        console.error('❌ Erro ao buscar gerais:', err);
        return;
    }
    
    console.log('📰 CANDIDATOS A DESTAQUE (matérias gerais mais recentes):');
    gerais.forEach((row, i) => {
        console.log(`   ${i+1}. ID ${row.id}: ${row.titulo.substring(0,50)}...`);
        console.log(`      Atualizado: ${row.updated_at}`);
    });
    
    if (gerais.length === 0) {
        console.log('❌ Não há matérias gerais para promover!');
        db.close();
        return;
    }
    
    // Vamos promover a mais recente para destaque
    const candidato = gerais[0];
    console.log(`\n🎯 PROMOVENDO ID ${candidato.id} PARA DESTAQUE...`);
    
    db.run(`
        UPDATE noticias 
        SET posicao = 'destaque', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `, [candidato.id], (err) => {
        if (err) {
            console.error('❌ Erro ao promover:', err);
            return;
        }
        
        console.log(`✅ ID ${candidato.id} promovido para destaque!`);
        
        // Verificar novo estado
        db.all(`
            SELECT COUNT(*) as count, posicao 
            FROM noticias 
            WHERE posicao IN ('supermanchete', 'destaque', 'geral')
            GROUP BY posicao
            ORDER BY 
                CASE posicao 
                    WHEN 'supermanchete' THEN 1 
                    WHEN 'destaque' THEN 2 
                    WHEN 'geral' THEN 3 
                END
        `, (err, counts) => {
            if (err) {
                console.error('❌ Erro ao contar:', err);
                return;
            }
            
            console.log('\n📊 ESTADO FINAL:');
            counts.forEach(c => {
                const emoji = c.posicao === 'supermanchete' ? '🏆' : 
                             c.posicao === 'destaque' ? '⭐' : '📄';
                const status = (c.posicao === 'supermanchete' && c.count === 1) ||
                              (c.posicao === 'destaque' && c.count === 5) ? '✅' : '❌';
                console.log(`   ${emoji} ${c.posicao.toUpperCase()}: ${c.count} ${status}`);
            });
            
            const destaquesCount = counts.find(c => c.posicao === 'destaque')?.count || 0;
            if (destaquesCount === 5) {
                console.log('\n🎉 PERFEITO! Agora temos exatamente 5 destaques!');
            } else {
                console.log(`\n🚨 AINDA HÁ PROBLEMA: ${destaquesCount} destaques em vez de 5!`);
            }
            
            db.close();
        });
    });
});