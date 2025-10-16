const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const BACKUP_DB = path.join(__dirname, 'backup', 'r10.db');
const CURRENT_DB = path.join(__dirname, 'arquivo.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

console.log('🔍 ANALISANDO ESTRUTURA DO BACKUP ORIGINAL\n');

// Verificar se backup existe
if (!fs.existsSync(BACKUP_DB)) {
  console.error('❌ Backup não encontrado:', BACKUP_DB);
  process.exit(1);
}

const backupDb = new sqlite3.Database(BACKUP_DB, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir backup:', err.message);
    process.exit(1);
  }
});

// Listar tabelas
backupDb.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    backupDb.close();
    return;
  }

  console.log('📋 TABELAS NO BACKUP:');
  tables.forEach(t => console.log(`   - ${t.name}`));
  console.log('');

  // Tentar encontrar tabela de posts/notícias
  const possibleTables = ['posts', 'noticias', 'articles', 'post', 'noticia'];
  const foundTable = tables.find(t => possibleTables.includes(t.name.toLowerCase()));

  if (!foundTable) {
    console.log('⚠️ Tabela de notícias não encontrada automaticamente');
    console.log('Tabelas disponíveis:', tables.map(t => t.name).join(', '));
    backupDb.close();
    return;
  }

  const tableName = foundTable.name;
  console.log(`✅ Usando tabela: ${tableName}\n`);

  // Ver estrutura da tabela
  backupDb.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
    if (err) {
      console.error('❌ Erro ao ler estrutura:', err.message);
      backupDb.close();
      return;
    }

    console.log('📊 ESTRUTURA DA TABELA:');
    columns.forEach(col => {
      console.log(`   ${col.name} (${col.type})`);
    });
    console.log('');

    // Verificar coluna de imagem
    const imageCol = columns.find(c => 
      c.name.toLowerCase().includes('image') || 
      c.name.toLowerCase().includes('imagem') ||
      c.name.toLowerCase().includes('foto')
    );

    if (!imageCol) {
      console.log('⚠️ Coluna de imagem não encontrada');
      backupDb.close();
      return;
    }

    console.log(`✅ Coluna de imagem: ${imageCol.name}\n`);

    // Ver exemplos de imagens
    backupDb.all(
      `SELECT id, titulo, ${imageCol.name} as imagem FROM ${tableName} WHERE ${imageCol.name} IS NOT NULL AND ${imageCol.name} != '' LIMIT 10`,
      [],
      (err, rows) => {
        if (err) {
          console.error('❌ Erro:', err.message);
          backupDb.close();
          return;
        }

        console.log('📸 EXEMPLOS DE IMAGENS NO BACKUP ORIGINAL:\n');
        rows.forEach(r => {
          console.log(`   ID ${r.id}:`);
          console.log(`   Título: ${r.titulo?.substring(0, 60)}...`);
          console.log(`   Imagem: ${r.imagem}`);
          console.log('');
        });

        // Verificar correspondência com arquivos atuais
        console.log('🔄 VERIFICANDO CORRESPONDÊNCIA COM ARQUIVOS ATUAIS:\n');

        const editorDir = path.join(UPLOADS_DIR, 'editor');
        const imagensDir = path.join(UPLOADS_DIR, 'imagens');
        
        let editorFiles = [];
        let imagensFiles = [];

        if (fs.existsSync(editorDir)) {
          editorFiles = fs.readdirSync(editorDir).filter(f => !f.includes('~'));
        }
        if (fs.existsSync(imagensDir)) {
          imagensFiles = fs.readdirSync(imagensDir).filter(f => !f.includes('~'));
        }

        console.log(`📁 Arquivos atuais:`);
        console.log(`   editor/: ${editorFiles.length} arquivos`);
        console.log(`   imagens/: ${imagensFiles.length} arquivos`);
        console.log('');

        // Tentar mapear
        console.log('🎯 TENTANDO MAPEAR:\n');
        
        let matched = 0;
        let notMatched = 0;

        rows.forEach(r => {
          const imagePath = r.imagem;
          
          if (!imagePath) return;

          // Extrair nome do arquivo
          const filename = imagePath.split('/').pop();
          
          // Procurar em editor e imagens
          const inEditor = editorFiles.includes(filename);
          const inImagens = imagensFiles.includes(filename);

          if (inEditor || inImagens) {
            matched++;
            console.log(`✅ MATCH: ${filename}`);
            console.log(`   Backup: ${imagePath}`);
            console.log(`   Atual: arquivo/uploads/${inEditor ? 'editor' : 'imagens'}/${filename}`);
            console.log('');
          } else {
            notMatched++;
            console.log(`❌ NÃO ENCONTRADO: ${filename}`);
            console.log(`   Esperado em: ${imagePath}`);
            console.log('');
          }
        });

        console.log(`\n📊 RESUMO:`);
        console.log(`   ✅ Correspondências: ${matched}/${rows.length}`);
        console.log(`   ❌ Não encontrados: ${notMatched}/${rows.length}`);

        backupDb.close();

        if (matched > 0) {
          console.log('\n🎉 ÓTIMA NOTÍCIA! Há correspondências!');
          console.log('   Podemos prosseguir com a migração e depois');
          console.log('   ajustar o banco baseado nos arquivos reais.');
        } else {
          console.log('\n⚠️ PROBLEMA: Nenhuma correspondência encontrada');
          console.log('   Os nomes dos arquivos não batem com o banco.');
        }
      }
    );
  });
});
