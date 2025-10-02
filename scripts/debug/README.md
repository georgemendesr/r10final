# Scripts de Debug

Esta pasta contém scripts de teste e debug que foram usados durante o desenvolvimento do projeto R10 Piauí.

## ⚠️ Importante

Estes scripts **NÃO devem ser usados em produção**. Eles são apenas para:
- Debug local
- Testes de funcionalidades
- Investigação de bugs
- Verificação de dados

## 📁 Tipos de Scripts

### `check-*.js`
Scripts para verificar estado de dados, estruturas de banco, etc.

### `test-*.js` / `teste-*.js`
Scripts de teste manual de funcionalidades específicas

### `debug-*.js`
Scripts para debug de problemas específicos

### `verificar-*.js`
Scripts de verificação de integridade

### `corrigir-*.js` / `fix-*.js`
Scripts de correção pontual (use com cuidado!)

### `monitor-*.js`
Scripts de monitoramento de comportamento

## 🚀 Como Usar

```bash
# Executar qualquer script
node scripts/debug/nome-do-script.js

# Ou com Node diretamente
node scripts/debug/check-destaques.js
```

## 🗑️ Limpeza

Estes scripts podem ser removidos para produção. Eles são mantidos para referência e debug futuro.
