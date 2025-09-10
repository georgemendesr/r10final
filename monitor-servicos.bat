@echo off
title R10 PIAUI - MONITOR AUTOMATICO
color 0E

:INICIO
cls
echo =====================================================
echo           R10 PIAUI - MONITOR AUTOMATICO
echo =====================================================
echo.

echo Verificando servicos a cada 30 segundos...
echo Para parar o monitor: feche esta janela
echo.

:LOOP

REM Verifica Frontend (porta 5175)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5175' -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host '[OK] Frontend rodando' -ForegroundColor Green } catch { Write-Host '[ERRO] Frontend parado - Reiniciando...' -ForegroundColor Red; Start-Process cmd -ArgumentList '/k', 'cd /d %~dp0r10-front_full_07ago && npm run dev' }"

REM Verifica Backend (porta 3002)  
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3002/api/health' -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host '[OK] Backend rodando' -ForegroundColor Green } catch { Write-Host '[ERRO] Backend parado - Reiniciando...' -ForegroundColor Red; Start-Process cmd -ArgumentList '/k', 'cd /d %~dp0 && node server/server-api-simple.cjs' }"

REM Verifica Instagram (porta 8080)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host '[OK] Instagram rodando' -ForegroundColor Green } catch { Write-Host '[ERRO] Instagram parado - Reiniciando...' -ForegroundColor Red; Start-Process cmd -ArgumentList '/k', 'cd /d %~dp0 && node server.js' }"

echo.
echo Proxima verificacao em 30 segundos...
timeout /t 30 >nul

goto LOOP
