# 🚀 R10 Piauí - Configuração de Desenvolvimento

## ⚡ Início Rápido

### Comando Único para Todos os Serviços
```bash
npm run dev
```

Este comando inicia SIMULTANEAMENTE:
- 📱 **Frontend React/Vite** (porta 5175)
- 🔌 **Backend SQLite API** (porta 3002) 
- 📸 **Instagram Publisher** (porta 8080)

### Usando VS Code
- Pressione `Ctrl+Shift+B`
- Selecione "Iniciar Todos os Serviços"

## 🔗 URLs dos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5175 | Interface principal React/Vite |
| **Backend API** | http://localhost:3002 | API SQLite com notícias |
| **Instagram** | http://localhost:8080 | Publisher de cards do Instagram |
| **Health Check** | http://localhost:3002/api/health | Status da API |

## 📋 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia todos os serviços
- `npm run dev:frontend` - Apenas o frontend
- `npm run dev:backend` - Apenas o backend
- `npm run dev:instagram` - Apenas o Instagram Publisher

### Utilitários
- `npm run build` - Build do frontend
- `npm test` - Executar testes
- `npm run api:3002` - Backend standalone

## ⚙️ Configurações Técnicas

### Proxy Vite Configurado
- `/api` → `http://localhost:3002` (Backend)
- `/instagram` → `http://localhost:8080` (Instagram)

### Hosts de Escuta
Todos os servidores escutam em `0.0.0.0` para máxima compatibilidade.

### Dependências Instaladas
- `concurrently` - Execução simultânea de processos
- `cross-env` - Variáveis de ambiente multiplataforma

## 🎯 Solução de Problemas

### Se algum serviço não iniciar:
```bash
# Parar todos os processos Node.js
taskkill /f /im node.exe

# Reiniciar
npm run dev
```

### Verificar portas em uso:
```bash
netstat -ano | findstr ":3002\|:5175\|:8080"
```

## 🎉 Resultado Final

✅ **ZERO configuração manual necessária**  
✅ **SEM problemas de CORS**  
✅ **SEM conflitos de porta**  
✅ **Proxy automático no Vite**  
✅ **Um comando para tudo**

> **Comando Mágico**: `npm run dev` 🪄
