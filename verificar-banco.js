const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS\n');

// Primeiro, verificar quais tabelas existem
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
        console.error('Erro ao verificar tabelas:', err);
        db.close();
        return;
    }

    console.log('📋 TABELAS ENCONTRADAS:');
    tables.forEach(table => {
        console.log(`   - ${table.name}`);
    });

    // Verificar estrutura da tabela principal
    const tableName = tables.find(t => t.name.includes('noticias') || t.name.includes('posts') || t.name.includes('articles'))?.name;
    
    if (tableName) {
        console.log(`\n🔍 ESTRUTURA DA TABELA: ${tableName}`);
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
            if (err) {
                console.error('Erro ao verificar colunas:', err);
                db.close();
                return;
            }

            console.log('📋 COLUNAS:');
            columns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})`);
            });

            // Agora verificar dados com as colunas corretas
            console.log(`\n📊 DADOS DA TABELA ${tableName}:`);
            db.all(`SELECT * FROM ${tableName} LIMIT 5`, [], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar dados:', err);
                } else {
                    console.log(`   Total de registros (amostra): ${rows.length}`);
                    if (rows.length > 0) {
                        console.log('   Exemplo de registro:');
                        console.log('  ', JSON.stringify(rows[0], null, 2));
                    }
                }
                db.close();
            });
        });
    } else {
        console.log('\n❌ Nenhuma tabela de notícias encontrada!');
        db.close();
    }
});