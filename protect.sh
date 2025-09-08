#!/bin/bash
# 🛡️ SISTEMA DE PROTEÇÃO E BACKUP - R10 FINAL
# =============================================

echo "🛡️ SISTEMA DE PROTEÇÃO R10 FINAL"
echo "================================="

# Função: Verificar status dos serviços
function check_services() {
    echo "🔍 Verificando serviços..."
    
    # Verificar se API está respondendo
    curl -s http://127.0.0.1:3002/api/health > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ API Backend (porta 3002) - OK"
    else
        echo "❌ API Backend - FALHOU"
    fi
    
    # Verificar se Frontend está respondendo
    curl -s http://127.0.0.1:5175/ > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Frontend (porta 5175) - OK"
    else
        echo "❌ Frontend - FALHOU"
    fi
}

# Função: Backup de emergência
function emergency_backup() {
    echo "💾 Criando backup de emergência..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="backup_$timestamp"
    
    mkdir -p "../$backup_dir"
    cp -r . "../$backup_dir/"
    
    echo "✅ Backup criado em: ../$backup_dir"
}

# Função: Restaurar para baseline
function restore_baseline() {
    echo "🔄 Restaurando para versão baseline..."
    
    git stash push -m "Backup antes de restaurar baseline"
    git checkout v1.0-baseline
    git reset --hard v1.0-baseline
    
    echo "✅ Restaurado para versão funcionando"
    echo "🚀 Reinicie os serviços com: npm run start:all"
}

# Função: Criar checkpoint antes de mudança
function create_checkpoint() {
    echo "📍 Criando checkpoint..."
    
    if [ -z "$1" ]; then
        echo "❌ Uso: checkpoint <descrição>"
        return 1
    fi
    
    git add .
    git commit -m "🔒 CHECKPOINT: $1"
    
    echo "✅ Checkpoint criado: $1"
}

# Menu principal
case "$1" in
    "check")
        check_services
        ;;
    "backup")
        emergency_backup
        ;;
    "restore")
        restore_baseline
        ;;
    "checkpoint")
        create_checkpoint "$2"
        ;;
    *)
        echo "📋 Comandos disponíveis:"
        echo "  ./protect.sh check      - Verificar status dos serviços"
        echo "  ./protect.sh backup     - Backup de emergência"
        echo "  ./protect.sh restore    - Restaurar para baseline"
        echo "  ./protect.sh checkpoint <desc> - Criar checkpoint"
        ;;
esac
