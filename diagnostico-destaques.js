const sqlite3 = require('sqlite3').verbose();

// Função de normalização (copiada do server)
function normalizePos(value = '') {
  const clean = String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, ' ');
  
  // Mapa de sinônimos
  const synonymMap = {
    'super manchete': 'supermanchete',
    'super-manchete': 'supermanchete', 
    'supermanchete': 'supermanchete',
    'manchete': 'supermanchete',
    'principal': 'supermanchete',
    'destaque': 'destaque',
    'destaques': 'destaque',
    'featured': 'destaque',
    'geral': 'geral',
    'normal': 'geral',
    'comum': 'geral',
    '': 'geral'
  };
  
  return synonymMap[clean] || 'geral';
}

const db = new sqlite3.Database('./server/noticias.db');

console.log('🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA DOS DESTAQUES\n');

// 1. Verificar todas as matérias e suas posições
db.all('SELECT id, title, posicao, publishedAt FROM noticias ORDER BY id DESC', [], (err, rows) => {
    if (err) {
        console.error('Erro:', err);
        db.close();
        return;
    }

    console.log(`📊 TOTAL DE MATÉRIAS NO BANCO: ${rows.length}\n`);

    // Organizar por posição normalizada
    const byPosition = {};
    rows.forEach(row => {
        const normPos = normalizePos(row.posicao);
        if (!byPosition[normPos]) byPosition[normPos] = [];
        byPosition[normPos].push(row);
    });

    console.log('📋 DISTRIBUIÇÃO POR POSIÇÃO:');
    Object.keys(byPosition).forEach(pos => {
        console.log(`   ${pos.toUpperCase()}: ${byPosition[pos].length} matérias`);
    });

    console.log('\n📰 MATÉRIAS DE DESTAQUE DETALHADAS:');
    if (byPosition.destaque) {
        byPosition.destaque.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id.substring(0, 8)} | Posição: "${row.posicao}" | Título: ${row.title.substring(0, 40)}...`);
        });
    } else {
        console.log('   ❌ NENHUMA MATÉRIA DE DESTAQUE ENCONTRADA!');
    }

    console.log('\n📰 SUPER MANCHETES:');
    if (byPosition.supermanchete) {
        byPosition.supermanchete.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id.substring(0, 8)} | Posição: "${row.posicao}" | Título: ${row.title.substring(0, 40)}...`);
        });
    } else {
        console.log('   ❌ NENHUMA SUPER MANCHETE ENCONTRADA!');
    }

    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    
    const totalDestaques = byPosition.destaque ? byPosition.destaque.length : 0;
    const totalSuperManchetes = byPosition.supermanchete ? byPosition.supermanchete.length : 0;
    
    if (totalDestaques < 5) {
        console.log(`   ❌ PROBLEMA CONFIRMADO: Apenas ${totalDestaques} destaques (deveria ter 5)`);
        console.log(`   💡 POSSÍVEIS CAUSAS:`);
        console.log(`      - Matérias foram rebaixadas incorretamente pela função de reorganização`);
        console.log(`      - Houve erro na atualização das posições`);
        console.log(`      - Editor causou reorganização desnecessária`);
    } else if (totalDestaques === 5) {
        console.log(`   ✅ Número correto de destaques encontrado: ${totalDestaques}`);
    } else {
        console.log(`   ⚠️  Mais destaques que o esperado: ${totalDestaques} (máximo deveria ser 5)`);
    }

    if (totalSuperManchetes > 1) {
        console.log(`   ⚠️  Múltiplas super manchetes: ${totalSuperManchetes} (deveria ser 1)`);
    }

    console.log('\n📝 PRÓXIMOS PASSOS:');
    if (totalDestaques < 5) {
        console.log('   1. Promover matérias "geral" para "destaque" até completar 5');
        console.log('   2. Verificar logs da função reorganizePositionHierarchy');
        console.log('   3. Testar edição de matéria para confirmar se problema foi resolvido');
    }

    db.close();
});