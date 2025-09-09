#!/bin/bash
# Script definitivo para iniciar o R10

echo "🧹 Limpando processos anteriores..."
taskkill /f /im node.exe 2>/dev/null

echo "🚀 Iniciando API..."
cd server
start "API" cmd /k "node server-api-simple.cjs"
cd ..

echo "⏳ Aguardando 3 segundos..."
timeout 3

echo "🌐 Iniciando Frontend..."
cd r10-front_full_07ago
start "FRONTEND" cmd /k "npm run dev"
cd ..

echo "⏳ Aguardando 5 segundos..."
timeout 5

echo "✅ PRONTO! Abrindo site..."
start http://127.0.0.1:5175

echo "🎯 SITE FUNCIONANDO EM: http://127.0.0.1:5175"
