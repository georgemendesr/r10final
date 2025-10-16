#!/bin/bash
# Script de build para Render - garante que arquivo.db existe

echo "🔧 [BUILD] Verificando arquivo.db..."

if [ ! -f "arquivo/arquivo.db" ]; then
  echo "❌ [BUILD] arquivo/arquivo.db não encontrado!"
  echo "⚠️ [BUILD] O banco de dados será criado vazio no primeiro acesso."
  echo "💡 [BUILD] Para corrigir: adicione arquivo.db ao repositório com git add -f"
  exit 1
fi

# Verificar tamanho do banco
DB_SIZE=$(du -h arquivo/arquivo.db | cut -f1)
echo "✅ [BUILD] arquivo.db encontrado (${DB_SIZE})"

# Contar registros
if command -v sqlite3 &> /dev/null; then
  RECORDS=$(sqlite3 arquivo/arquivo.db "SELECT COUNT(*) FROM noticias" 2>/dev/null || echo "?")
  echo "📊 [BUILD] Registros no banco: ${RECORDS}"
fi

echo "🎉 [BUILD] Build concluído com sucesso!"
