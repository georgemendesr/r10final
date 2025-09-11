const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/noticias.db');

// Atualizar diretamente o resumo do post 21 para testar
const novoResumo = '• TESTE DIRETO NO BANCO DE DADOS 456';

console.log('🔧 Testando atualização direta no banco...');

db.run('UPDATE noticias SET resumo = ? WHERE id = ?', [novoResumo, 21], function(err) {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log(`✅ Resumo atualizado para post 21. Linhas afetadas: ${this.changes}`);
    
    // Verificar se foi salvo
    db.get('SELECT resumo FROM noticias WHERE id = ?', [21], (err2, row) => {
      if (err2) {
        console.error('❌ Erro ao verificar:', err2);
      } else {
        console.log('📝 Resumo atual no banco:', row.resumo);
      }
      db.close();
    });
  }
});