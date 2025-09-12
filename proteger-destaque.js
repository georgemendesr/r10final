const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🛡️  PROTEÇÃO ATIVA DA SEÇÃO DESTAQUE - SEMPRE 5 MATÉRIAS 🛡️');
console.log('Este sistema vai impedir que matérias sejam removidas automaticamente da seção destaque\n');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const logPath = path.join(__dirname, 'destaque-protection.log');

let protectionCount = 0;

function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}\n`;
    console.log(`[${timestamp}] ${message}`);
    fs.appendFileSync(logPath, logEntry);
}

async function enforceDestaqueRule() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        // Contar matérias destaque
        db.get("SELECT COUNT(*) as total FROM noticias WHERE posicao = 'destaque'", (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            
            const destaqueCount = result.total;
            log(`📊 Verificação: ${destaqueCount} matérias destaque encontradas`);
            
            if (destaqueCount < 5) {
                protectionCount++;
                log(`🚨 PROTEÇÃO ATIVADA #${protectionCount}: Apenas ${destaqueCount} matérias destaque!`);
                log(`🔧 Promovendo matérias gerais para completar 5 destaques...`);
                
                const needed = 5 - destaqueCount;
                
                // Buscar matérias gerais para promover
                db.all("SELECT id, titulo FROM noticias WHERE posicao = 'geral' ORDER BY id DESC LIMIT ?", [needed], (err, gerais) => {
                    if (err) {
                        log(`❌ Erro ao buscar matérias gerais: ${err.message}`);
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    if (gerais.length === 0) {
                        log(`⚠️  Nenhuma matéria geral disponível para promover!`);
                        db.close();
                        resolve();
                        return;
                    }
                    
                    let promoted = 0;
                    gerais.forEach((materia) => {
                        db.run("UPDATE noticias SET posicao = 'destaque' WHERE id = ?", [materia.id], function(err) {
                            if (err) {
                                log(`❌ Erro ao promover ID ${materia.id}: ${err.message}`);
                            } else {
                                log(`✅ PROTEGIDO: ID ${materia.id} "${materia.titulo.substring(0, 40)}..." promovido para DESTAQUE`);
                            }
                            
                            promoted++;
                            if (promoted === gerais.length) {
                                // Verificar resultado final
                                db.get("SELECT COUNT(*) as final FROM noticias WHERE posicao = 'destaque'", (err, finalResult) => {
                                    if (!err) {
                                        log(`🎯 PROTEÇÃO CONCLUÍDA: ${finalResult.final} matérias destaque`);
                                    }
                                    db.close();
                                    resolve();
                                });
                            }
                        });
                    });
                });
            } else if (destaqueCount === 5) {
                log(`✅ Status OK: Exatamente 5 matérias destaque`);
                db.close();
                resolve();
            } else {
                log(`⚠️  Muitas matérias destaque: ${destaqueCount} (mais que 5)`);
                db.close();
                resolve();
            }
        });
    });
}

async function protectionLoop() {
    try {
        await enforceDestaqueRule();
    } catch (error) {
        log(`❌ Erro na proteção: ${error.message}`);
    }
}

// Executar verificação a cada 30 segundos
log('🚀 Iniciando proteção ativa da seção DESTAQUE (verificação a cada 30 segundos)');
log(`📄 Logs salvos em: ${logPath}`);
log('🛡️  REGRA: Sempre manter exatamente 5 matérias na seção destaque');
log('⏹️  Para parar: Ctrl+C\n');

protectionLoop(); // Execução inicial
const intervalId = setInterval(protectionLoop, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
    log('🛑 Proteção interrompida pelo usuário');
    clearInterval(intervalId);
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Proteção finalizada');
    clearInterval(intervalId);
    process.exit(0);
});