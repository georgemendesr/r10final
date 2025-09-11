@echo off
title R10 Piauí - Sistema Iniciando...
cd /d C:\Users\George Mendes\Desktop\r10final

echo Parando processos existentes...
forever stopall >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo Iniciando R10 Piauí em background...
start /min forever start start-all.js --silent

echo Sistema iniciado! Pode fechar esta janela.
timeout /t 3 >nul
exit
