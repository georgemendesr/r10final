require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * Script para importar notícias do backup do R10 Piauí
 * 
 * USO:
 * 1. Coloque o arquivo de backup na pasta /arquivo/backup/
 * 2. Edite a constante BACKUP_FILE com o nome do arquivo
 * 3. Execute: node config/import-backup.js
 */

const BACKUP_FILE = path.join(__dirname, '..', 'backup', 'r10.db');

console.log('📥 Importador de Backup - R10 Piauí\n');
console.log(`Arquivo de backup: ${BACKUP_FILE}\n`);

// Verificar se arquivo de backup existe
if (!fs.existsSync(BACKUP_FILE)) {
  console.error('❌ Arquivo de backup não encontrado!');
  console.log('\n📝 Instruções:');
  console.log('   1. Coloque o arquivo de backup em: arquivo/backup/r10.db');
  console.log('   2. Ou edite a constante BACKUP_FILE no script');
  console.log('   3. Execute novamente: node config/import-backup.js\n');
  process.exit(1);
}

// Conectar ao banco de backup
const sqlite3 = require('sqlite3').verbose();
const backupDb = new sqlite3.Database(BACKUP_FILE, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao backup:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao backup\n');
});

// Função para importar notícias
const importarNoticias = () => {
  console.log('🔄 Iniciando importação...\n');

  // Adapte esta query de acordo com a estrutura do seu backup
  // Este é um exemplo genérico
  const selectSQL = `
    SELECT 
      titulo,
      conteudo,
      imagem,
      data_publicacao,
      autor,
      categoria
    FROM posts
    ORDER BY data_publicacao DESC
  `;

  backupDb.all(selectSQL, [], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao ler backup:', err.message);
      console.log('\n💡 Dica: Verifique se a tabela "posts" existe no backup');
      console.log('   Você pode precisar ajustar o nome da tabela na linha 48 deste script\n');
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('⚠️ Nenhuma notícia encontrada no backup\n');
      process.exit(0);
    }

    console.log(`📊 Total de notícias a importar: ${rows.length}\n`);

    let imported = 0;
    let errors = 0;

    const insertSQL = `
      INSERT INTO noticias (titulo, conteudo, imagem, data_publicacao, autor, categoria, views)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    rows.forEach((row, index) => {
      db.run(insertSQL, [
        row.titulo || 'Sem título',
        row.conteudo || '',
        row.imagem || null,
        row.data_publicacao || new Date().toISOString(),
        row.autor || 'Redação R10',
        row.categoria || 'Geral'
      ], (err) => {
        if (err) {
          console.error(`❌ Erro ao importar notícia ${index + 1}:`, err.message);
          errors++;
        } else {
          imported++;
          if (imported % 100 === 0) {
            console.log(`   ⏳ ${imported} notícias importadas...`);
          }
        }

        // Se processou todas
        if (imported + errors === rows.length) {
          console.log(`\n📊 Importação concluída:`);
          console.log(`   ✅ Importadas: ${imported}`);
          console.log(`   ❌ Erros: ${errors}`);
          console.log(`\n🎉 Pronto! Inicie o servidor com: npm start\n`);

          // Fechar conexões
          backupDb.close();
          db.close();
          process.exit(0);
        }
      });
    });
  });
};

// Perguntar se deseja limpar banco antes
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('⚠️  Deseja limpar o banco antes de importar? (s/N): ', (answer) => {
  if (answer.toLowerCase() === 's') {
    console.log('\n🗑️  Limpando banco de dados...\n');
    db.run('DELETE FROM noticias', (err) => {
      if (err) {
        console.error('❌ Erro ao limpar banco:', err.message);
        process.exit(1);
      }
      console.log('✅ Banco limpo\n');
      readline.close();
      importarNoticias();
    });
  } else {
    console.log('\n📥 Importando sem limpar banco existente...\n');
    readline.close();
    importarNoticias();
  }
});
