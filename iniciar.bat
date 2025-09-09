@echo off
cd /d "%~dp0"

echo ===============================================
echo   INICIANDO SERVIÇOS R10 - VERSÃO DEFINITIVA
echo ===============================================

echo.
echo 🧹 Limpando processos Node.js anteriores...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 🚀 Iniciando API na porta 3002...
start "API-R10" cmd /c "cd server && node server-api-simple.cjs"

echo.
echo ⏳ Aguardando 3 segundos para API inicializar...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Iniciando Frontend na porta 5175...
start "FRONTEND-R10" cmd /c "cd r10-front_full_07ago && npm run dev"

echo.
echo ⏳ Aguardando 5 segundos para Frontend inicializar...
timeout /t 5 /nobreak >nul

echo.
echo ✅ SERVIÇOS INICIADOS COM SUCESSO!
echo.
echo 📍 API:       http://127.0.0.1:3002
echo 📍 Frontend:  http://127.0.0.1:5175
echo.
echo 🌐 Abrindo o site...
start http://127.0.0.1:5175

echo.
echo ===============================================
echo   TODOS OS SERVIÇOS ESTÃO RODANDO!
echo ===============================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul
