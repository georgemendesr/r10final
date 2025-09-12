const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

db.all('SELECT id, titulo, position FROM noticias WHERE position = "destaque" ORDER BY updated_at DESC', (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        return;
    }
    
    console.log(`📊 DESTAQUES ATUAIS: ${rows.length}`);
    rows.forEach((row, i) => {
        console.log(`   ${i+1}. ID ${row.id}: ${row.titulo.substring(0,50)}...`);
    });
    
    console.log(`\n🎯 Deveria ter 5 destaques, mas tem apenas ${rows.length}`);
    
    db.close();
});