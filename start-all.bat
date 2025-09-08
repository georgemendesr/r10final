@echo off
echo ========================================
echo         R10 PROJECT STARTER
echo ========================================
echo.

REM Matar todos os processos Node.js existentes
echo [1/4] Parando processos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1

REM Aguardar um momento
timeout /t 2 >nul

echo [2/4] Iniciando API SQLite na porta 3002...
start "R10 API" cmd /k "node server/server-api-simple.cjs"

REM Aguardar a API iniciar
timeout /t 3 >nul

echo [3/4] Iniciando Frontend React na porta 5175...
start "R10 Frontend" cmd /k "cd r10-front_full_07ago && npm run dev"

REM Aguardar o frontend iniciar
timeout /t 3 >nul

echo [4/4] Abrindo navegador...
start http://127.0.0.1:5175

echo.
echo ========================================
echo    SERVICOS INICIADOS COM SUCESSO!
echo ========================================
echo.
echo Frontend: http://127.0.0.1:5175
echo API:      http://127.0.0.1:3002
echo Dashboard: http://127.0.0.1:5175/admin
echo.
echo Pressione qualquer tecla para sair...
pause >nul
start "R10-API" cmd /k "node server/server-api-simple.cjs"
timeout /t 3

echo.
echo [2/3] Iniciando Frontend React na porta 5175...
start "R10-Frontend" cmd /k "cd r10-front_full_07ago && npm run dev"
timeout /t 3

echo.
echo [3/3] Iniciando Instagram Publisher na porta 8080...
start "R10-Instagram" cmd /k "npm run dev"
timeout /t 3

echo.
echo ===============================================
echo  TODOS OS SERVICOS INICIADOS!
echo ===============================================
echo.
echo LINKS ATIVOS:
echo  Site Principal: http://127.0.0.1:5175/
echo  Dashboard:      http://127.0.0.1:5175/admin
echo  API Health:     http://127.0.0.1:3002/api/health
echo  Instagram:      http://localhost:8080/
echo.
echo PRESSIONE QUALQUER TECLA PARA ABRIR O SITE...
pause

start http://127.0.0.1:5175/
