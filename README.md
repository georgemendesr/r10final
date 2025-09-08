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
- Backend (Jest) reservado, sem testes por padrão na raiz

## Deploy (Render)
`render.yaml` está configurado para rodar o Publisher com `node server.js`. Configure as envs no painel da Render.
