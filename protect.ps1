# 🛡️ SISTEMA DE PROTEÇÃO R10 FINAL
param([string]$Command, [string]$Description)

Write-Host "🛡️ SISTEMA DE PROTEÇÃO R10 FINAL" -ForegroundColor Cyan

if ($Command -eq "check") {
    Write-Host "🔍 Verificando serviços..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:3002/api/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Write-Host "✅ API Backend (porta 3002) - OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ API Backend - FALHOU" -ForegroundColor Red
    }
    
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:5175/" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Write-Host "✅ Frontend (porta 5175) - OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Frontend - FALHOU" -ForegroundColor Red
    }
}
elseif ($Command -eq "backup") {
    Write-Host "💾 Criando backup de emergência..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "..\backup_$timestamp"
    
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item -Path ".\*" -Destination $backupDir -Recurse -Force
    
    Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green
}
elseif ($Command -eq "restore") {
    Write-Host "🔄 Restaurando para versão baseline..." -ForegroundColor Yellow
    
    git stash push -m "Backup antes de restaurar baseline"
    git checkout v1.0-baseline
    git reset --hard v1.0-baseline
    
    Write-Host "✅ Restaurado para versão funcionando" -ForegroundColor Green
}
elseif ($Command -eq "checkpoint") {
    if ([string]::IsNullOrEmpty($Description)) {
        Write-Host "❌ Uso: .\protect.ps1 checkpoint <descrição>" -ForegroundColor Red
    }
    else {
        Write-Host "📍 Criando checkpoint..." -ForegroundColor Yellow
        git add .
        git commit -m "🔒 CHECKPOINT: $Description"
        Write-Host "✅ Checkpoint criado: $Description" -ForegroundColor Green
    }
}
else {
    Write-Host "📋 Comandos disponíveis:" -ForegroundColor Cyan
    Write-Host "  .\protect.ps1 check                    - Verificar status" -ForegroundColor White
    Write-Host "  .\protect.ps1 backup                   - Backup de emergência" -ForegroundColor White
    Write-Host "  .\protect.ps1 restore                  - Restaurar baseline" -ForegroundColor White
    Write-Host "  .\protect.ps1 checkpoint <descrição>   - Criar checkpoint" -ForegroundColor White
}
