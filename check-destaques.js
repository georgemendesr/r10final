const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

db.all('SELECT id, title, section, position FROM posts WHERE section = "destaque" ORDER BY position', [], (err, rows) => {
    if (err) {
        console.error('Erro:', err);
    } else {
        console.log('=== MATÉRIAS NA SEÇÃO DESTAQUE ===');
        console.log('Total encontradas:', rows.length);
        console.log('');
        
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ID: ${row.id} | Pos: ${row.position} | Título: ${row.title.substring(0, 50)}...`);
        });
        
        if (rows.length < 5) {
            console.log('\n⚠️  PROBLEMA: Menos de 5 matérias na seção destaque!');
        } else {
            console.log('\n✅ OK: 5 matérias encontradas na seção destaque');
        }
    }
    
    db.close();
});