const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 VERIFICANDO MATÉRIA 21...\n');

db.get('SELECT * FROM noticias WHERE id = 21', [], (err, row) => {
    if (err) {
        console.error('Erro:', err);
        db.close();
        return;
    }

    if (!row) {
        console.log('❌ Matéria 21 não encontrada!');
        db.close();
        return;
    }

    console.log('📰 MATÉRIA 21 ENCONTRADA:');
    console.log(`   Título: ${row.titulo}`);
    console.log(`   Posição: ${row.posicao}`);
    console.log(`   Autor: ${row.autor}`);
    console.log(`   Categoria: ${row.categoria}`);
    console.log('\n📄 CONTEÚDO (primeiros 500 chars):');
    console.log(row.conteudo.substring(0, 500));
    console.log('\n📄 CONTEÚDO COMPLETO:');
    console.log('---START---');
    console.log(row.conteudo);
    console.log('---END---');

    db.close();
});