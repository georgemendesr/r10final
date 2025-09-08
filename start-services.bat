@echo off
echo 🛡️ INICIANDO SERVIÇOS R10 FINAL
echo ================================

echo 🔄 Matando processos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1

echo ⏳ Aguardando 2 segundos...
timeout /t 2 >nul

echo 🚀 Iniciando API Backend (porta 3002)...
cd /d "%~dp0server"
start "API Backend" cmd /c "node server-api-simple.cjs & pause"

echo ⏳ Aguardando API inicializar...
timeout /t 3 >nul

echo 🚀 Iniciando Frontend (porta 5175)...
cd /d "%~dp0r10-front_full_07ago"
start "Frontend" cmd /c "npm run dev & pause"

echo ⏳ Aguardando Frontend inicializar...
timeout /t 5 >nul

echo ✅ SERVIÇOS INICIADOS!
echo 🌐 Site: http://127.0.0.1:5175/
echo 🔧 API: http://127.0.0.1:3002/api/health
echo.
echo 📋 Para verificar status: protect.ps1 check
pause
