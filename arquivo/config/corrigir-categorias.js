const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'arquivo.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Corrigindo categorias...\n');

// Remover aspas e caracteres especiais das categorias
const correcoes = [
  { de: '"BOMBA BAIXA"', para: 'BOMBA BAIXA' },
  { de: '"Base do crime"', para: 'Base do crime' },
  { de: '"Cobrança"', para: 'Cobrança' },
  { de: '"Desequilibrado"', para: 'Desequilibrado' },
  { de: '"Diferencial"', para: 'Diferencial' },
  { de: '"Estou empregado"', para: 'Estou empregado' },
  { de: '"Eu vim de Piripiri"', para: 'Eu vim de Piripiri' },
  { de: '"Faltou oportunidade"', para: 'Faltou oportunidade' },
  { de: '"Forças Políticas"', para: 'Forças Políticas' },
  { de: '"Jairinho do Piauí"', para: 'Jairinho do Piauí' },
  { de: '"Janeiro Seguro"', para: 'Janeiro Seguro' },
  { de: '"Lei Seca" em todo Piauí', para: 'Lei Seca em todo Piauí' },
  { de: '"Lockdown parcial"', para: 'Lockdown parcial' },
  { de: '"Lockdown" no Piauí', para: 'Lockdown no Piauí' },
  { de: '"Lua de Sangue"', para: 'Lua de Sangue' },
  { de: '"Natal sem máscara"', para: 'Natal sem máscara' },
  { de: '"Tenho influência"', para: 'Tenho influência' },
  { de: '"União da nação"', para: 'União da nação' }
];

let totalCorrigido = 0;

correcoes.forEach(({ de, para }) => {
  db.run(
    'UPDATE noticias SET categoria = ? WHERE categoria = ?',
    [para, de],
    function(err) {
      if (err) {
        console.error(`❌ Erro ao corrigir "${de}":`, err.message);
      } else if (this.changes > 0) {
        console.log(`✅ "${de}" → "${para}" (${this.changes} notícias)`);
        totalCorrigido += this.changes;
      }
    }
  );
});

// Aguardar conclusão
setTimeout(() => {
  console.log(`\n✅ Total de notícias corrigidas: ${totalCorrigido}`);
  db.close();
}, 2000);
