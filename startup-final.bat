@echo off
cd /d "C:\Users\George Mendes\Desktop\r10final"

REM Parar processos existentes silenciosamente
taskkill /f /im node.exe >nul 2>&1

REM Executar completamente oculto usando PowerShell
PowerShell -WindowStyle Hidden -Command "& { Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'start-background.js' -WorkingDirectory 'C:\Users\George Mendes\Desktop\r10final' }"

REM Sair imediatamente
exit
