# R10 Publisher (limpo)

Aplicação Node/Express para gerar cards (Sharp + SVG), criar legenda e publicar no Instagram. Inclui API em SQLite para o site e um front React (Vite) em `r10-front_full_07ago`.

## Requisitos
- Node.js 18+
- Variáveis de ambiente (ver `.env.example`)

## Como rodar (Windows / PowerShell)

1) Instale dependências e fontes
```powershell
npm install
```

2) Configure o `.env` na raiz (copie do `.env.example`)
- PUBLIC_BASE_URL: URL pública acessível pela Meta apontando para `public/uploads` (ex.: https://seu-dominio.com)
- IG_BUSINESS_ID e IG_ACCESS_TOKEN: credenciais do Instagram
- GROQ_API_KEY (opcional): habilita IA para otimizar título/chapéu/legenda

3) Inicie o Publisher (UI em http://localhost:8080)
```powershell
npm start
# ou alternativa que força 9000
npm run start:9000
```
Healthcheck: http://localhost:8080/health

4) (Opcional) API de conteúdo + Front (build e servidor de produção)
```powershell
npm run build      # constrói o front (r10-front_full_07ago/dist)
npm run serve:prod # inicia API + SPA (porta 3002 por padrão)
```
- Health da API: http://localhost:3002/api/health
- Home JSON: http://localhost:3002/api/home

## Publicação no Instagram
A publicação usa carrossel (2 imagens):
1. Card da notícia gerado
2. Card fixo de publicidade (persistido em disco). Se não existir, um card padrão é gerado automaticamente.

Pré-requisitos para publicar:
- `PUBLIC_BASE_URL` configurada e acessível publicamente
- `IG_ACCESS_TOKEN` e `IG_BUSINESS_ID` válidos

## Estrutura principal
- `server.js`: Publisher (UI + API de geração/publicação)
- `server/server-api-simple.cjs`: API SQLite para conteúdo
- `server/server-production.cjs`: Servidor de produção para API + front (dist)
- `r10-front_full_07ago/`: Frontend (React + Vite)
- `templates/overlay*.png`: Overlays usados no card (obrigatórios)
- `fonts/`: Poppins TTF (baixadas no postinstall)

## Dicas
- Groq (IA) é opcional; sem chave, o sistema usa fallbacks locais
- Ajuste a porta usando `PORT` ao executar manualmente; por padrão, Publisher usa 8080
- Upload de publicidade: `POST /api/upload-publicity`
- Remover publicidade: `DELETE /api/delete-publicity`
- Buscar publicidade: `GET /api/get-publicity`

## Testes
- Front (Vitest) dentro de `r10-front_full_07ago`
- Backend (Jest) com testes de integração básicos:
	- `__tests__/sitemap-robots.test.cjs` valida `/sitemap.xml` e `/robots.txt`
	- `__tests__/metrics-runtime.test.cjs` valida `/api/metrics/runtime`
	- Executar tudo: `npm test`
	- Executar apenas SEO: `npm run test:seo`

## Observabilidade e Métricas
Endpoint público leve (sem dados sensíveis) para inspeção rápida de saúde e uso:

`GET /api/metrics/runtime`

Campos retornados (exemplo):
```json
{
	"uptimeSeconds": 3542,
	"memoryMB": { "rss": 96.4, "heapUsed": 42.1 },
	"requests": { "total": 1287, "2xx": 1240, "4xx": 38, "5xx": 9 },
	"slowRequests": 3,
	"maxLatencyMs": 842
}
```
Uso típico: healthcheck externo (cron ou monitor) e dashboards simples. Para métricas completas internas, existe um endpoint admin separado.

Readiness vs Health:
- `/api/health`: status geral + métricas leves.
- `/api/readiness`: checa DB, existência de manifest de backup (<24h), tamanho do DB (proxy de disco) e tabela de migrations; retorna 503 se algo crítico.

## Backups Rotativos do SQLite
Script: `npm run backup:rotate`

Local padrão: `backups/`

Retenção:
- Diários: 7
- Semanais (domingo): 4
- Mensais (dia 1): 3

Manifesto: `backups/manifest.json`.

### Agendamento (Linux / cron)
```
10 2 * * * /usr/bin/node /caminho/projeto/scripts/backup-rotate.cjs >> /var/log/r10-backup.log 2>&1
```

### Agendamento (Windows / Task Scheduler)
Program: `node`
Args: `scripts/backup-rotate.cjs`
Start in: diretório do projeto.

## Verificação de Uso de Disco
Script: `npm run check:disk`
Saída JSON com `%` usado; limite padrão 70% (`DISK_ALERT_THRESHOLD`). Exit code 2 quando excedido.

Exemplo:
```powershell
npm run check:disk
```

Modo texto simples:
```powershell
SET PLAIN=1; npm run check:disk
```

## Rotação de Logs
Script: `npm run logs:rotate`
Parâmetros (env):
- `LOG_ROTATE_LIMIT_MB` (padrão 5)
- `LOG_ROTATE_KEEP` (padrão 10)

Processo:
1. Busca `*.log` na raiz e em `logs/`
2. Arquiva > limite em `logs/archive/<nome>-<timestamp>.log.gz`
3. Mantém somente os últimos N por arquivo base

Agendamento sugerido (diário):
```
0 3 * * * /usr/bin/node /caminho/projeto/scripts/rotate-logs.cjs >> /var/log/r10-logs-rotate.log 2>&1
```

## Segurança & Rate Limiting
- JWT: servidor exige `JWT_SECRET` >= 32 chars em produção (senão aborta startup).
- Cookies de auth: `secure` + `sameSite=strict` em produção; `lax` fora.
- Helmet: aplica cabeçalhos comuns (CSP desabilitada por enquanto).
- Compressão: habilitada via `compression`.
- Rate limiting global: 1000 req / 15 min (ajustável via variáveis se futuramente implementado).
- Rate limiting login: 20 tentativas / 10 min por IP+email.

## Variáveis de Ambiente Principais
Veja `.env.example` completo. Principais:
- `PUBLIC_BASE_URL` (obrigatório)
- `JWT_SECRET` (obrigatório produção)
- `PORT`
- `DISK_ALERT_THRESHOLD`
- `SERVE_STATIC_FRONT` (0/1)
- `GA_MEASUREMENT_ID` / `SEARCH_CONSOLE_TOKEN` (opcionais)
- `IG_BUSINESS_ID`, `IG_ACCESS_TOKEN` (Instagram)

## CI
Workflow GitHub Actions (`.github/workflows/ci.yml`) executa:
1. Instala dependências (root + frontend)
2. Testes backend (Jest) + cobertura
3. Build frontend
4. (Placeholder) Lint

## Readiness em Produção (Exemplo de uso)
Probe Kubernetes / Docker healthcheck:
```
GET /api/readiness -> 200 (ready) / 503 (degraded)
```
Recomendado: configurar orquestrador para só enviar tráfego após 200.

## Próximos (Operacional)
- (Opcional) Exportar métricas Prometheus
- (Opcional) Alerta email/Telegram para disco > threshold
- (Opcional) Limpeza de uploads antigos não referenciados

## Deploy (Render)
`render.yaml` está configurado para rodar o Publisher com `node server.js`. Configure as envs no painel da Render.
