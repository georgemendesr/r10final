# Deploy no Fly.io (API + Instagram + Frontend)

Tempo aproximado: 7–10 minutos.

## 1. Instalar CLI
```
curl -L https://fly.io/install.sh | sh
```

## 2. Login / Criação
```
fly auth signup   # ou fly auth login
```

## 3. Inicializar sem deploy imediato
```
fly launch --no-deploy --name r10-full
```
Se o Fly alterar o nome do app, edite `fly.toml` (linha `app = ...`).

## 4. (Opcional) Volume para SQLite
```
fly volumes create r10_data --size 3 -r gru
```
Descomente bloco [[mounts]] no `fly.toml` e (se suportado) use secret `SQLITE_DB_PATH=/app/data/noticias.db`.

## 5. Secrets (NUNCA coloque chaves direto no fly.toml)
```
fly secrets set \
  JWT_SECRET="SUA_CHAVE_GRANDE" \
  IG_ACCESS_TOKEN="..." IG_BUSINESS_ID="..." \
  GROQ_API_KEY="..." PUBLIC_BASE_URL="https://SEU_DOMINIO" \
  # Adicione outras do .env.example se necessário
```

## 6. Deploy
```
fly deploy
```
O build vai: instalar deps, buildar frontend, copiar `dist`, remover devDeps e publicar.

## 7. Testes pós-deploy
- API: `https://SEU_APP.fly.dev/api/health`
- Instagram: `https://SEU_APP.fly.dev:8080/health` (ou via serviço separado)

## 8. Escalar memória (Puppeteer / canvas)
```
fly scale memory 1024
```

## 9. Logs e diagnóstico
```
fly logs
fly status
fly ssh console
```

## 10. Atualizações futuras
```
git push (atualiza código local)
fly deploy
```

## 11. Remover processo Instagram (se quiser app dedicado depois)
Edite `fly.toml`, remova processo `instagram` + segundo bloco [[services]] e rode `fly deploy`. Crie novo app só para `server.js` se desejar isolamento.

## 12. Rollback
```
fly releases
fly deploy --image <imagem_antiga>
```

Pronto. Tudo unificado em um único app Fly.io.
