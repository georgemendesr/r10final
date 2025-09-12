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
db.all('SELECT id, titulo, posicao, published_at FROM noticias ORDER BY id DESC', [], (err, rows) => {
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
    if (byPosition.destaque && byPosition.destaque.length > 0) {
        byPosition.destaque.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id} | Posição: "${row.posicao}" | Título: ${row.titulo.substring(0, 40)}...`);
        });
    } else {
        console.log('   ❌ NENHUMA MATÉRIA DE DESTAQUE ENCONTRADA!');
    }

    console.log('\n📰 SUPER MANCHETES:');
    if (byPosition.supermanchete && byPosition.supermanchete.length > 0) {
        byPosition.supermanchete.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id} | Posição: "${row.posicao}" | Título: ${row.titulo.substring(0, 40)}...`);
        });
    } else {
        console.log('   ❌ NENHUMA SUPER MANCHETE ENCONTRADA!');
    }

    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    
    const totalDestaques = byPosition.destaque ? byPosition.destaque.length : 0;
    const totalSuperManchetes = byPosition.supermanchete ? byPosition.supermanchete.length : 0;
    
    if (totalDestaques < 5) {
        console.log(`   ❌ PROBLEMA CONFIRMADO: Apenas ${totalDestaques} destaques (deveria ter 5)`);
        console.log(`   💡 SOLUÇÃO: Vou promover ${5 - totalDestaques} matérias "geral" para "destaque"`);
        
        const gerais = byPosition.geral || [];
        const toPromote = gerais.slice(0, 5 - totalDestaques);
        
        if (toPromote.length > 0) {
            console.log('\n🔄 PROMOVENDO MATÉRIAS PARA DESTAQUE:');
            let completed = 0;
            
            toPromote.forEach(materia => {
                console.log(`   Promovendo ID ${materia.id}: ${materia.titulo.substring(0, 40)}...`);
                
                db.run('UPDATE noticias SET posicao = ? WHERE id = ?', ['destaque', materia.id], function(err) {
                    if (err) {
                        console.error(`   ❌ Erro ao promover ID ${materia.id}:`, err);
                    } else {
                        console.log(`   ✅ ID ${materia.id} promovido com sucesso`);
                    }
                    
                    completed++;
                    if (completed === toPromote.length) {
                        console.log('\n✅ CORREÇÃO CONCLUÍDA! Verifique o frontend agora.');
                        db.close();
                    }
                });
            });
        } else {
            console.log('   ❌ Não há matérias "geral" suficientes para promover!');
            db.close();
        }
    } else if (totalDestaques === 5) {
        console.log(`   ✅ Número correto de destaques encontrado: ${totalDestaques}`);
        console.log('   O problema pode estar na lógica do frontend ou cache.');
        db.close();
    } else {
        console.log(`   ⚠️  Mais destaques que o esperado: ${totalDestaques} (máximo deveria ser 5)`);
        db.close();
    }
});