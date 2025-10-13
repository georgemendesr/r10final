# 📰 Arquivo de Notícias - R10 Piauí

Módulo **completamente independente** para visualização de notícias antigas do portal R10 Piauí.

## 🎯 Sobre o Projeto

Este é um sistema **isolado** criado para preservar e disponibilizar o histórico de notícias do R10 Piauí sem interferir no portal principal. O módulo possui:

- ✅ Servidor Express próprio (porta 5050)
- ✅ Banco de dados SQLite independente
- ✅ Interface limpa e responsiva com Bootstrap 5
- ✅ Sistema de paginação e filtros
- ✅ Categorização de notícias
- ✅ Contador de visualizações
- ✅ Notícias relacionadas

## 📁 Estrutura do Projeto

```
/arquivo
  /config
    db.js           # Configuração do banco SQLite
    seed.js         # Script para popular banco com dados de teste
  /controllers
    noticiasController.js  # Lógica de negócio
  /routes
    noticiasRoutes.js      # Definição de rotas
  /views
    index.ejs       # Listagem de notícias
    detalhe.ejs     # Visualização de notícia individual
    404.ejs         # Página de erro 404
    erro.ejs        # Página de erro genérica
  /public           # Arquivos estáticos (CSS, JS, imagens)
  server.js         # Servidor Express
  package.json      # Dependências do módulo
  .env.example      # Exemplo de configuração
  .gitignore        # Arquivos ignorados pelo Git
```

## 🚀 Instalação

### 1. Navegue até a pasta do módulo

```bash
cd arquivo
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
# No Windows PowerShell:
Copy-Item .env.example .env

# No Linux/Mac:
cp .env.example .env
```

### 4. (Opcional) Ajuste as configurações no `.env`

```env
PORT=5050
DB_PATH=./arquivo.db
ITEMS_PER_PAGE=10
BASE_URL=http://localhost:5050
```

### 5. Popule o banco com dados de teste

```bash
npm run seed
```

Isso criará o banco de dados e inserirá 20 notícias de exemplo.

### 6. Inicie o servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 7. Acesse no navegador

```
http://localhost:5050
```

## 📊 Banco de Dados

### Estrutura da Tabela `noticias`

| Campo             | Tipo     | Descrição                          |
|-------------------|----------|------------------------------------|
| id                | INTEGER  | Chave primária (auto-incremento)   |
| titulo            | TEXT     | Título da notícia                  |
| conteudo          | TEXT     | Conteúdo completo                  |
| imagem            | TEXT     | URL da imagem principal            |
| data_publicacao   | DATETIME | Data de publicação                 |
| autor             | TEXT     | Nome do autor                      |
| categoria         | TEXT     | Categoria da notícia               |
| views             | INTEGER  | Contador de visualizações          |

### Importar Notícias Antigas

Se você já possui um backup das notícias antigas do R10 Piauí:

1. **Backup em SQL:**
   ```bash
   # Importe o dump SQL
   sqlite3 arquivo.db < /caminho/para/backup.sql
   ```

2. **Backup em JSON:**
   Crie um script de importação personalizado baseado em `config/seed.js`

3. **Backup em CSV:**
   Use ferramentas como `sqlite3` CLI ou scripts Node.js para importar

## 🎨 Funcionalidades

### ✅ Listagem de Notícias
- Exibição em cards com imagem, título e resumo
- Paginação (10 notícias por página)
- Filtro por categoria
- Busca por palavra-chave
- Contador de visualizações

### ✅ Visualização Individual
- Exibição completa da notícia
- Informações de autor, data e categoria
- Notícias relacionadas (mesma categoria)
- Contador de views atualizado automaticamente

### ✅ Design Responsivo
- Layout adaptável para desktop, tablet e mobile
- Efeitos glassmorphism suaves
- Bootstrap 5 + Bootstrap Icons
- Animações e transições elegantes

## 🔧 Scripts Disponíveis

```bash
# Iniciar servidor em produção
npm start

# Iniciar servidor em desenvolvimento (com nodemon)
npm run dev

# Popular banco com dados de teste
npm run seed
```

## 🌐 API REST (Opcional)

O módulo também expõe uma API REST para consumo externo:

### GET /api/noticias

Retorna lista de notícias em JSON.

**Parâmetros:**
- `limit` (opcional, padrão: 10) - Quantidade de notícias
- `offset` (opcional, padrão: 0) - Deslocamento para paginação

**Exemplo:**
```bash
curl http://localhost:5050/api/noticias?limit=5&offset=0
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Título da notícia",
      "conteudo": "...",
      "imagem": "...",
      "data_publicacao": "2024-01-15",
      "autor": "Redação R10",
      "categoria": "Política",
      "views": 150
    }
  ],
  "limit": 5,
  "offset": 0
}
```

## 🚢 Deploy em Produção

### Opção 1: Mesmo servidor do portal principal

1. Suba a pasta `/arquivo` junto com o projeto
2. Configure um proxy reverso (Nginx/Apache) para:
   - `https://r10piaui.com.br/arquivo` → `http://localhost:5050`

### Opção 2: Subdomínio separado

1. Configure DNS para `arquivo.r10piaui.com.br`
2. Aponte para o servidor onde o módulo está rodando
3. Configure certificado SSL

### Opção 3: Servidor separado

1. Faça deploy em um servidor/VPS independente
2. Mantenha totalmente isolado do portal principal

### Exemplo de configuração Nginx:

```nginx
# No arquivo de configuração do R10 Piauí
location /arquivo {
    proxy_pass http://localhost:5050;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🔒 Segurança

Este módulo é **completamente isolado** e:

- ❌ Não acessa o banco de dados principal do R10 Piauí
- ❌ Não compartilha variáveis de ambiente
- ❌ Não modifica arquivos externos à pasta `/arquivo`
- ✅ Pode ser testado e desenvolvido sem riscos
- ✅ Pode ser removido a qualquer momento sem impacto

## 🐛 Troubleshooting

### Erro: "Cannot find module 'express'"
```bash
# Certifique-se de estar na pasta /arquivo
cd arquivo
npm install
```

### Erro: "EADDRINUSE: address already in use"
```bash
# A porta 5050 já está em uso. Altere no .env:
PORT=5051
```

### Banco de dados vazio após seed
```bash
# Verifique se o seed foi executado:
npm run seed

# Ou manualmente:
node config/seed.js
```

### Imagens não carregam
- Verifique se as URLs das imagens estão corretas
- Imagens quebradas usarão placeholder automaticamente

## 📝 Manutenção

### Fazer Backup do Banco

```bash
# Copiar arquivo do banco
cp arquivo.db arquivo-backup-$(date +%Y%m%d).db

# Ou exportar para SQL
sqlite3 arquivo.db .dump > backup.sql
```

### Limpar Notícias Antigas

```sql
-- Conectar ao banco
sqlite3 arquivo.db

-- Deletar notícias antigas (exemplo: mais de 5 anos)
DELETE FROM noticias 
WHERE data_publicacao < datetime('now', '-5 years');
```

### Resetar Views

```sql
UPDATE noticias SET views = 0;
```

## 🎯 Próximos Passos

- [ ] Sistema de comentários (opcional)
- [ ] Exportação de notícias em PDF
- [ ] Sistema de tags além de categorias
- [ ] Analytics de notícias mais lidas
- [ ] Integração com busca full-text

## 📧 Suporte

Para dúvidas ou problemas:
1. Verifique a seção de Troubleshooting
2. Consulte os logs do servidor
3. Entre em contato com a equipe de desenvolvimento

---

**🔧 Desenvolvido para R10 Piauí**  
Sistema independente de arquivo de notícias - v1.0.0
