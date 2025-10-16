const Database = require('better-sqlite3');
const db = new Database('arquivo.db', { readonly: true });

console.log('=== VERIFICANDO NOTÍCIA DA KARYNE ===\n');

const noticia = db.prepare(`
  SELECT id, titulo, imagem 
  FROM noticias 
  WHERE titulo LIKE '%Karyne do Rodrigão é premiada%'
  LIMIT 1
`).get();

if (noticia) {
  console.log(`ID: ${noticia.id}`);
  console.log(`Título: ${noticia.titulo}`);
  console.log(`Imagem: ${noticia.imagem}`);
  
  const filename = noticia.imagem.split('/').pop();
  console.log(`\nNome do arquivo: ${filename}`);
  console.log(`\n✓ ESPERADO: fgs-1759604780.png`);
  console.log(`✓ ATUAL: ${filename}`);
  
  if (filename.includes('fgs-1759604780.png')) {
    console.log(`\n🎉 SUCESSO! A imagem foi corrigida!`);
  } else {
    console.log(`\n⚠️ Ainda não foi corrigida.`);
  }
} else {
  console.log('Notícia não encontrada');
}

db.close();
