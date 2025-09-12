const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 INVESTIGANDO ONDE ESTÃO OS DESTAQUES PERDIDOS...\n');

// Vamos ver as últimas alterações por data
db.all(`
    SELECT id, titulo, posicao, updated_at, created_at 
    FROM noticias 
    WHERE posicao IN ('destaque', 'geral', 'supermanchete')
    ORDER BY updated_at DESC 
    LIMIT 10
`, (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log('📅 ÚLTIMAS ALTERAÇÕES DE POSIÇÃO:');
    rows.forEach((row, i) => {
        console.log(`${i+1}. ID ${row.id} [${row.posicao.toUpperCase()}] - ${row.titulo.substring(0,40)}...`);
        console.log(`   Atualizado: ${row.updated_at}`);
    });
    
    // Vamos verificar se algum artigo pode ter sido movido incorretamente
    console.log('\n🔍 PROCURANDO CANDIDATOS PARA DESTAQUE...');
    
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
        
        console.log('\n📰 MATÉRIAS GERAIS MAIS RECENTES (candidatas a destaque):');
        gerais.forEach((row, i) => {
            console.log(`   ${i+1}. ID ${row.id}: ${row.titulo.substring(0,50)}...`);
            console.log(`      Atualizado: ${row.updated_at}`);
        });
        
        // Vamos promover o mais recente para destaque
        const candidato = gerais[0];
        if (candidato) {
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
                db.all('SELECT COUNT(*) as count FROM noticias WHERE posicao = "destaque"', (err, result) => {
                    if (err) {
                        console.error('❌ Erro ao contar:', err);
                        return;
                    }
                    
                    console.log(`\n🎉 AGORA TEMOS ${result[0].count} DESTAQUES!`);
                    
                    db.close();
                });
            });
        } else {
            console.log('\n❌ Nenhum candidato encontrado!');
            db.close();
        }
    });
});