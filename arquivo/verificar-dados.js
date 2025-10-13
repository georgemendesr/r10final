const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('arquivo.db');

db.all('SELECT id, titulo, categoria, autor, data_publicacao FROM noticias LIMIT 5', (err, rows) => {
    if (err) {
        console.error('Erro:', err);
        process.exit(1);
    }
    
    console.log(`\n📊 Total de registros: ${rows.length}\n`);
    
    rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.titulo}`);
        console.log(`   Categoria: ${row.categoria}`);
        console.log(`   Autor: ${row.autor || '(sem autor)'}`);
        console.log(`   Data: ${row.data_publicacao}`);
        console.log('');
    });
    
    db.get('SELECT COUNT(*) as total FROM noticias', (err, row) => {
        console.log(`✅ Total no banco: ${row.total} notícias\n`);
        db.close();
    });
});
