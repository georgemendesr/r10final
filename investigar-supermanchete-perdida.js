const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🕵️ INVESTIGANDO O DESAPARECIMENTO DA SUPERMANCHETE...\n');

// Vamos ver o histórico completo ordenado por updated_at
db.all(`
    SELECT id, titulo, posicao, updated_at, created_at 
    FROM noticias 
    ORDER BY updated_at DESC 
    LIMIT 15
`, (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log('📅 HISTÓRICO COMPLETO DE ALTERAÇÕES (mais recentes primeiro):');
    rows.forEach((row, i) => {
        const isRecent = new Date(row.updated_at) > new Date('2025-09-09 13:00:00');
        const marker = isRecent ? '🔥' : '📄';
        console.log(`${marker} ${i+1}. ID ${row.id} [${row.posicao.toUpperCase()}] - ${row.titulo.substring(0,40)}...`);
        console.log(`    Criado: ${row.created_at}`);
        console.log(`    Atualizado: ${row.updated_at}`);
        console.log('');
    });
    
    // Procurar por matérias que podem ter sido supermanchete
    console.log('🔍 PROCURANDO POSSÍVEL EX-SUPERMANCHETE...');
    
    // Vamos ver se alguma matéria teve updated_at muito recente que pode ter perdido a posição
    db.all(`
        SELECT id, titulo, posicao, updated_at, created_at 
        FROM noticias 
        WHERE updated_at > '2025-09-09 13:00:00'
        ORDER BY updated_at DESC
    `, (err, recentes) => {
        if (err) {
            console.error('❌ Erro ao buscar recentes:', err);
            return;
        }
        
        console.log(`\n⚡ ALTERAÇÕES SUSPEITAS HOJE (${recentes.length} matérias alteradas):`);
        recentes.forEach((row, i) => {
            console.log(`   ${i+1}. ID ${row.id} [${row.posicao}] - ${row.titulo.substring(0,50)}...`);
            console.log(`      Atualizado: ${row.updated_at}`);
        });
        
        if (recentes.length > 0) {
            console.log(`\n🚨 SUSPEITA: ${recentes.length} matérias foram alteradas hoje!`);
            console.log('   Isso pode explicar a reorganização não intencional.');
        }
        
        db.close();
    });
});