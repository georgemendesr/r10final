# 🛡️ SISTEMA DE PROTEÇÃO E BACKUP - R10 FINAL
# =============================================
param(
    [string]$Command,
    [string]$Description
)

Write-Host "🛡️ SISTEMA DE PROTEÇÃO R10 FINAL" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Função: Verificar status dos serviços
function Check-Services {
    Write-Host "🔍 Verificando serviços..." -ForegroundColor Yellow
    
    try {
        # Verificar API
        $apiResponse = Invoke-WebRequest -Uri "http://127.0.0.1:3002/api/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ API Backend (porta 3002) - OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ API Backend - FALHOU" -ForegroundColor Red
    }
    
    try {
        # Verificar Frontend
        $frontResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5175/" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Frontend (porta 5175) - OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Frontend - FALHOU" -ForegroundColor Red
    }
}

# Função: Backup de emergência
function Emergency-Backup {
    Write-Host "💾 Criando backup de emergência..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "..\backup_$timestamp"
    
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    Copy-Item -Path ".\*" -Destination $backupDir -Recurse -Force
    
    Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green
}

# Função: Restaurar para baseline
function Restore-Baseline {
    Write-Host "🔄 Restaurando para versão baseline..." -ForegroundColor Yellow
    
    git stash push -m "Backup antes de restaurar baseline"
    git checkout v1.0-baseline
    git reset --hard v1.0-baseline
    
    Write-Host "✅ Restaurado para versão funcionando" -ForegroundColor Green
    Write-Host "🚀 Reinicie os serviços:" -ForegroundColor Cyan
    Write-Host "   1. cd server && node server-api-simple.cjs" -ForegroundColor White
    Write-Host "   2. cd r10-front_full_07ago && npm run dev" -ForegroundColor White
}

# Função: Criar checkpoint antes de mudança
function Create-Checkpoint {
    param([string]$desc)
    
    Write-Host "📍 Criando checkpoint..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($desc)) {
        Write-Host "❌ Uso: .\protect.ps1 checkpoint <descrição>" -ForegroundColor Red
        return
    }
    
    git add .
    git commit -m "🔒 CHECKPOINT: $desc"
    
    Write-Host "✅ Checkpoint criado: $desc" -ForegroundColor Green
}

# Menu principal
switch ($Command) {
    "check" {
        Check-Services
    }
    "backup" {
        Emergency-Backup
    }
    "restore" {
        Restore-Baseline
    }
    "checkpoint" {
        Create-Checkpoint $Description
    }
    default {
        Write-Host "📋 Comandos disponíveis:" -ForegroundColor Cyan
        Write-Host "  .\protect.ps1 check                    - Verificar status dos serviços" -ForegroundColor White
        Write-Host "  .\protect.ps1 backup                   - Backup de emergência" -ForegroundColor White
        Write-Host "  .\protect.ps1 restore                  - Restaurar para baseline" -ForegroundColor White
        Write-Host "  .\protect.ps1 checkpoint <descrição>   - Criar checkpoint" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Exemplos:" -ForegroundColor Yellow
        Write-Host "  .\protect.ps1 checkpoint 'antes de adicionar nova feature'" -ForegroundColor Gray
        Write-Host "  .\protect.ps1 check" -ForegroundColor Gray
    }
}
