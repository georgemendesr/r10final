# Migração da tabela `noticias`

Script: `scripts/migrate-noticias.cjs`

## O que o script faz
- Garante colunas: `published_at`, `created_at`, `updated_at`, `views`, `status` (adiciona se não existirem)
- Preenche valores nulos de timestamps e status
- Cria índice: `idx_noticias_posicao_published` em `(posicao, published_at)`
- Idempotente: pode rodar várias vezes sem quebrar

## Como rodar local
```bash
node scripts/migrate-noticias.cjs
```
(garanta que o arquivo do banco está em `data/r10piaui.db` ou defina `SQLITE_DB_PATH`)

## Como rodar no Render
1. Abra um Shell do serviço backend.
2. Execute:
```bash
node scripts/migrate-noticias.cjs
```
3. Verifique saída `🎉 Migração concluída.`

## Variáveis úteis
- `SQLITE_DB_PATH` para apontar para um caminho customizado.
- Em produção (Render) ele usa `/opt/render/project/src/data/r10piaui.db`.

## Verificando resultado
```bash
sqlite3 data/r10piaui.db "PRAGMA table_info(noticias);"
sqlite3 data/r10piaui.db "SELECT id,titulo,created_at,published_at,updated_at FROM noticias ORDER BY id DESC LIMIT 3;"
```

## Segurança
O script não remove colunas nem altera tipos existentes.

## Rollback
Não necessário — alterações são apenas adições de colunas e preenchimento de valores nulos.
