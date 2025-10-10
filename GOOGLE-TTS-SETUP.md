# 🎤 Configurar Google Cloud Text-to-Speech

## 1. Criar Conta Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie uma conta (ou use existente)
3. **Tier Gratuito**: 1 milhão de caracteres/mês GRÁTIS (vozes Standard)
4. WaveNet: 1 milhão grátis no primeiro mês, depois $16/1M chars

## 2. Criar Projeto

1. No Console, clique em "Select a project" (topo)
2. Clique em "NEW PROJECT"
3. Nome: `r10-tts` (ou outro nome)
4. Clique em "CREATE"

## 3. Ativar API Text-to-Speech

1. No menu lateral → "APIs & Services" → "Library"
2. Busque: `Text-to-Speech API`
3. Clique na API
4. Clique em "ENABLE"

## 4. Criar Service Account (Conta de Serviço)

1. No menu lateral → "IAM & Admin" → "Service Accounts"
2. Clique em "CREATE SERVICE ACCOUNT"
3. Nome: `r10-tts-service`
4. Description: `Service account for R10 TTS`
5. Clique em "CREATE AND CONTINUE"
6. Role: Selecione "Cloud Text-to-Speech API User"
7. Clique em "CONTINUE" → "DONE"

## 5. Baixar Chave JSON

1. Na lista de Service Accounts, clique nos 3 pontos da conta criada
2. Selecione "Manage keys"
3. Clique em "ADD KEY" → "Create new key"
4. Tipo: **JSON**
5. Clique em "CREATE"
6. Um arquivo JSON será baixado (ex: `r10-tts-398abc123def.json`)

## 6. Instalar no Projeto

### Local (Desenvolvimento):

1. Copie o arquivo JSON baixado para `server/google-tts-key.json`
2. Adicione ao `.env`:
   ```bash
   GOOGLE_TTS_ENABLED=true
   GOOGLE_APPLICATION_CREDENTIALS=./server/google-tts-key.json
   GOOGLE_TTS_VOICE=pt-BR-Wavenet-A
   ```

3. **IMPORTANTE**: Adicione ao `.gitignore`:
   ```
   server/google-tts-key.json
   ```

### Produção (Render.com):

1. Abra o arquivo JSON em um editor de texto
2. Copie TODO o conteúdo
3. No Render Dashboard → seu serviço → "Environment"
4. Adicione variável:
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Cole o JSON inteiro (com quebras de linha e tudo)

5. Adicione outras variáveis:
   ```
   GOOGLE_TTS_ENABLED=true
   GOOGLE_TTS_VOICE=pt-BR-Wavenet-A
   ```

6. No código do backend, adicione lógica para carregar do JSON string:
   ```javascript
   const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
   if (credentialsJson) {
     const credentials = JSON.parse(credentialsJson);
     googleTtsClient = new textToSpeech.TextToSpeechClient({ credentials });
   }
   ```

## 7. Testar

1. Reinicie o servidor
2. Verifique logs: `✅ Google Cloud TTS configurado`
3. Acesse uma notícia
4. Clique no player TTS
5. Deve tocar com voz do Google Cloud

## 8. Vozes Disponíveis PT-BR

### WaveNet (Qualidade Alta - GRÁTIS 1M chars):
- `pt-BR-Wavenet-A` - Feminina (RECOMENDADA)
- `pt-BR-Wavenet-B` - Masculina
- `pt-BR-Wavenet-C` - Feminina

### Standard (Qualidade Boa - GRÁTIS 1M chars):
- `pt-BR-Standard-A` - Feminina
- `pt-BR-Standard-B` - Masculina
- `pt-BR-Standard-C` - Feminina

### Neural2 (Qualidade Máxima - $16/1M chars):
- `pt-BR-Neural2-A` - Feminina
- `pt-BR-Neural2-B` - Masculina
- `pt-BR-Neural2-C` - Feminina

## 9. Monitorar Uso

1. Google Cloud Console → "Billing" → "Reports"
2. Filtrar por "Cloud Text-to-Speech API"
3. Ver quantos caracteres foram usados

## 10. Custos Estimados

### Cenário 1: Site Pequeno
- 100 notícias/mês × 3.000 chars = 300k chars
- **Custo**: $0 (dentro do tier gratuito)

### Cenário 2: Site Médio
- 500 notícias/mês × 3.000 chars = 1.5M chars
- **Custo**: $0 (WaveNet grátis até 1M) + $2 (500k extras × $4/1M)
- **Total**: ~$2/mês

### Cenário 3: Site Grande
- 2.000 notícias/mês × 3.000 chars = 6M chars
- **Custo**: $20/mês (WaveNet)
- **Economia vs ElevenLabs**: ~70%

## 11. Troubleshooting

### Erro: "PERMISSION_DENIED"
- Verifique se a API está habilitada
- Verifique se a Service Account tem a role correta

### Erro: "INVALID_ARGUMENT"
- Verifique o nome da voz (deve ser exatamente como listado)
- Verifique se o idioma é `pt-BR`

### Logs: "Google TTS não configurado"
- Verifique se o arquivo JSON existe no caminho correto
- Verifique se `GOOGLE_TTS_ENABLED=true` no .env

## 12. Comparação ElevenLabs vs Google TTS

| Aspecto | ElevenLabs | Google Cloud TTS |
|---------|------------|------------------|
| **Qualidade** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐ Muito Boa |
| **Naturalidade** | Muito natural | Natural |
| **Custo** | Caro (tier limitado) | Barato (1M grátis) |
| **Tier Gratuito** | ~10k chars/mês | 1M chars/mês |
| **Latência** | ~45s | ~5-10s |
| **Vozes PT-BR** | Várias | 9 vozes |

## 🎯 Recomendação

Use **Google Cloud TTS WaveNet** para:
- ✅ Economia (1M chars grátis)
- ✅ Qualidade alta
- ✅ Latência menor
- ✅ Escalabilidade

Reserve **ElevenLabs** apenas para:
- Super-manchetes principais (1-2/dia)
- Quando qualidade máxima é crítica
