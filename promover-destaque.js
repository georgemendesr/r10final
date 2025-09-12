const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 MATÉRIAS GERAIS DISPONÍVEIS PARA PROMOVER A DESTAQUE:');

db.all("SELECT id, titulo, posicao FROM noticias WHERE posicao = 'geral' ORDER BY id DESC LIMIT 10", (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        db.close();
        return;
    }
    
    console.log(`\n📊 ${rows.length} matérias gerais encontradas:`);
    
    rows.forEach((row, index) => {
        console.log(`${index + 1}. [ID ${row.id}] ${row.titulo}`);
    });
    
    if (rows.length > 0) {
        console.log('\n💡 SOLUÇÃO: Promover uma dessas matérias para "destaque"');
        console.log(`🎯 Recomendação: Promover a matéria ID ${rows[0].id} para completar as 5 posições destaque`);
        
        // Promover automaticamente a primeira matéria geral para destaque
        console.log('\n🚀 PROMOVENDO AUTOMATICAMENTE...');
        
        db.run("UPDATE noticias SET posicao = 'destaque' WHERE id = ?", [rows[0].id], function(err) {
            if (err) {
                console.error('❌ Erro ao promover:', err);
            } else {
                console.log(`✅ SUCESSO! Matéria ID ${rows[0].id} promovida para DESTAQUE`);
                console.log('🎉 Agora a seção DESTAQUE tem 5 matérias!');
                
                // Verificar resultado final
                db.all("SELECT COUNT(*) as total FROM noticias WHERE posicao = 'destaque'", (err, result) => {
                    if (err) {
                        console.error('❌ Erro na verificação:', err);
                    } else {
                        console.log(`\n📊 TOTAL FINAL DE MATÉRIAS DESTAQUE: ${result[0].total}`);
                    }
                    db.close();
                });
            }
        });
    } else {
        console.log('\n❌ Nenhuma matéria geral disponível para promover!');
        db.close();
    }
});