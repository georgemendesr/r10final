# Backups do Banco SQLite

Este projeto utiliza um banco SQLite (`server/noticias.db`). O script `scripts/backup-db.cjs` gera backups incrementais com retenção automática.

## Script
```
node scripts/backup-db.cjs [--keep=30] [--prefix=noticias] [--db=server/noticias.db] [--compress=1]
```
Variáveis de ambiente suportadas:
- `SQLITE_DB_PATH`: caminho do banco (override `--db`).
- `BACKUP_KEEP`: quantidade de arquivos a manter (padrão 30).
- `BACKUP_PREFIX`: prefixo do nome do arquivo (padrão noticias).
- `BACKUP_DIR`: diretório destino (padrão ./backups).
- `BACKUP_COMPRESS=1`: habilita gzip (.db.gz).

## Estrutura de Arquivo
`PREFIX-YYYYMMDDTHHmmss.db` ou `.db.gz`

Exemplo: `noticias-20250927T132500.db.gz`

## Retenção
Mantém apenas os N arquivos mais recentes (N = `--keep` ou `BACKUP_KEEP`). Excedentes são removidos automaticamente.

## Agendamento (Windows)
Criar tarefa diária às 02:15 executando backup comprimido mantendo 45 cópias:
```powershell
schtasks /Create /TN R10BackupDaily /TR "cmd /c cd %CD% && node scripts/backup-db.cjs --keep=45 --compress=1" /SC DAILY /ST 02:15 /RL LIMITED
```
Para testar imediatamente:
```powershell
schtasks /Run /TN R10BackupDaily
```

## Agendamento (Linux / WSL)
Adicionar ao crontab (ex: diariamente 02:15):
```
15 2 * * * /usr/bin/node /caminho/do/projeto/scripts/backup-db.cjs --keep=45 --compress=1 >> /caminho/do/projeto/backups/backup.log 2>&1
```

## Restauração
1. Pare o serviço que usa o banco.
2. Faça cópia de segurança do arquivo atual (se existir):
```bash
cp server/noticias.db server/noticias.db.bak.$(date +%Y%m%d%H%M%S)
```
3. Descompacte (se .gz):
```bash
gzip -dc backups/noticias-20250927T132500.db.gz > server/noticias.db
```
4. Inicie novamente a aplicação.

No Windows (PowerShell) para restaurar backup .gz:
```powershell
Expand-Archive não funciona para gzip simples; use:
Get-Content .\backups\noticias-20250927T132500.db.gz -Encoding Byte | Write-Output > temp.gz
# Use 7zip ou gzip se disponível. Com 7zip instalado:
7z e .\backups\noticias-20250927T132500.db.gz -o.\server -y
```

## Verificação de Integridade
Após restaurar:
```bash
sqlite3 server/noticias.db "PRAGMA integrity_check;"
```
Retorno esperado: `ok`.

## Boas Práticas
- Armazene a pasta `backups/` fora do repositório (adicione ao .gitignore).
- Copie periodicamente backups para um storage externo (S3, GDrive, etc.).
- Teste restauração mensalmente.
- Não mantenha todos os backups no mesmo disco físico do banco principal (risco de falha única).

## Próximos Passos Possíveis
- Criptografia (zip com senha ou gpg) para dados sensíveis.
- Verificação de hash (SHA256) pós backup.
- Upload automático para cloud (S3 ou Backblaze) via script adicional.

---
_Manutenção: revise este documento se a estrutura do banco ou processo de deploy mudar._
