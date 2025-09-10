@echo off
echo ===================================================
echo           R10 PIAUI - INICIAR TODOS SERVICOS
echo ===================================================
echo.

echo [1/3] Iniciando Frontend (React/Vite)...
start "R10 Frontend" cmd /k "cd /d %~dp0r10-front_full_07ago && npm run dev"
timeout /t 3

echo [2/3] Iniciando Backend API (SQLite)...
start "R10 Backend" cmd /k "cd /d %~dp0 && node server/server-api-simple.cjs"
timeout /t 3

echo [3/3] Iniciando Instagram Publisher...
start "R10 Instagram" cmd /k "cd /d %~dp0 && node server.js"

echo.
echo ===================================================
echo   SERVICOS INICIADOS COM SUCESSO!
echo.
echo   Frontend:  http://localhost:5175
echo   Backend:   http://localhost:3002
echo   Instagram: http://localhost:8080
echo ===================================================
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:5175

echo.
echo Para parar todos os servicos, feche as janelas abertas
echo ou pressione Ctrl+C em cada terminal.
echo.
pause
