# Dockerfile para R10 Piauí - Deploy Fly.io
FROM node:18-slim

# Instalar dependências do sistema para canvas e puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Variáveis para Puppeteer usar Chromium do sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Build do frontend (se necessário)
RUN cd r10-front_full_07ago && npm ci && npm run build && cd .. && cp -r r10-front_full_07ago/dist ./dist || true

# Criar diretório para dados persistentes
RUN mkdir -p /data

# Expor porta
EXPOSE 8080

# Comando de inicialização
CMD ["node", "server/server-api-simple.cjs"]
