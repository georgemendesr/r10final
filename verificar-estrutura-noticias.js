const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

// Primeiro vamos ver a estrutura da tabela
db.all("PRAGMA table_info(noticias)", (err, columns) => {
    if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
        return;
    }
    
    console.log('🏗️ ESTRUTURA DA TABELA NOTICIAS:');
    columns.forEach(col => {
        console.log(`   ${col.name} (${col.type})`);
    });
    
    // Agora vamos ver todos os dados
    db.all('SELECT * FROM noticias LIMIT 3', (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar dados:', err);
            return;
        }
        
        console.log('\n📄 EXEMPLO DE DADOS:');
        if (rows.length > 0) {
            console.log('Colunas:', Object.keys(rows[0]));
            rows.forEach((row, i) => {
                console.log(`\nRegistro ${i+1}:`);
                Object.keys(row).forEach(key => {
                    let value = row[key];
                    if (typeof value === 'string' && value.length > 50) {
                        value = value.substring(0, 50) + '...';
                    }
                    console.log(`  ${key}: ${value}`);
                });
            });
        }
        
        db.close();
    });
});