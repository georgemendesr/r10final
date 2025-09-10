@echo off
title R10 - Iniciando Sistema
color 0A

echo ======================================
echo    INICIANDO SISTEMA R10 PIAUÍ
echo ======================================
echo.

REM Parar processos anteriores
echo [1/4] Limpando processos anteriores...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq Frontend*" >nul 2>&1
timeout 2 >nul

REM Iniciar Backend
echo [2/4] Iniciando Backend (porta 4000)...
start "Backend-R10" cmd /k "cd /d \"%~dp0server\" && set PORT=4000 && node server-api-simple.cjs"
timeout 3

REM Iniciar Frontend  
echo [3/4] Iniciando Frontend (porta 6000)...
start "Frontend-R10" cmd /k "cd /d \"%~dp0r10-front_full_07ago\" && npm run dev -- --port 6000"
timeout 5

REM Abrir navegador
echo [4/4] Abrindo navegador...
start http://localhost:6000

echo.
echo ======================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ======================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:6000  
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
