const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 VERIFICANDO TRIGGERS NO BANCO DE DADOS');

db.all('SELECT name, sql FROM sqlite_master WHERE type = "trigger"', (err, triggers) => {
    if (err) {
        console.error('❌ Erro:', err);
    } else if (triggers.length > 0) {
        console.log('🚨 TRIGGERS ENCONTRADOS QUE PODEM ESTAR ALTERANDO POSIÇÕES:');
        triggers.forEach(trigger => {
            console.log(`\n📝 Trigger: ${trigger.name}`);
            console.log(`📄 SQL: ${trigger.sql}`);
        });
    } else {
        console.log('✅ Nenhum trigger encontrado no banco de dados');
    }
    
    db.close();
});