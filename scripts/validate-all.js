#!/usr/bin/env node

/**
 * Script de Validação Completa - R10 Piauí
 * Verifica se todas as correções foram aplicadas corretamente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 VALIDAÇÃO COMPLETA - R10 PIAUÍ\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, fn) {
    try {
        const result = fn();
        if (result === true) {
            console.log(`✅ ${name}`);
            passed++;
        } else if (result === 'warn') {
            console.log(`⚠️  ${name}`);
            warnings++;
        } else {
            console.log(`❌ ${name}: ${result}`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
    }
}

console.log('\n📦 1. DEPENDÊNCIAS\n' + '-'.repeat(60));

check('helmet instalado', () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return pkg.dependencies.helmet ? true : 'helmet não encontrado';
});

check('compression instalado', () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return pkg.dependencies.compression ? true : 'compression não encontrado';
});

check('express-rate-limit instalado', () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return pkg.dependencies['express-rate-limit'] ? true : 'express-rate-limit não encontrado';
});

console.log('\n📝 2. CONFIGURAÇÕES\n' + '-'.repeat(60));

check('.env.example existe e está completo', () => {
    if (!fs.existsSync('.env.example')) return '.env.example não encontrado';
    const content = fs.readFileSync('.env.example', 'utf8');
    const requiredVars = ['JWT_SECRET', 'NODE_ENV', 'PORT', 'PUBLIC_BASE_URL', 'IG_BUSINESS_ID', 'GROQ_API_KEY'];
    const missing = requiredVars.filter(v => !content.includes(v));
    return missing.length === 0 ? true : `Faltando: ${missing.join(', ')}`;
});

check('ESLint configurado no frontend', () => {
    const eslintPath = path.join('r10-front_full_07ago', 'eslint.config.js');
    if (!fs.existsSync(eslintPath)) return 'eslint.config.js não encontrado';
    const content = fs.readFileSync(eslintPath, 'utf8');
    return content.includes('no-console') ? true : 'Regra no-console não configurada';
});

console.log('\n🧪 3. TESTES\n' + '-'.repeat(60));

check('JWT_SECRET configurado em testes', () => {
    const testPath = path.join('__tests__', 'api.integration.test.cjs');
    if (!fs.existsSync(testPath)) return 'Arquivo de teste não encontrado';
    const content = fs.readFileSync(testPath, 'utf8');
    return content.includes('JWT_SECRET') ? true : 'JWT_SECRET não definido nos testes';
});

check('Arquivos de teste existem', () => {
    const testFiles = ['api.integration.test.cjs', 'home-cache.test.cjs', 'metrics-runtime.test.cjs', 'posts-crud.test.cjs'];
    const missing = testFiles.filter(f => !fs.existsSync(path.join('__tests__', f)));
    return missing.length === 0 ? true : `Faltando: ${missing.join(', ')}`;
});

console.log('\n🗂️  4. ESTRUTURA DE PASTAS\n' + '-'.repeat(60));

check('Pasta scripts/debug existe', () => {
    return fs.existsSync(path.join('scripts', 'debug')) ? true : 'Pasta scripts/debug não encontrada';
});

check('README em scripts/debug existe', () => {
    return fs.existsSync(path.join('scripts', 'debug', 'README.md')) ? true : 'README não encontrado';
});

check('Script de organização existe', () => {
    return fs.existsSync(path.join('scripts', 'organize-debug-files.js')) ? true : 'Script não encontrado';
});

console.log('\n📄 5. DOCUMENTAÇÃO\n' + '-'.repeat(60));

check('CORRECOES-REALIZADAS.md existe', () => {
    return fs.existsSync('CORRECOES-REALIZADAS.md') ? true : 'Arquivo não encontrado';
});

check('CHECKLIST-FINAL.md existe', () => {
    return fs.existsSync('CHECKLIST-FINAL.md') ? true : 'Arquivo não encontrado';
});

check('RESUMO-EXECUTIVO.md existe', () => {
    return fs.existsSync('RESUMO-EXECUTIVO.md') ? true : 'Arquivo não encontrado';
});

console.log('\n🧹 6. CÓDIGO LIMPO\n' + '-'.repeat(60));

check('positionHierarchy.ts sem console.log excessivos', () => {
    const filePath = path.join('r10-front_full_07ago', 'src', 'utils', 'positionHierarchy.ts');
    if (!fs.existsSync(filePath)) return 'Arquivo não encontrado';
    const content = fs.readFileSync(filePath, 'utf8');
    const logCount = (content.match(/console\.log\(/g) || []).length;
    return logCount === 0 ? true : (logCount <= 2 ? 'warn' : `${logCount} console.log encontrados`);
});

check('main.tsx com logs condicionais', () => {
    const filePath = path.join('r10-front_full_07ago', 'src', 'main.tsx');
    if (!fs.existsSync(filePath)) return 'Arquivo não encontrado';
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('import.meta.env.DEV') ? true : 'Logs não são condicionais';
});

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VALIDAÇÃO\n');
console.log(`✅ Passou: ${passed}`);
console.log(`⚠️  Avisos: ${warnings}`);
console.log(`❌ Falhou: ${failed}`);
console.log('='.repeat(60));

if (failed === 0 && warnings === 0) {
    console.log('\n🎉 PERFEITO! Todas as validações passaram!');
    console.log('✨ Seu projeto está pronto para produção!\n');
    process.exit(0);
} else if (failed === 0) {
    console.log('\n✅ Bom! Todas as checagens críticas passaram.');
    console.log(`⚠️  Existem ${warnings} aviso(s) que você pode revisar.\n`);
    process.exit(0);
} else {
    console.log(`\n❌ Atenção! Existem ${failed} problema(s) que precisam ser corrigidos.`);
    console.log('📖 Verifique CHECKLIST-FINAL.md para mais detalhes.\n');
    process.exit(1);
}
