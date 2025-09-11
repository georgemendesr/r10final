# Script PowerShell para iniciar o sistema R10 Piauí
param(
    [switch]$Kill,
    [switch]$Status,
    [string]$Service = "all"
)

$BackendPath = "C:\Users\George Mendes\Desktop\r10final\server"
$FrontendPath = "C:\Users\George Mendes\Desktop\r10final\r10-front_full_07ago"
$InstagramPath = "C:\Users\George Mendes\Desktop\r10final"

function Write-ColorText {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Stop-AllServices {
    Write-ColorText "🛑 Parando todos os serviços Node.js..." "Red"
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
    Write-ColorText "✅ Serviços parados!" "Green"
}

function Start-Backend {
    Write-ColorText "🔧 Iniciando Backend (porta 3002)..." "Green"
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$BackendPath'; node server-api-simple.cjs" -WindowStyle Normal
}

function Start-Frontend {
    Write-ColorText "🎨 Iniciando Frontend (porta 5175)..." "Cyan"
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$FrontendPath'; npm run dev" -WindowStyle Normal
}

function Start-Instagram {
    Write-ColorText "📱 Iniciando Instagram Publisher (porta 8080)..." "Yellow"
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$InstagramPath'; node server.js" -WindowStyle Normal
}

function Show-Status {
    Write-ColorText "📊 Status dos Serviços:" "Blue"
    
    $backend = Test-NetConnection -ComputerName localhost -Port 3002 -InformationLevel Quiet
    $frontend = Test-NetConnection -ComputerName localhost -Port 5175 -InformationLevel Quiet
    $instagram = Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet
    
    Write-Host "Backend (3002): " -NoNewline
    if ($backend) { Write-ColorText "✅ Rodando" "Green" } else { Write-ColorText "❌ Parado" "Red" }
    
    Write-Host "Frontend (5175): " -NoNewline
    if ($frontend) { Write-ColorText "✅ Rodando" "Green" } else { Write-ColorText "❌ Parado" "Red" }
    
    Write-Host "Instagram (8080): " -NoNewline
    if ($instagram) { Write-ColorText "✅ Rodando" "Green" } else { Write-ColorText "❌ Parado" "Red" }
    
    if ($backend -and $frontend) {
        Write-ColorText "`n🌐 Sistema Online!" "Green"
        Write-ColorText "Frontend: http://localhost:5175" "Cyan"
        Write-ColorText "Backend: http://localhost:3002/api/health" "Green"
        if ($instagram) {
            Write-ColorText "Instagram: http://localhost:8080" "Yellow"
        }
    }
}

# Execução principal
if ($Kill) {
    Stop-AllServices
    return
}

if ($Status) {
    Show-Status
    return
}

Write-ColorText "🚀 Iniciando Sistema R10 Piauí" "Blue"
Write-ColorText "=============================" "Blue"

Stop-AllServices

switch ($Service.ToLower()) {
    "backend" { Start-Backend }
    "frontend" { Start-Frontend }
    "instagram" { Start-Instagram }
    default {
        Start-Backend
        Start-Sleep 3
        Start-Frontend
        Start-Sleep 3
        Start-Instagram
    }
}

Write-ColorText "`n⏳ Aguardando serviços iniciarem..." "Yellow"
Start-Sleep 8

Show-Status

Write-ColorText "`n💡 Comandos úteis:" "Blue"
Write-ColorText "• .\start-system.ps1 -Status    # Ver status" "Gray"
Write-ColorText "• .\start-system.ps1 -Kill      # Parar tudo" "Gray"
Write-ColorText "• .\start-system.ps1 -Service backend  # Só backend" "Gray"
