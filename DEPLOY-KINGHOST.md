# Deploy R10 Piauí na KingHost

## Plano recomendado
**Node.js III** - R$ 27,06/mês
- 512 MB RAM (suficiente - cards não simultâneos)
- 10 aplicações Node.js
- SSL grátis
- Deploy via Git

---

## Setup Rápido (5 passos)

### 1. Criar conta e contratar plano
- Acesse: https://kinghost.com.br/hospedagem-nodejs
- Contrate "Plano Node.js III"
- Anote: painel, usuário, senha

### 2. Configurar aplicação Node.js no painel
**No painel KingHost:**
1. Ir em "Node.js" → "Criar Aplicação"
2. Preencher:
   - **Nome:** r10-piaui
   - **Versão Node:** 18.x ou 20.x
   - **Porta:** (painel atribui automaticamente)
   - **Diretório:** /home/seuusuario/r10-piaui
   - **Arquivo inicial:** server/server-api-simple.cjs
   - **Modo:** Production

### 3. Deploy via Git
**No painel KingHost:**
1. "Git" → "Adicionar Repositório"
2. URL: https://github.com/georgemendesr/r10final.git
3. Branch: master
4. Diretório destino: /home/seuusuario/r10-piaui
5. Clicar "Clonar"

**Ou via SSH:**
```bash
ssh seuusuario@seudominio.com.br
cd ~
git clone https://github.com/georgemendesr/r10final.git r10-piaui
cd r10-piaui
```

### 4. Instalar dependências
**No painel KingHost:**
1. "Node.js" → Sua aplicação
2. Clicar "Instalar Dependências" (botão NPM)

**Ou via SSH:**
```bash
cd ~/r10-piaui
npm install --production
```

### 5. Configurar variáveis de ambiente
**No painel KingHost:**
1. "Node.js" → Sua aplicação → "Variáveis de Ambiente"
2. Adicionar:
```
NODE_ENV=production
PORT=(porta que o painel mostrou)
SERVE_STATIC_FRONT=1
JWT_SECRET=seu-secret-aqui
GROQ_API_KEY=sua-chave-groq
INSTAGRAM_ACCESS_TOKEN=seu-token-instagram
```

### 6. Build do frontend
**Via SSH:**
```bash
cd ~/r10-piaui/r10-front_full_07ago
npm install
npm run build
cd ..
cp -r r10-front_full_07ago/dist ./dist
```

### 7. Iniciar aplicação
**No painel:**
1. "Node.js" → Sua aplicação
2. Clicar "Iniciar" ou "Restart"

---

## Testar

Após iniciar:
- API: https://seudominio.com.br/api/health
- Site: https://seudominio.com.br/
- Instagram: funciona via endpoints da API

---

## Atualizações futuras

### Via Git (painel):
1. Fazer push no GitHub
2. Painel KingHost → "Git" → "Atualizar"
3. Reiniciar aplicação

### Via SSH:
```bash
cd ~/r10-piaui
git pull
npm install --production
# Se frontend mudou:
cd r10-front_full_07ago && npm run build && cd .. && cp -r r10-front_full_07ago/dist ./dist
# Reiniciar via painel ou: pm2 restart all
```

---

## Otimizações (opcional)

### Puppeteer otimizado
Se tiver problema de memória:
```bash
# Criar arquivo optimize-puppeteer.js já existe no projeto
# Ele automaticamente usa menos processos
```

### PM2 (gerenciador de processos)
```bash
npm install -g pm2
pm2 start server/server-api-simple.cjs --name r10-api
pm2 startup
pm2 save
```

---

## Troubleshooting

### Erro "Cannot find module"
```bash
cd ~/r10-piaui
npm install --production
```

### Erro de memória (Puppeteer)
Adicionar no `.env`:
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Frontend não carrega
```bash
cd ~/r10-piaui
ls -la dist  # Verificar se existe
# Se não existir:
cd r10-front_full_07ago && npm install && npm run build
cd .. && cp -r r10-front_full_07ago/dist ./dist
```

### SQLite "locked"
```bash
chmod 644 ~/r10-piaui/noticias.db
```

### Porta errada
Verificar no painel qual porta foi atribuída e garantir que:
- Variável `PORT` está setada
- `server-api-simple.cjs` usa `process.env.PORT`

---

## Domínio próprio

1. No painel KingHost: "Domínios" → "Apontar para aplicação"
2. Escolher domínio/subdomínio
3. Apontar para a aplicação Node.js
4. SSL é automático (Let's Encrypt)

---

## Monitoramento

### Logs em tempo real
**Via painel:** "Node.js" → Sua aplicação → "Logs"

**Via SSH:**
```bash
tail -f ~/logs/r10-piaui.log
```

### Status
```bash
pm2 status
pm2 monit
```

---

## Backup automático

### SQLite
Criar cron job no painel:
```bash
0 3 * * * cd ~/r10-piaui && node scripts/backup-db.cjs
```

---

## Custos
- **R$ 27,06/mês** (fixo)
- Sem custos extras (tráfego ilimitado)
- SSL incluso
- Suporte incluso

---

## Suporte KingHost
- Chat: https://kinghost.com.br/suporte
- Ticket: painel → "Suporte"
- Fórum: forum.kinghost.com.br
