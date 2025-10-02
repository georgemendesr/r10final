// Script para organizar arquivos de debug
const fs = require('fs');
const path = require('path');

const patterns = [
    /^check-.*\.(js|mjs|cjs)$/,
    /^test-.*\.(js|cjs)$/,
    /^debug-.*\.(js|mjs|cjs)$/,
    /^verificar-.*\.(js|cjs)$/,
    /^corrigir-.*\.js$/,
    /^diagnostico-.*\.js$/,
    /^fix-.*\.(js|cjs)$/,
    /^fixar-.*\.cjs$/,
    /^garantir-.*\.js$/,
    /^inserir-.*\.(js|cjs)$/,
    /^investigar-.*\.js$/,
    /^investigacao-.*\.js$/,
    /^monitor-.*\.(js|cjs)$/,
    /^promover-.*\.js$/,
    /^proteger-.*\.js$/,
    /^reorganize-.*\.js$/,
    /^resetar-.*\.cjs$/,
    /^restaurar-.*\.js$/,
    /^testar-.*\.(js|cjs)$/,
    /^teste-.*\.js$/,
    /^add-.*\.js$/,
    /^clean-.*\.js$/
];

const destination = path.join(__dirname, '..', 'scripts', 'debug');
const rootDir = path.join(__dirname, '..');

let moved = 0;
let errors = 0;

console.log('🔄 Organizando arquivos de debug...\n');

// Ler arquivos na raiz
const files = fs.readdirSync(rootDir);

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    
    // Verificar se é arquivo
    if (!fs.statSync(filePath).isFile()) return;
    
    // Verificar se corresponde a algum padrão
    const matches = patterns.some(pattern => pattern.test(file));
    
    if (matches) {
        try {
            const destPath = path.join(destination, file);
            fs.renameSync(filePath, destPath);
            console.log(`  ✅ Movido: ${file}`);
            moved++;
        } catch (error) {
            console.log(`  ❌ Erro ao mover ${file}:`, error.message);
            errors++;
        }
    }
});

console.log('\n📊 Resumo:');
console.log(`  - Arquivos movidos: ${moved}`);
console.log(`  - Erros: ${errors}`);
console.log('\n✨ Organização concluída!');
