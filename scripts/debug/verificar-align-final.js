const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando marcadores ALIGN no banco...');

// Primeiro verificar qual tabela existe
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('❌ Erro ao listar tabelas:', err);
        db.close();
        return;
    }
    
    console.log('📋 Tabelas encontradas:', tables.map(t => t.name));
    
    // Usar a tabela correta (noticias ou posts)
    const tableName = tables.find(t => t.name === 'noticias' || t.name === 'posts')?.name;
    if (!tableName) {
        console.log('❌ Nenhuma tabela de notícias encontrada');
        db.close();
        return;
    }
    
    console.log(`🔍 Usando tabela: ${tableName}`);
    
    db.all(`SELECT id, titulo, conteudo FROM ${tableName} WHERE conteudo LIKE "%ALIGN%"`, (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        db.close();
        return;
    }
    
    if (rows.length > 0) {
        console.log(`❌ ENCONTRADOS ${rows.length} POSTS COM MARCADORES:`);
        rows.forEach(row => {
            console.log(`\nPost ${row.id}: ${row.titulo}`);
            const matches = row.conteudo.match(/ALIGN_[^\\s]*/g);
            if (matches) {
                console.log(`   Marcadores: ${matches.join(', ')}`);
            }
        });
    } else {
        console.log('✅ Nenhum marcador ALIGN encontrado no banco');
    }
    
    db.close();
    });
});