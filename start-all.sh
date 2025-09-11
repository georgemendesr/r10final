#!/bin/bash

# Script para iniciar todos os serviços do R10 Piauí
# Este script usa concurrently para gerenciar múltiplos processos

echo "🚀 Iniciando todos os serviços do R10 Piauí..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

if [ ! -d "r10-front_full_07ago/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd r10-front_full_07ago && npm install && cd ..
fi

# Parar processos anteriores
echo "🛑 Parando processos anteriores..."
pkill -f "server-api-simple.cjs" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true

# Aguardar um momento
sleep 2

echo "🔥 Iniciando todos os serviços..."

# Usar concurrently para gerenciar os processos
npx concurrently \
  --names "BACKEND,FRONTEND,INSTAGRAM" \
  --prefix "[{name}]" \
  --prefix-colors "green,cyan,yellow" \
  --kill-others-on-fail \
  --restart-tries 5 \
  "cd server && node server-api-simple.cjs" \
  "cd r10-front_full_07ago && npm run dev" \
  "node server.js"
