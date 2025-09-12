const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔍 MONITOR DE POSIÇÕES DESTAQUE - DETECTANDO ALTERAÇÕES AUTOMÁTICAS 🔍');
console.log('Este monitor irá detectar quando algo alterar as posições das matérias destaque\n');

const dbPath = path.join(__dirname, 'server', 'noticias.db');
const logPath = path.join(__dirname, 'position-changes.log');

let previousState = new Map();
let changeCount = 0;

function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}\n`;
    console.log(`[${timestamp}] ${message}`);
    fs.appendFileSync(logPath, logEntry);
}

function getCurrentState() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        db.all("SELECT id, titulo, posicao FROM noticias WHERE posicao IN ('destaque', 'supermanchete', 'geral') ORDER BY id", (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            const state = new Map();
            rows.forEach(row => {
                state.set(row.id, {
                    titulo: row.titulo.substring(0, 50),
                    posicao: row.posicao
                });
            });
            
            db.close();
            resolve(state);
        });
    });
}

function detectChanges(current, previous) {
    const changes = [];
    
    // Verificar alterações
    for (const [id, currentData] of current) {
        const previousData = previous.get(id);
        
        if (previousData && previousData.posicao !== currentData.posicao) {
            changes.push({
                id: id,
                titulo: currentData.titulo,
                from: previousData.posicao,
                to: currentData.posicao
            });
        }
    }
    
    return changes;
}

async function monitor() {
    try {
        const currentState = await getCurrentState();
        
        if (previousState.size > 0) {
            const changes = detectChanges(currentState, previousState);
            
            if (changes.length > 0) {
                changeCount++;
                log(`🚨 ALTERAÇÃO DETECTADA #${changeCount}:`);
                
                changes.forEach(change => {
                    log(`   📝 ID ${change.id}: "${change.titulo}" MOVIDO DE "${change.from}" PARA "${change.to}"`);
                    
                    // Se uma matéria saiu de destaque
                    if (change.from === 'destaque' && change.to !== 'destaque') {
                        log(`   ⚠️  ATENÇÃO: MATÉRIA REMOVIDA DA SEÇÃO DESTAQUE!`);
                        log(`   🔍 Esta pode ser a causa do problema relatado pelo usuário!`);
                    }
                });
                
                // Contar matérias destaque atuais
                const destaqueCount = Array.from(currentState.values()).filter(item => item.posicao === 'destaque').length;
                log(`   📊 Total de matérias DESTAQUE agora: ${destaqueCount}`);
                
                if (destaqueCount < 5) {
                    log(`   ❌ PROBLEMA CONFIRMADO: Menos de 5 matérias destaque!`);
                }
                
                log(''); // Linha em branco para separar
            }
        } else {
            // Primeira execução - registrar estado inicial
            const destaqueCount = Array.from(currentState.values()).filter(item => item.posicao === 'destaque').length;
            log(`🎬 MONITOR INICIADO - Estado inicial: ${destaqueCount} matérias destaque`);
        }
        
        previousState = new Map(currentState);
        
    } catch (error) {
        log(`❌ Erro no monitor: ${error.message}`);
    }
}

// Executar a cada 10 segundos
log('🚀 Iniciando monitor de posições (verificação a cada 10 segundos)');
log(`📄 Logs salvos em: ${logPath}`);
log('⏹️  Para parar: Ctrl+C\n');

monitor(); // Execução inicial
const intervalId = setInterval(monitor, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
    log('🛑 Monitor interrompido pelo usuário');
    clearInterval(intervalId);
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Monitor finalizado');
    clearInterval(intervalId);
    process.exit(0);
});