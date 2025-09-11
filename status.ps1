#!/usr/bin/env pwsh
# Script de inicialização sem permissões
Write-Host "=== R10 Sistema de Gerenciamento ==="
Write-Host "Iniciando serviços..."

# Verificar se os serviços estão rodando
try {
    $backendStatus = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($backendStatus -eq "ok") {
        Write-Host "✅ Backend rodando na porta 3002"
    }
} catch {
    Write-Host "❌ Backend não está rodando"
}

# Verificar frontend
try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port 5175 -InformationLevel Quiet -ErrorAction SilentlyContinue
    if ($frontendTest) {
        Write-Host "✅ Frontend rodando na porta 5175"
    }
} catch {
    Write-Host "❌ Frontend não está rodando"
}

Write-Host "Sistema pronto para uso!"