// Testar função normalizePos atualizada
function normalizePos(v) {
  const m = {
    'supermanchete':'supermanchete','super-manchete':'supermanchete','super':'supermanchete',
    'destaque':'destaque','destaques':'destaque','manchete-principal':'destaque',
    'geral':'geral','noticia':'geral','noticias':'geral','noticia-comum':'geral',
    'municipios':'municipios','municipio':'municipios','municípios':'municipios'
  };
  const k = String(v || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  return m[k] || v;
}

console.log('Teste da função normalizePos atualizada:');
console.log("normalizePos('supermanchete'):", normalizePos('supermanchete'));
console.log("normalizePos('SUPER MANCHETE'):", normalizePos('SUPER MANCHETE'));
console.log("normalizePos('super-manchete'):", normalizePos('super-manchete'));
console.log("normalizePos('super'):", normalizePos('super'));

// Testando se os dois se encontram
const front = normalizePos('supermanchete'); // que o frontend procura
const back = normalizePos('supermanchete'); // que vem do banco
console.log('\nComparação:');
console.log('Frontend procura:', front);
console.log('Backend retorna:', back);
console.log('São iguais?', front === back);
