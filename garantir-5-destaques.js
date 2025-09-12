const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/noticias.db');

console.log('🔒 SISTEMA DE GARANTIA: SEMPRE 5 MATÉRIAS DESTAQUE 🔒');

function garantirCincoDestaques() {
    // Verificar quantas matérias destaque existem
    db.get("SELECT COUNT(*) as total FROM noticias WHERE posicao = 'destaque'", (err, result) => {
        if (err) {
            console.error('❌ Erro:', err);
            db.close();
            return;
        }
        
        const totalDestaques = result.total;
        console.log(`📊 Matérias destaque atuais: ${totalDestaques}`);
        
        if (totalDestaques === 5) {
            console.log('✅ PERFEITO! Já existem exatamente 5 matérias destaque');
            db.close();
            return;
        }
        
        if (totalDestaques < 5) {
            const faltam = 5 - totalDestaques;
            console.log(`⚠️  FALTAM ${faltam} matérias para completar 5 destaques`);
            
            // Buscar matérias gerais para promover
            db.all("SELECT id, titulo FROM noticias WHERE posicao = 'geral' ORDER BY id DESC LIMIT ?", [faltam], (err, gerais) => {
                if (err) {
                    console.error('❌ Erro ao buscar gerais:', err);
                    db.close();
                    return;
                }
                
                if (gerais.length === 0) {
                    console.log('❌ Nenhuma matéria geral disponível para promover!');
                    db.close();
                    return;
                }
                
                console.log(`🚀 Promovendo ${gerais.length} matérias para destaque:`);
                
                let processadas = 0;
                gerais.forEach((materia, index) => {
                    console.log(`${index + 1}. Promovendo ID ${materia.id}: ${materia.titulo}`);
                    
                    db.run("UPDATE noticias SET posicao = 'destaque' WHERE id = ?", [materia.id], function(err) {
                        if (err) {
                            console.error(`❌ Erro ao promover ID ${materia.id}:`, err);
                        } else {
                            console.log(`✅ ID ${materia.id} promovido com sucesso`);
                        }
                        
                        processadas++;
                        if (processadas === gerais.length) {
                            // Verificação final
                            db.get("SELECT COUNT(*) as total FROM noticias WHERE posicao = 'destaque'", (err, finalResult) => {
                                if (!err) {
                                    console.log(`\n🎉 RESULTADO FINAL: ${finalResult.total} matérias destaque`);
                                }
                                db.close();
                            });
                        }
                    });
                });
            });
        } else {
            console.log(`⚠️  EXISTEM ${totalDestaques} matérias destaque (mais que 5)`);
            console.log('💡 Considere rebaixar algumas para "geral"');
            db.close();
        }
    });
}

garantirCincoDestaques();