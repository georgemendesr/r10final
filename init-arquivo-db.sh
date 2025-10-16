#!/bin/bash
# Script de inicialização - garante que arquivo.db está no disco persistente

PERSISTENT_PATH="/opt/render/project/src/data/arquivo.db"
SOURCE_PATH="./arquivo/arquivo.db"

echo "==================================================================="
echo "🗄️  INICIALIZAÇÃO: Banco de dados do Arquivo"
echo "==================================================================="
echo ""

# Verificar se o disco persistente existe
if [ ! -d "/opt/render/project/src/data" ]; then
  echo "⚠️  Disco persistente não encontrado (ambiente local?)"
  echo "📁 Usando banco local: ${SOURCE_PATH}"
  echo ""
  exit 0
fi

# Se o banco persistente NÃO existe, copiar do repositório
if [ ! -f "${PERSISTENT_PATH}" ]; then
  echo "📦 Banco persistente não encontrado, copiando do repositório..."
  
  if [ -f "${SOURCE_PATH}" ]; then
    cp "${SOURCE_PATH}" "${PERSISTENT_PATH}"
    echo "✅ Banco copiado para disco persistente"
    
    # Verificar tamanho
    PERSISTENT_SIZE=$(du -h "${PERSISTENT_PATH}" | cut -f1)
    echo "📊 Tamanho: ${PERSISTENT_SIZE}"
  else
    echo "❌ ERRO: ${SOURCE_PATH} não encontrado no repositório!"
    exit 1
  fi
else
  echo "✅ Banco persistente já existe"
  
  # Comparar tamanhos (atualizar se o do repo for mais novo)
  SOURCE_SIZE=$(stat -f%z "${SOURCE_PATH}" 2>/dev/null || stat -c%s "${SOURCE_PATH}" 2>/dev/null || echo "0")
  PERSISTENT_SIZE=$(stat -f%z "${PERSISTENT_PATH}" 2>/dev/null || stat -c%s "${PERSISTENT_PATH}" 2>/dev/null || echo "0")
  
  echo "📊 Tamanho no repo: $(du -h ${SOURCE_PATH} | cut -f1)"
  echo "📊 Tamanho persistente: $(du -h ${PERSISTENT_PATH} | cut -f1)"
  
  if [ "${SOURCE_SIZE}" -gt "${PERSISTENT_SIZE}" ]; then
    echo "🔄 Banco do repo é maior, atualizando..."
    cp "${SOURCE_PATH}" "${PERSISTENT_PATH}"
    echo "✅ Banco atualizado"
  else
    echo "✅ Banco persistente está atualizado"
  fi
fi

# Criar symlink para que o código use o banco persistente
if [ ! -L "${SOURCE_PATH}" ]; then
  rm -f "${SOURCE_PATH}"
  ln -s "${PERSISTENT_PATH}" "${SOURCE_PATH}"
  echo "🔗 Symlink criado: ${SOURCE_PATH} -> ${PERSISTENT_PATH}"
fi

echo ""
echo "==================================================================="
echo "✅ Inicialização concluída"
echo "==================================================================="
echo ""
