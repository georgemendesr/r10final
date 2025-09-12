const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 VERIFICANDO POSIÇÕES ATUAIS...\n');

// Verificar supermanchete
db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao = "supermanchete" ORDER BY updated_at DESC', (err, rows) => {
    if (err) {
        console.error('❌ Erro supermanchete:', err);
        return;
    }
    
    console.log(`📰 SUPERMANCHETES: ${rows.length}`);
    rows.forEach((row, i) => {
        console.log(`   ${i+1}. ID ${row.id}: ${row.titulo.substring(0,50)}...`);
    });
    
    // Verificar destaques
    db.all('SELECT id, titulo, posicao FROM noticias WHERE posicao = "destaque" ORDER BY updated_at DESC', (err, rows) => {
        if (err) {
            console.error('❌ Erro destaques:', err);
            return;
        }
        
        console.log(`\n⭐ DESTAQUES: ${rows.length}`);
        rows.forEach((row, i) => {
            console.log(`   ${i+1}. ID ${row.id}: ${row.titulo.substring(0,50)}...`);
        });
        
        if (rows.length !== 5) {
            console.log(`\n🚨 PROBLEMA: Deveria ter 5 destaques, mas tem ${rows.length}!`);
        } else {
            console.log(`\n✅ OK: Exatamente 5 destaques como esperado!`);
        }
        
        // Verificar gerais
        db.all('SELECT COUNT(*) as count FROM noticias WHERE posicao = "geral"', (err, rows) => {
            if (err) {
                console.error('❌ Erro gerais:', err);
                return;
            }
            
            console.log(`\n📄 GERAIS: ${rows[0].count}`);
            
            db.close();
        });
    });
});