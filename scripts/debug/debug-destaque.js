const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 INVESTIGANDO O PROBLEMA DA SEÇÃO DESTAQUE 🔍');

// Verificar todas as matérias marcadas como destaque
// Primeiro verificar estrutura da tabela
db.all("PRAGMA table_info(noticias)", (err, info) => {
    if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
        return;
    }
    
    console.log('📋 Colunas da tabela:');
    info.forEach(col => console.log(`   - ${col.name} (${col.type})`));
    
    // Agora buscar matérias destaque
    db.all("SELECT id, titulo, posicao FROM noticias WHERE posicao = 'destaque' ORDER BY id DESC", (err, rows) => {
    if (err) {
        console.error('❌ Erro:', err);
        db.close();
        return;
    }
    
    console.log(`\n📊 TOTAL DE MATÉRIAS DESTAQUE: ${rows.length}`);
    console.log('📋 Lista completa das matérias destaque:');
    
    rows.forEach((row, index) => {
        console.log(`${index + 1}. [ID ${row.id}] ${row.titulo}`);
    });
    
    if (rows.length < 5) {
        console.log(`\n⚠️  PROBLEMA IDENTIFICADO: Só existem ${rows.length} matérias marcadas como destaque!`);
        console.log('❗ A seção deveria ter 5 matérias, mas o banco só tem', rows.length);
    } else if (rows.length > 5) {
        console.log(`\n📈 Existem ${rows.length} matérias destaque (mais que 5)`);
        console.log('💡 O sistema pode estar limitando a exibição');
    } else {
        console.log('\n✅ Existem exatamente 5 matérias destaque no banco');
    }
    
    // Verificar também outras posições para comparação
    console.log('\n🔍 Verificando outras posições:');
    
    db.all("SELECT posicao, COUNT(*) as total FROM noticias GROUP BY posicao ORDER BY total DESC", (err, positions) => {
        if (err) {
            console.error('❌ Erro ao contar posições:', err);
        } else {
            console.log('📊 Distribuição por posição:');
            positions.forEach(pos => {
                console.log(`   ${pos.posicao}: ${pos.total} matérias`);
            });
        }
        
        db.close();
        });
    });
});