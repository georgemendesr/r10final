require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Script para verificar a estrutura do backup do R10 Piauí
 * Execute: node config/verificar-backup.js
 */

const BACKUP_FILE = path.join(__dirname, '..', 'backup', 'r10.db');

console.log('\n🔍 Verificador de Backup - R10 Piauí\n');
console.log(`Arquivo: ${BACKUP_FILE}\n`);
console.log('═'.repeat(60) + '\n');

const db = new sqlite3.Database(BACKUP_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir backup:', err.message);
    console.log('\n💡 Dicas:');
    console.log('   - Verifique se o arquivo existe em /arquivo/r10');
    console.log('   - Certifique-se de que é um arquivo SQLite válido');
    console.log('   - Tente descompactar o r10.gz se necessário\n');
    process.exit(1);
  }

  console.log('✅ Backup aberto com sucesso!\n');

  // Listar todas as tabelas
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
    if (err) {
      console.error('❌ Erro ao listar tabelas:', err.message);
      process.exit(1);
    }

    console.log('📋 TABELAS ENCONTRADAS:\n');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });

    if (tables.length === 0) {
      console.log('   ⚠️ Nenhuma tabela encontrada!\n');
      process.exit(0);
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Tentar encontrar tabela de notícias/posts
    const possiveisTabelas = ['posts', 'noticias', 'articles', 'news', 'materias'];
    let tabelaEncontrada = null;

    for (const nome of possiveisTabelas) {
      if (tables.some(t => t.name.toLowerCase() === nome.toLowerCase())) {
        tabelaEncontrada = nome;
        break;
      }
    }

    if (!tabelaEncontrada && tables.length > 0) {
      // Usar a primeira tabela como tentativa
      tabelaEncontrada = tables[0].name;
    }

    if (tabelaEncontrada) {
      console.log(`📊 Analisando tabela: "${tabelaEncontrada}"\n`);

      // Ver estrutura da tabela
      db.all(`PRAGMA table_info(${tabelaEncontrada})`, [], (err, columns) => {
        if (err) {
          console.error('❌ Erro ao ler estrutura:', err.message);
          db.close();
          return;
        }

        console.log('🔧 COLUNAS:\n');
        columns.forEach(col => {
          const pk = col.pk ? ' 🔑' : '';
          const notNull = col.notnull ? ' (NOT NULL)' : '';
          console.log(`   - ${col.name}: ${col.type}${notNull}${pk}`);
        });

        // Contar registros
        db.get(`SELECT COUNT(*) as total FROM ${tabelaEncontrada}`, [], (err, result) => {
          if (err) {
            console.error('❌ Erro ao contar registros:', err.message);
          } else {
            console.log(`\n📈 Total de registros: ${result.total}`);
          }

          // Mostrar amostra
          db.all(`SELECT * FROM ${tabelaEncontrada} LIMIT 1`, [], (err, sample) => {
            if (err) {
              console.error('❌ Erro ao ler amostra:', err.message);
            } else if (sample.length > 0) {
              console.log('\n📝 AMOSTRA DE DADOS:\n');
              console.log(JSON.stringify(sample[0], null, 2));
            }

            console.log('\n' + '═'.repeat(60) + '\n');
            console.log('✅ Análise concluída!\n');
            console.log('💡 PRÓXIMOS PASSOS:\n');
            console.log(`   1. Edite config/import-backup.js`);
            console.log(`   2. Na linha 48, troque "posts" por "${tabelaEncontrada}"`);
            console.log(`   3. Ajuste os nomes das colunas se necessário`);
            console.log(`   4. Execute: node config/import-backup.js\n`);

            db.close();
          });
        });
      });
    } else {
      console.log('⚠️ Não foi possível identificar a tabela de notícias\n');
      console.log('💡 Verifique manualmente qual tabela contém as notícias\n');
      db.close();
    }
  });
});
