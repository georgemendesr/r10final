# Documentação da API (Versão Atual)

Autenticação via Bearer JWT em `Authorization`. Refresh token via cookie httpOnly (`refresh_token`).

## Sumário
- Auth & Sessão
- Usuários
- Perfil Próprio
- Recuperação de Senha
- Categorias
- Banners
- Posts (sanitizados)
- Social Insights (Meta Graph)
- Social Metrics Persistidas
- Site Analytics (First-Party)
- Health
- Migrations (execução indireta)

## Convenções Gerais
- `createdAt`/`updatedAt` formato ISO8601.
- Erros: `{ error: string }` (mensagens em português).
- Paginação não implementada onde não indicado (retorna lista completa).
- Todas as rotas (exceto login, refresh, password reset request/confirm e algumas públicas) exigem autenticação.

---
## Auth & Sessão
### POST /api/auth/login
Body: `{ email, password }`
Resposta 200: `{ accessToken, user: { id,name,email,role,avatar } }`
Set-Cookie: `refresh_token`
Erros: 400 credenciais ausentes, 401 inválidas.

### POST /api/auth/refresh
Renova access token usando cookie refresh_token. Resposta igual login (sem reenviar user se já disponível). Erros: 401 se inválido/expirado.

### POST /api/auth/logout
Invalida refresh token atual. Limpa cookie.

---
## Usuários (Admin)
### GET /api/users
Retorna `{ items: [ {id,name,email,role,avatar,createdAt} ], total }`

### POST /api/auth/register (Admin)
Body: `{ name, email, password, role?, avatar? }` (password >= 8). Resposta 201: usuário criado.

### PUT /api/users/:id (Admin)
Atualiza outro usuário (name, role, avatar). Proteção: não permite rebaixar último admin.

### DELETE /api/users/:id (Admin)
Remove usuário (bloqueio futuro: evitar remoção último admin - atualmente apenas checado para downgrade de role).

---
## Perfil Próprio
### GET /api/auth/me
Retorna dados do usuário logado.

### PUT /api/auth/me
Body: `{ name?, avatar? }` (avatar validado via função `validateAvatarInput`).

---
## Recuperação de Senha
### POST /api/auth/request-reset
Body: `{ email }` -> sempre `{ ok: true }` (não revela existência).
Cria token em `password_resets`.

### POST /api/auth/confirm-reset
Body: `{ token, newPassword }` (mínimo 8). Invalida token e atualiza hash.

---
## Categorias (Admin)
### GET /api/categories?type=
Filtra por `editorial|municipality|special` (opcional).

### POST /api/categories
Body: `{ name, color?, type }`

### DELETE /api/categories/:id
Remove categoria.

---
## Banners (Admin)
### GET /api/banners
Retorna lista completa.

### POST /api/banners
Body principal (campos chave): `{ titulo, posicao, tipo, status, ... }`.

### PUT /api/banners/:id
Atualiza campos permitidos.

### DELETE /api/banners/:id
Remove banner.

### POST /api/banners/:id/impressao
Incrementa impressão.

### POST /api/banners/:id/clique
Incrementa clique.

---
## Posts
(Seção base - detalhes completos podem ser expandidos futuramente)
HTML sanitizado em criação/edição (limite ~300KB). Campos esperados: título, corpo, categorias, destaque, etc.
Rotas típicas: `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`.

---
## Social Insights (Tempo Real)
### GET /api/social/insights
Requer IG + FB configurados. Retorna métricas agregadas (reach, impressions, followers, engaged/impressions unique fallback). Cache interno (~60s) e supressão de métrica inválida repetitiva.

### GET /api/social/insights/debug (Admin)
Retorna indicadores de configuração sem expor token.

---
## Social Metrics Persistidas
### POST /api/social/metrics/snapshot (Admin / futuro)
(Não implementado ainda) – persistir métricas diárias em `social_metrics`.

### GET /api/social/metrics (Futuro)
Listagem agregada das métricas históricas.

---
## Site Analytics (First-Party)
### POST /api/site/analytics/event
Registra pageview (interno/JS cliente). Sanitiza e agrega.

### GET /api/site/analytics/summary?days=7
Retorna `{ generatedAt, period, source, metrics: { pageviews, sessions, users }, topPages }`.

---
## Health
### GET /api/health
Exemplo:
```
{
  "status": "ok",
  "uptimeMs": 123456,
  "db": {"ok": true, "latencyMs": 2, "counts": { usuarios: 5, banners: 12, categories: 6 } },
  "cache": {...},
  "social": { cacheHits: 3, cacheMiss: 1 },
  "memory": { rss: 12345678, heapUsed: 4567890 },
  "pid": 1234
}
```

---
## Migrations
Aplicação automática se variável `RUN_MIGRATIONS=1` ao subir o servidor ou manual via:
```
npm run migrate
```
Tabela de controle: `migrations_applied(name, applied_at)`.

---
## Códigos de Erro Comuns
- 400: parâmetros inválidos / ausentes
- 401: não autenticado ou token inválido
- 403: proibido (role insuficiente)
- 404: recurso não encontrado
- 409: conflito (email já cadastrado)
- 429: rate limit (login)
- 500: erro interno
- 501: integração externa não configurada

---
## Roadmap Próximo
- Endpoint `/api/metrics` (observabilidade interna)
- Paginação padronizada
- Documentação detalhada de Posts (payload completo)
- Endpoints históricos social_metrics
- Testes automatizados (Jest/supertest)

---
_Atualize este documento sempre que novos endpoints forem adicionados ou a estrutura de resposta mudar._
