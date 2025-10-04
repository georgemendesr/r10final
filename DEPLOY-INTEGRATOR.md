# ========================================
# GUIA COMPLETO DE DEPLOY - INTEGRATOR
# Hospedagem NODE ELITE (1GB RAM)
# ========================================

## 📋 PRÉ-REQUISITOS

✅ Conta Integrator NODE ELITE contratada
✅ Git instalado localmente
✅ Node.js 18+ instalado localmente
✅ Acesso ao cPanel da Integrator

---

## 🚀 PASSO 1: Preparar Repositório Git

### 1.1 Criar repositório privado no GitHub/GitLab/Bitbucket

```bash
# No GitHub:
# - New Repository → r10-piaui-portal
# - Private
# - Não adicionar README (já existe)
```

### 1.2 Configurar remote local

```bash
cd c:\Users\George Mendes\Desktop\r10final

# Adicionar remote (substitua pela sua URL)
git remote add origin https://github.com/seu-usuario/r10-piaui-portal.git

# Verificar se .gitignore está correto
cat .gitignore

# Fazer commit de tudo
git add .
git commit -m "chore: preparar projeto para produção"
git push -u origin main
```

---

## 🔧 PASSO 2: Build do Frontend (LOCAL)

**IMPORTANTE:** Fazer build localmente para economizar processos no servidor!

```bash
cd r10-front_full_07ago

# Instalar dependências (se não tiver)
npm install

# Build para produção
npm run build

# Verificar se pasta dist/ foi criada
dir dist\  # Windows
ls dist/   # Linux/Mac
```

### 2.1 Adicionar build ao Git

```bash
# Voltar para raiz
cd ..

# Remover dist/ do .gitignore (se estiver lá)
# Abrir .gitignore e comentar/remover linha: r10-front_full_07ago/dist

# Adicionar build ao Git
git add r10-front_full_07ago/dist
git commit -m "build: adicionar frontend buildado"
git push
```

---

## 🌐 PASSO 3: Configurar no cPanel Integrator

### 3.1 Acessar cPanel

1. Login no painel Integrator: https://painel.integrator.host/
2. Localizar domínio/subdomínio do projeto
3. Acessar **Node.js Selector** ou **Setup Node.js App**

### 3.2 Criar aplicação Node.js Principal

**Configurações:**
```
Nome: R10 Portal Principal
Node Version: 18.x ou 20.x (mais recente disponível)
Application Mode: Production
Application Root: /home/seuusuario/r10final
Application URL: seudominio.com.br ou r10.seudominio.com.br
Application Startup File: server/server-api-simple.cjs
```

**Variáveis de Ambiente:**
```
NODE_ENV=production
PORT=3002
DATABASE_PATH=/home/seuusuario/r10final/server/noticias.db
```

### 3.3 Criar segunda aplicação (Instagram Publisher)

```
Nome: R10 Instagram Publisher
Node Version: 18.x ou 20.x
Application Mode: Production
Application Root: /home/seuusuario/r10final
Application URL: seudominio.com.br:8080 (ou subdomínio)
Application Startup File: server.js
```

**Variáveis de Ambiente:**
```
NODE_ENV=production
PORT=8080
INSTAGRAM_ACCESS_TOKEN=seu_token_aqui
INSTAGRAM_BUSINESS_ID=seu_id_aqui
GROQ_API_KEY=sua_chave_aqui
```

### 3.4 Criar terceira aplicação (TTS - se usar)

```
Nome: R10 TTS
Node Version: 18.x ou 20.x
Application Mode: Production
Application Root: /home/seuusuario/r10final
Application Startup File: server/simple-server.cjs
```

**Variáveis de Ambiente:**
```
NODE_ENV=production
PORT=3001
```

---

## 📦 PASSO 4: Deploy via Git

### 4.1 Configurar Git Deploy no cPanel

1. No cPanel → **Git Version Control**
2. **Create** → Nova configuração

**Configurações:**
```
Repository Path: /home/seuusuario/r10final
Repository URL: https://github.com/seu-usuario/r10-piaui-portal.git
Branch: main
```

3. Clicar em **Manage** → **Pull**
4. Integrator vai clonar o repositório

### 4.2 Instalar dependências

**Via Terminal SSH (recomendado):**
```bash
ssh seuusuario@seu-servidor.integrator.host

cd r10final

# Instalar dependências principais
npm install --production

# Instalar PM2 globalmente (se não tiver)
npm install -g pm2

# Criar pasta de logs
mkdir -p logs
```

**Via cPanel Terminal (alternativa):**
- Abrir Terminal no cPanel
- Executar os mesmos comandos acima

---

## 🚀 PASSO 5: Iniciar com PM2

### 5.1 Usar configuração de produção

```bash
cd /home/seuusuario/r10final

# Iniciar todos os serviços com PM2
pm2 start ecosystem.production.js

# Verificar status
pm2 status

# Verificar logs
pm2 logs

# Salvar configuração (reinicia automático após reboot)
pm2 save
pm2 startup
```

### 5.2 Verificar se está rodando

```bash
# Verificar processos
pm2 list

# Deve mostrar:
# ┌─────┬────────────────┬─────────┬─────────┬──────────┬────────┐
# │ id  │ name           │ mode    │ ↺       │ status   │ cpu    │
# ├─────┼────────────────┼─────────┼─────────┼──────────┼────────┤
# │ 0   │ r10-backend    │ fork    │ 0       │ online   │ 0%     │
# │ 1   │ r10-instagram  │ fork    │ 0       │ online   │ 0%     │
# │ 2   │ r10-tts        │ fork    │ 0       │ online   │ 0%     │
# └─────┴────────────────┴─────────┴─────────┴──────────┴────────┘

# Monitorar memória em tempo real
pm2 monit
```

---

## 🌍 PASSO 6: Configurar Proxy Reverso (NGINX)

### 6.1 Configurar no cPanel

1. cPanel → **MultiPHP INI Editor** ou **Apache Configuration**
2. Adicionar proxy para as portas Node.js

**Configuração recomendada:**

```nginx
# Frontend estático
location / {
    root /home/seuusuario/r10final/r10-front_full_07ago/dist;
    try_files $uri $uri/ /index.html;
}

# API Backend (porta 3002)
location /api/ {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# Instagram Publisher (porta 8080)
location /instagram/ {
    proxy_pass http://localhost:8080/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# TTS (porta 3001 - se usar)
location /tts/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
}

# Arquivos estáticos (imagens uploads)
location /uploads/ {
    alias /home/seuusuario/r10final/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔐 PASSO 7: Configurar SSL (HTTPS)

### 7.1 No cPanel

1. **SSL/TLS** → **Manage SSL Sites**
2. Selecionar domínio
3. **AutoSSL** ou **Let's Encrypt** (gratuito)
4. Certificado será gerado automaticamente

---

## 📊 PASSO 8: Monitoramento

### 8.1 Comandos úteis PM2

```bash
# Ver logs em tempo real
pm2 logs

# Apenas um serviço
pm2 logs r10-backend

# Resetar logs (limpar)
pm2 flush

# Reiniciar um serviço
pm2 restart r10-instagram

# Reiniciar todos
pm2 restart all

# Parar todos
pm2 stop all

# Ver uso de memória/CPU
pm2 monit

# Ver informações detalhadas
pm2 show r10-backend
```

### 8.2 Verificar uso de recursos

```bash
# Memória total do sistema
free -h

# Uso por processo
top -p $(pgrep -d',' node)

# Verificar se está perto do limite
pm2 list
# Olhar coluna "memory"
```

---

## 🔄 PASSO 9: Deploys Futuros

### 9.1 Workflow de atualização

```bash
# 1. LOCAL: Fazer alterações no código
git add .
git commit -m "feat: nova funcionalidade X"
git push

# 2. SERVIDOR: Atualizar código via SSH
ssh seuusuario@servidor.integrator.host
cd r10final
git pull

# 3. Reinstalar dependências (se package.json mudou)
npm install --production

# 4. Rebuild frontend (se mudou)
cd r10-front_full_07ago
npm run build
cd ..

# 5. Reiniciar serviços
pm2 restart all

# 6. Verificar
pm2 logs
```

### 9.2 Deploy automatizado (opcional)

Criar script `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Iniciando deploy..."

cd /home/seuusuario/r10final

echo "📥 Baixando código..."
git pull

echo "📦 Instalando dependências..."
npm install --production

echo "🔨 Buildando frontend..."
cd r10-front_full_07ago
npm run build
cd ..

echo "🔄 Reiniciando serviços..."
pm2 restart all

echo "✅ Deploy concluído!"
pm2 status
```

Dar permissão e executar:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🆘 TROUBLESHOOTING

### Problema: Serviço não inicia

```bash
# Ver logs de erro
pm2 logs r10-backend --err

# Verificar portas em uso
netstat -tuln | grep -E '3002|8080|3001'

# Matar processos fantasmas
killall -9 node
pm2 restart all
```

### Problema: Memória alta

```bash
# Verificar consumo
pm2 monit

# Restart manual se > 900MB
pm2 restart r10-instagram

# Forçar garbage collection
pm2 restart all
```

### Problema: Puppeteer não funciona

```bash
# Instalar dependências do Chrome
sudo yum install -y chromium  # CentOS
sudo apt-get install -y chromium-browser  # Ubuntu

# Verificar se single-process está ativo
pm2 logs r10-instagram | grep "single-process"
```

### Problema: Git deploy falha

```bash
# Verificar permissões
ls -la /home/seuusuario/r10final

# Reconfigurar remote
cd /home/seuusuario/r10final
git remote -v
git remote set-url origin https://github.com/seu-usuario/r10-piaui-portal.git
```

---

## 📈 CHECKLIST FINAL

- [ ] Repositório Git criado e código enviado
- [ ] Frontend buildado localmente (pasta dist/)
- [ ] Build adicionado ao Git
- [ ] Aplicações Node.js criadas no cPanel (3x)
- [ ] Variáveis de ambiente configuradas
- [ ] Git deploy configurado e código clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] PM2 iniciado com `ecosystem.production.js`
- [ ] Proxy reverso NGINX configurado
- [ ] SSL/HTTPS ativado
- [ ] Testes: site carrega, dashboard funciona, API responde
- [ ] Monitoramento ativo (`pm2 monit`)

---

## 🎉 SUCESSO!

Seu portal R10 Piauí está no ar! 🚀

**URLs esperadas:**
- Frontend: https://seudominio.com.br
- Dashboard: https://seudominio.com.br/admin
- API: https://seudominio.com.br/api/posts
- Instagram: https://seudominio.com.br/instagram (ou porta 8080)

---

## 📞 SUPORTE

**Integrator:**
- Ticket: https://painel.integrator.host/
- Wiki: https://wiki.integrator.com.br/

**Dúvidas técnicas:**
- Verificar logs: `pm2 logs`
- Verificar processos: `pm2 list`
- Verificar memória: `pm2 monit`
