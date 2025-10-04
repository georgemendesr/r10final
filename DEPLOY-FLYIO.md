# Deploy R10 Piauí no Fly.io

## Pré-requisitos
1. Conta no Fly.io (gratuita)
2. Flyctl CLI instalado

## Instalação do Flyctl

### Windows (PowerShell como Admin):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### Linux/Mac:
```bash
curl -L https://fly.io/install.sh | sh
```

## Deploy em 5 passos

### 1. Login
```bash
fly auth login
```

### 2. Criar app (primeira vez apenas)
```bash
fly apps create r10-piaui --region gru
```

### 3. Criar volume persistente (para SQLite)
```bash
fly volumes create r10_data --region gru --size 1
```

### 4. Configurar secrets (variáveis sensíveis)
```bash
fly secrets set \
  JWT_SECRET="seu-jwt-secret-aqui" \
  GROQ_API_KEY="sua-chave-groq" \
  INSTAGRAM_ACCESS_TOKEN="seu-token-instagram"
```

### 5. Deploy
```bash
fly deploy
```

Pronto! Seu portal estará em: https://r10-piaui.fly.dev

## Comandos úteis

### Ver logs em tempo real
```bash
fly logs
```

### Abrir app no navegador
```bash
fly open
```

### Ver status
```bash
fly status
```

### Escalar recursos (se precisar)
```bash
fly scale memory 2048
```

### Acessar console do container
```bash
fly ssh console
```

## Atualizações futuras
Basta fazer git push e rodar:
```bash
fly deploy
```

## Domínio customizado
```bash
fly certs add seudominio.com
```
Depois configure DNS A record apontando para o IP do Fly.io.

## Custos
- Plano gratuito: 3 apps, 256MB RAM cada
- Se precisar mais: ~$2/mês por app adicional

## Troubleshooting

### Se build falhar (memória):
Adicione no fly.toml:
```toml
[build]
  builder = "paketobuildpacks/builder:base"
```

### Se SQLite travar:
Verifique se o volume está montado:
```bash
fly volumes list
```

### Logs não aparecem:
```bash
fly logs --app r10-piaui
```
