# 📦 Pasta de Backup

Esta pasta é destinada aos arquivos de backup das notícias antigas do R10 Piauí.

## 📝 Instruções

### 1. Coloque seu arquivo de backup aqui

Você já colocou o arquivo `r10` (ou `r10.db`) nesta pasta. Ótimo! ✅

### 2. Verifique a estrutura do banco

Para ver quais tabelas existem no backup:

```bash
# No PowerShell (Windows):
sqlite3 backup/r10 ".tables"

# Ou se for .db:
sqlite3 backup/r10.db ".tables"
```

### 3. Veja a estrutura de uma tabela

```bash
sqlite3 backup/r10 ".schema posts"
```

Troque `posts` pelo nome correto da tabela de notícias.

### 4. Importe as notícias

```bash
# Volte para a pasta /arquivo
cd ..

# Execute o importador
node config/import-backup.js
```

## 🔍 Tipos de Backup Suportados

### SQLite (.db, .sqlite, .sqlite3)
- Formato recomendado
- Importação direta via script

### SQL Dump (.sql)
```bash
sqlite3 ../arquivo.db < backup/backup.sql
```

### JSON (.json)
- Crie um script personalizado baseado em `config/seed.js`
- Adapte para ler do JSON

### CSV (.csv)
```bash
sqlite3 ../arquivo.db
.mode csv
.import backup/noticias.csv noticias
```

## ⚠️ Importante

- Esta pasta **NÃO** é versionada no Git (.gitignore)
- Mantenha backups seguros em locais externos
- Teste a importação em ambiente local antes de produção

## 📊 Estrutura Esperada

O importador espera encontrar campos como:

- `titulo` - Título da notícia
- `conteudo` - Conteúdo completo
- `imagem` - URL da imagem
- `data_publicacao` - Data de publicação
- `autor` - Nome do autor
- `categoria` - Categoria da notícia

Se seu backup tiver nomes diferentes, edite `config/import-backup.js` na linha 48.

## 🛠️ Solução de Problemas

### Erro: "no such table"
Significa que a tabela especificada não existe. Verifique o nome correto com `.tables`

### Erro: "no such column"
Os nomes das colunas no backup são diferentes. Ajuste o SQL no importador.

### Backup muito grande
Para backups > 1GB, considere:
- Importar em lotes
- Usar servidor mais potente
- Fazer pré-processamento dos dados

## 📞 Suporte

Se tiver dúvidas sobre como importar seu backup específico, forneça:
1. Resultado do comando `.tables`
2. Resultado do comando `.schema nome_da_tabela`
3. Exemplo de algumas linhas do backup
