#!/bin/bash

echo "🔧 [BUILD] Iniciando preparação do módulo arquivo..."

# Verificar se o banco existe
if [ -f "arquivo/arquivo.db" ]; then
  echo "✅ [BUILD] Banco arquivo/arquivo.db encontrado"
  
  # Mostrar tamanho do banco
  SIZE=$(du -h arquivo/arquivo.db | cut -f1)
  echo "📊 [BUILD] Tamanho do banco: $SIZE"
  
  # Verificar se tem a coluna imagem_cloudinary
  HAS_COLUMN=$(sqlite3 arquivo/arquivo.db "PRAGMA table_info(noticias);" | grep imagem_cloudinary | wc -l)
  
  if [ "$HAS_COLUMN" -eq "0" ]; then
    echo "❌ [BUILD] ERRO: Coluna imagem_cloudinary não existe!"
    exit 1
  else
    echo "✅ [BUILD] Coluna imagem_cloudinary existe"
  fi
  
  # Contar quantas têm URLs
  COUNT=$(sqlite3 arquivo/arquivo.db "SELECT COUNT(*) FROM noticias WHERE imagem_cloudinary IS NOT NULL;")
  echo "📊 [BUILD] Registros com Cloudinary URLs: $COUNT"
  
  if [ "$COUNT" -lt "1000" ]; then
    echo "⚠️  [BUILD] AVISO: Poucos registros com URLs do Cloudinary!"
  fi
  
else
  echo "❌ [BUILD] ERRO: arquivo/arquivo.db não encontrado!"
  exit 1
fi

echo "✅ [BUILD] Preparação do módulo arquivo concluída"
