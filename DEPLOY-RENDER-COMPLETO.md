# Deploy Completo no Render.com

## ✅ Guia Passo a Passo - Configuração COMPLETA

Este guia configura **tudo de uma vez**: Backend + Frontend + Puppeteer + Instagram + SQLite Persistente.

---

## 1. Pré-requisitos

- [ ] Conta no Render.com (plano Starter $7/mês recomendado)
- [ ] Repositório GitHub conectado
- [ ] Chaves de API:
  - GROQ_API_KEY (para resumos/IA)
  - INSTAGRAM_ACCESS_TOKEN (Meta Graph API)
  - IG_BUSINESS_ID (ID da conta business)

---

## 2. Criar Web Service

No dashboard do Render:

1. **New +** → **Web Service**
2. **Connect Repository**: `georgemendesr/r10final`
3. Preencher campos:

### Configuração Básica

| Campo | Valor |
|-------|-------|
| **Name** | `r10piaui` |
| **Region** | `Oregon (US West)` ou `Frankfurt` |
| **Branch** | `master` |
| **Root Directory** | *(deixe vazio)* |
| **Runtime** | `Node` |

### Build & Start

| Campo | Comando |
|-------|---------|
| **Build Command** | `npm install && cd r10-front_full_07ago && npm install && npm run build && cd ..` |
| **Start Command** | `node server/server-api-simple.cjs` |

### Instance Type

```
Starter ($7/mês, 512 MB RAM, sempre ativo)
```

**Nota sobre memória**: 512 MB é suficiente para:
- Puppeteer com uso pontual (15 cards/dia)
- SQLite
- Frontend servido estaticamente
- 1-2 requisições simultâneas

Se precisar escalar: upgrade para Standard (2 GB, $25/mês).

---

## 3. Environment Variables (TODAS)

Adicione TODAS estas variáveis (Settings → Environment):

### Essenciais
```
NODE_ENV=production
SERVE_STATIC_FRONT=1
PORT=(Render define automaticamente, deixe vazio)
```

### Segurança
```
JWT_SECRET=f6a3c1e4d0b847d6b9ab3f6e7a2c4d5f8b1e9c0a7d4f6b2c8e1f3a5d7b9c2e4
```

### Banco de Dados (Persistente)
```
SQLITE_DB_PATH=/opt/render/project/src/data/noticias.db
```

### Puppeteer (para geração de cards)
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
```

**Alternativa se chromium não estiver instalado**: Remova `PUPPETEER_EXECUTABLE_PATH` e Puppeteer baixará Chromium automaticamente (~300 MB).

### APIs Externas
```
GROQ_API_KEY=sua_chave_groq_aqui
INSTAGRAM_ACCESS_TOKEN=seu_token_instagram_aqui
IG_BUSINESS_ID=seu_id_business_aqui
```

**Se não tiver as chaves agora**: Deixe vazias. Endpoints que usam essas features falharão, mas API básica funciona.

---

## 4. Disco Persistente (OBRIGATÓRIO para SQLite)

No formulário de criação ou depois em **Settings → Disks**:

### Adicionar Disco

| Campo | Valor |
|-------|-------|
| **Name** | `sqlite-data` |
| **Mount Path** | `/opt/render/project/src/data` |
| **Size** | `1 GB` |

**Importante**: 
- O banco `noticias.db` será criado neste disco
- Sem disco, o banco é recriado a cada deploy (perde dados)
- A variável `SQLITE_DB_PATH` aponta para este caminho

---

## 5. Advanced Settings

### Auto-Deploy
```
✓ Yes (deploy automático em cada push)
```

### Health Check Path
```
/api/health
```

Render vai verificar este endpoint periodicamente. Se não responder 200 OK em 60s após start, marca como falha.

---

## 6. Criar e Aguardar Deploy

1. **Clique em "Create Web Service"**
2. Acompanhe o log de build (tempo estimado: 3-8 minutos)

### O que vai acontecer:
1. ✅ Clone do repositório
2. ✅ `npm install` (deps raiz)
3. ✅ `cd r10-front_full_07ago && npm install` (deps frontend)
4. ✅ `npm run build` (build Vite → gera `dist/`)
5. ✅ Download de Chromium (se `PUPPETEER_EXECUTABLE_PATH` não definido)
6. ✅ `node server/server-api-simple.cjs` (start do servidor)

### Logs esperados:
```
=== [R10 API] bootstrap ...
[seguranca] JWT_SECRET válido (64 caracteres)
[db] Conexão SQLite OK: /opt/render/project/src/data/noticias.db
[server] Servindo frontend build: r10-front_full_07ago/dist
[server] Escutando na porta 10000
```

---

## 7. Testar Deploy

Após build completo, Render gera uma URL tipo:
```
https://r10piaui.onrender.com
```

### Testes Básicos

#### 1. Health Check
```
GET https://r10piaui.onrender.com/api/health
```
**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T...",
  "database": "connected"
}
```

#### 2. Listar Posts
```
GET https://r10piaui.onrender.com/api/posts?limit=5
```

#### 3. Frontend (se build funcionou)
```
https://r10piaui.onrender.com/
```
Deve carregar a aplicação React.

#### 4. Geração de Card (Instagram)
```
POST https://r10piaui.onrender.com/api/instagram/create-card
Content-Type: application/json

{
  "titulo": "Teste Deploy",
  "chapeu": "Tecnologia",
  "resumo": "Sistema no ar!"
}
```

---

## 8. Troubleshooting

### ❌ Erro: `ENOENT: no such file or directory, open 'noticias.db'`
**Causa**: Disco não montado ou `SQLITE_DB_PATH` errado.
**Solução**:
1. Verificar Settings → Disks: disco criado e montado em `/opt/render/project/src/data`
2. Verificar variável `SQLITE_DB_PATH=/opt/render/project/src/data/noticias.db`
3. Criar pasta manualmente se necessário (via SSH ou script):
   ```bash
   mkdir -p /opt/render/project/src/data
   ```

### ❌ Erro: `JWT_SECRET ausente ou fraco`
**Causa**: Variável não definida ou < 32 caracteres.
**Solução**: Verificar em Settings → Environment que `JWT_SECRET` tem exatamente 64 caracteres.

### ❌ Erro: Puppeteer - `Could not find Chromium`
**Causa**: `PUPPETEER_EXECUTABLE_PATH` aponta para local inexistente.
**Solução**:
1. **Opção A**: Remover variável → Puppeteer baixa automaticamente
2. **Opção B**: Verificar path correto no Render:
   ```bash
   which chromium-browser
   # ou
   which chromium
   ```
3. **Opção C**: Instalar via buildpack (adicionar `.buildpacks` na raiz):
   ```
   https://github.com/heroku/heroku-buildpack-google-chrome
   ```

### ❌ Timeout / 502 Bad Gateway
**Causa**: Servidor demora > 60s para responder no health check.
**Possíveis razões**:
- Build do frontend muito pesado
- Download de Chromium travou
- Memória insuficiente

**Solução**:
1. Ver logs completos: Settings → Logs
2. Se memória estourou: upgrade para Standard (2 GB)
3. Simplificar build: remover frontend temporariamente

### ❌ Frontend não carrega (404)
**Causa**: Build do Vite falhou ou servidor não está servindo `dist/`.
**Solução**:
1. Verificar log de build: procurar por `npm run build` e se terminou com sucesso
2. Verificar variável `SERVE_STATIC_FRONT=1`
3. SSH no container (Shell tab) e verificar:
   ```bash
   ls -la r10-front_full_07ago/dist/
   ```

---

## 9. Monitoramento e Manutenção

### Ver Logs em Tempo Real
Settings → Logs (ou aba Logs no dashboard)

### Métricas
Settings → Metrics
- CPU usage
- Memory usage
- Request rate
- Response times

### Alertas
Configure em Settings → Notifications:
- Deploy falhou
- Serviço down
- Uso de memória > 90%

---

## 10. Custos Mensais Estimados

| Item | Custo |
|------|-------|
| Web Service (Starter) | $7.00 |
| Disco 1 GB | $0.25 |
| **Total** | **$7.25/mês** |

---

## 11. Próximos Passos (Após Deploy OK)

### Melhorias Opcionais

#### A. Domínio Customizado
Settings → Custom Domain → Adicionar `api.r10piaui.com.br`

#### B. SSL (Automático)
Render fornece SSL gratuito via Let's Encrypt.

#### C. Backup do Banco
Criar script de backup periódico:
```bash
# Copiar noticias.db para bucket S3/Cloudflare R2
```

#### D. CI/CD Avançado
- Testes automatizados antes do deploy
- Preview environments para branches
- Rollback automático se health check falhar

#### E. Escalabilidade
Se tráfego aumentar:
- Upgrade para Standard (2 GB, $25/mês)
- Adicionar Redis para cache
- Migrar SQLite → PostgreSQL (Render oferece DB gerenciado)

---

## 12. Comandos Úteis (Shell Render)

Acessar via Settings → Shell:

```bash
# Ver estrutura de arquivos
ls -la

# Ver banco de dados
ls -la /opt/render/project/src/data/

# Verificar variáveis de ambiente
env | grep -E 'NODE_ENV|PORT|JWT'

# Ver processos
ps aux

# Testar conectividade
curl http://localhost:$PORT/api/health

# Ver uso de memória
free -h

# Ver espaço em disco
df -h
```

---

## 13. Contato e Suporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status**: https://status.render.com

---

## ✅ Checklist Final

- [ ] Web Service criado
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Disco persistente adicionado e montado
- [ ] Build concluído com sucesso
- [ ] `/api/health` responde 200 OK
- [ ] Frontend acessível (se `SERVE_STATIC_FRONT=1`)
- [ ] Geração de card Instagram testada
- [ ] Logs monitorados (sem erros críticos)
- [ ] Domínio customizado configurado (opcional)
- [ ] Backup do banco configurado (opcional)

---

**Pronto! Seu portal R10 Piauí está no ar! 🚀**
