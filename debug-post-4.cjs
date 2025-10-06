const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'noticias.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Investigando matéria ID 4 (UESPI)...\n');

db.get('SELECT * FROM noticias WHERE id = ?', [4], (err, row) => {
  if (err) {
    console.error('❌ Erro ao buscar:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ Matéria ID 4 não encontrada!');
    db.close();
    return;
  }
  
  console.log('📋 Dados da matéria:');
  console.log('ID:', row.id);
  console.log('Título:', row.titulo);
  console.log('Posição:', row.posicao);
  console.log('\n🖼️ Campos de imagem:');
  console.log('imagem:', row.imagem || '(vazio)');
  console.log('imagemUrl:', row.imagemUrl || '(vazio)');
  console.log('imagem_url:', row.imagem_url || '(vazio)');
  console.log('imagem_destaque:', row.imagem_destaque || '(vazio)');
  console.log('imagemDestaque:', row.imagemDestaque || '(vazio)');
  
  console.log('\n📝 Outros campos:');
  console.log('categoria:', row.categoria);
  console.log('chapeu:', row.chapeu);
  console.log('resumo:', row.resumo ? row.resumo.substring(0, 100) + '...' : '(vazio)');
  
  db.close();
  
  // Verificar qual campo está preenchido
  const imagemFields = {
    imagem: row.imagem,
    imagemUrl: row.imagemUrl,
    imagem_url: row.imagem_url,
    imagem_destaque: row.imagem_destaque,
    imagemDestaque: row.imagemDestaque
  };
  
  const preenchidos = Object.entries(imagemFields).filter(([k, v]) => v && v.trim());
  console.log('\n✅ Campos de imagem preenchidos:', preenchidos.length);
  preenchidos.forEach(([campo, valor]) => {
    console.log(`  - ${campo}: ${valor.substring(0, 80)}...`);
  });
  
  if (preenchidos.length === 0) {
    console.log('\n⚠️ PROBLEMA: Nenhum campo de imagem está preenchido!');
  }
});
