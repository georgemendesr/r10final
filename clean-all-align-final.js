const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔥 LIMPEZA FINAL ULTRA-AGRESSIVA DE TODOS OS MARCADORES ALIGN 🔥');

// Lista de todos os possíveis marcadores ALIGN para remover
const alignMarkers = [
    'ALIGN_justify_START',
    'ALIGN_justify_END', 
    'ALIGN_left_START',
    'ALIGN_left_END',
    'ALIGN_center_START',
    'ALIGN_center_END',
    'ALIGN_right_START',
    'ALIGN_right_END',
    '**ALIGN_justify_START**',
    '**ALIGN_justify_END**',
    '**ALIGN_left_START**',
    '**ALIGN_left_END**',
    '**ALIGN_center_START**',
    '**ALIGN_center_END**',
    '**ALIGN_right_START**',
    '**ALIGN_right_END**'
];

console.log('🎯 Marcadores a serem removidos:', alignMarkers);

// Primeiro, ver quais posts têm marcadores
db.all('SELECT id, titulo FROM noticias WHERE conteudo LIKE "%ALIGN%"', (err, rows) => {
    if (err) {
        console.error('❌ Erro ao buscar posts:', err);
        db.close();
        return;
    }
    
    console.log(`📊 Encontrados ${rows.length} posts com marcadores ALIGN`);
    
    if (rows.length === 0) {
        console.log('✅ Nenhum marcador encontrado - banco já limpo!');
        db.close();
        return;
    }
    
    rows.forEach(row => {
        console.log(`📝 Post ${row.id}: ${row.titulo}`);
    });
    
    // Agora limpar TODOS os marcadores de uma vez
    console.log('\n🧹 INICIANDO LIMPEZA MEGA-AGRESSIVA...');
    
    let updateQuery = 'UPDATE noticias SET conteudo = ';
    
    // Construir query para remover todos os marcadores
    let replacements = 'conteudo';
    alignMarkers.forEach(marker => {
        replacements = `REPLACE(${replacements}, '${marker}', '')`;
    });
    
    updateQuery += replacements + ' WHERE conteudo LIKE "%ALIGN%"';
    
    console.log('🔧 Query de limpeza:', updateQuery);
    
    db.run(updateQuery, function(err) {
        if (err) {
            console.error('❌ Erro na limpeza:', err);
        } else {
            console.log(`✅ LIMPEZA CONCLUÍDA! ${this.changes} registros atualizados`);
            
            // Verificar se ainda existem marcadores
            db.all('SELECT id, titulo FROM noticias WHERE conteudo LIKE "%ALIGN%"', (err, remainingRows) => {
                if (err) {
                    console.error('❌ Erro na verificação:', err);
                } else {
                    if (remainingRows.length === 0) {
                        console.log('🎉 SUCESSO TOTAL! Nenhum marcador ALIGN restante!');
                    } else {
                        console.log(`⚠️  Ainda restam ${remainingRows.length} posts com marcadores:`);
                        remainingRows.forEach(row => {
                            console.log(`   - Post ${row.id}: ${row.titulo}`);
                        });
                    }
                }
                db.close();
            });
        }
    });
});