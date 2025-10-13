# 🚀 Início Rápido - Arquivo R10 Piauí

## ⚡ Forma mais rápida (Windows)

**Clique duas vezes em `iniciar.bat`**

Pronto! O script vai:
1. ✅ Instalar dependências (se necessário)
2. ✅ Criar banco de dados (se não existir)
3. ✅ Popular com 20 notícias de teste
4. ✅ Iniciar servidor em http://localhost:5050

---

## 📋 Ou faça manualmente:

### 1️⃣ Instalar dependências
```bash
cd arquivo
npm install
```

### 2️⃣ Popular banco com dados de teste
```bash
npm run seed
```

### 3️⃣ Iniciar servidor
```bash
npm start
```

### 4️⃣ Acessar no navegador
```
http://localhost:5050
```

---

## 📥 Importar notícias antigas do R10

Se você já tem o backup das notícias antigas:

### 1️⃣ Coloque o arquivo na pasta `backup/`
O arquivo já está lá! (`backup/r10`)

### 2️⃣ Execute o importador
```bash
node config/import-backup.js
```

O script vai perguntar se deseja limpar o banco antes. Responda:
- **s** = apagar notícias de teste e importar apenas as antigas
- **n** = manter notícias de teste e adicionar as antigas

---

## 🔧 Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor |
| `npm run dev` | Inicia com auto-reload (desenvolvimento) |
| `npm run seed` | Popula banco com notícias de teste |
| `iniciar.bat` | Faz tudo automaticamente (Windows) |
| `node config/import-backup.js` | Importa backup real |

---

## 🌐 URLs importantes

- **Interface web:** http://localhost:5050
- **API REST:** http://localhost:5050/api/noticias

---

## ❓ Problemas comuns

### Erro: "Cannot find module"
```bash
npm install
```

### Porta 5050 já está em uso
Edite `.env` e mude a porta:
```env
PORT=5051
```

### Banco de dados vazio
```bash
npm run seed
```

---

## 📚 Documentação completa

Veja `README.md` para instruções detalhadas sobre:
- Deploy em produção
- Estrutura do projeto
- API REST
- Importação de backups
- Troubleshooting avançado

---

**✨ Desenvolvido para R10 Piauí**
