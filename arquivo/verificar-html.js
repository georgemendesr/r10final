const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('arquivo.db');

db.get('SELECT titulo, conteudo, data_publicacao FROM noticias WHERE id = 1', (err, row) => {
    if (err) {
        console.error('Erro:', err);
        process.exit(1);
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📰 VERIFICAÇÃO DE HTML ENTITIES\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Título:', row.titulo);
    console.log('\nData:', row.data_publicacao);
    console.log('\n───────────────────────────────────────────────────────────\n');
    console.log('Conteúdo (primeiros 500 caracteres):\n');
    console.log(row.conteudo.substring(0, 500));
    console.log('\n───────────────────────────────────────────────────────────\n');
    
    // Verificar se ainda tem entities
    const hasEntities = /&[a-z]+;|&#\d+;/i.test(row.conteudo);
    
    if (hasEntities) {
        console.log('⚠️  ATENÇÃO: Ainda há HTML entities não decodificadas!\n');
        
        // Mostrar quais entities foram encontradas
        const entities = row.conteudo.match(/&[a-z]+;|&#\d+;/gi);
        if (entities) {
            const unique = [...new Set(entities)];
            console.log('Entities encontradas:', unique.join(', '));
        }
    } else {
        console.log('✅ SUCESSO: Nenhuma HTML entity encontrada!\n');
        console.log('✅ Textos com acentuação correta: ç, ã, é, ó, etc.\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    db.close();
});
