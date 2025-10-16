# 🎙️ Azure Text-to-Speech - Guia Completo de Configuração

## 📋 Índice
1. [Criar Recurso no Azure](#1-criar-recurso-no-azure)
2. [Obter Credenciais](#2-obter-credenciais)
3. [Configurar o Projeto](#3-configurar-o-projeto)
4. [Integrar com o Backend](#4-integrar-com-o-backend)
5. [Testar o Serviço](#5-testar-o-serviço)
6. [Integrar no Frontend](#6-integrar-no-frontend)
7. [Custos e Limites](#7-custos-e-limites)

---

## 1️⃣ Criar Recurso no Azure

### Passo a Passo no Portal Azure:

1. **Acesse o Portal Azure**
   - Vá para: https://portal.azure.com
   - Faça login com sua conta

2. **Criar Recurso Speech**
   - Clique em **"Criar um recurso"** (canto superior esquerdo)
   - Na barra de pesquisa, digite: **"Speech"** ou **"Fala"**
   - Selecione **"Speech Services"** (Serviços de Fala)
   - Clique em **"Criar"**

3. **Preencher Configurações:**

   ```
   Detalhes do Projeto:
   ├── Assinatura: [Sua assinatura Azure]
   └── Grupo de recursos: rg-r10-piaui (ou crie novo)

   Detalhes da Instância:
   ├── Região: Brazil South (recomendado) ou East US
   ├── Nome: r10-tts-service
   └── Nível de preços: 
       ├── F0 (Gratuito) - 5 horas/mês
       └── S0 (Standard) - Pay as you go
   ```

4. **Revisar e Criar**
   - Clique em **"Revisar + criar"**
   - Aguarde validação
   - Clique em **"Criar"**
   - Aguarde deployment (1-2 minutos)

---

## 2️⃣ Obter Credenciais

Após o deployment ser concluído:

1. **Ir para o Recurso**
   - Clique em **"Ir para o recurso"**
   - Ou vá em "Todos os recursos" e selecione `r10-tts-service`

2. **Copiar Chave e Região**
   - No menu lateral, clique em **"Chaves e Ponto de Extremidade"**
   - Você verá:
     ```
     KEY 1: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     KEY 2: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     LOCATION/REGION: brazilsouth (ou eastus)
     ```
   - **Copie a KEY 1** (clique no ícone de copiar)
   - **Anote a REGION** (ex: `brazilsouth`)

---

## 3️⃣ Configurar o Projeto

### A. Atualizar Arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e atualize:

```properties
# === Azure Text-to-Speech ===
AZURE_SPEECH_KEY=COLE_SUA_CHAVE_AQUI
AZURE_SPEECH_REGION=brazilsouth
AZURE_SPEECH_VOICE=pt-BR-AntonioNeural
```

**Vozes Disponíveis em Português:**
- `pt-BR-AntonioNeural` - Voz masculina (recomendado para notícias)
- `pt-BR-FranciscaNeural` - Voz feminina
- `pt-BR-ThalitaNeural` - Voz feminina jovem
- `pt-BR-BrendaNeural` - Voz feminina

### B. Pacotes já instalados ✅
```bash
✅ microsoft-cognitiveservices-speech-sdk - Instalado
```

---

## 4️⃣ Integrar com o Backend

### A. Adicionar Coluna no Banco de Dados

Execute no SQLite (ou adicione migration):

```sql
ALTER TABLE noticias ADD COLUMN audio_url TEXT;
ALTER TABLE noticias ADD COLUMN audio_duration REAL;
```

### B. Importar Rotas no `server-api-simple.cjs`

Localize o arquivo `server/server-api-simple.cjs` e adicione:

```javascript
// Importar rotas TTS (adicione no topo com outros imports)
const ttsRoutes = require('./ttsRoutes.cjs');

// Registrar rotas (adicione com outras rotas, ex: após rotas de posts)
app.use('/api/tts', ttsRoutes);

// Garantir que o diretório de áudio existe
const audioDir = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('[TTS] Diretório de áudio criado:', audioDir);
}
```

### C. Passar instância do DB para as rotas

No `server-api-simple.cjs`, antes de registrar as rotas:

```javascript
// Disponibilizar DB para as rotas TTS
app.locals.db = db;
```

---

## 5️⃣ Testar o Serviço

### A. Verificar Status

```bash
curl http://localhost:3002/api/tts/status
```

**Resposta esperada:**
```json
{
  "configured": true,
  "region": "brazilsouth",
  "voice": "pt-BR-AntonioNeural",
  "message": "Serviço TTS configurado e pronto"
}
```

### B. Listar Vozes Disponíveis

```bash
curl http://localhost:3002/api/tts/voices
```

### C. Gerar Áudio de Teste

```bash
curl -X POST http://localhost:3002/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Esta é uma notícia de teste do R10 Piauí. O sistema de text-to-speech está funcionando perfeitamente!",
    "titulo": "Teste de Áudio"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "audioUrl": "/uploads/audio/audio-1729095123456.mp3",
  "duration": 8.5,
  "fileSize": 136000,
  "message": "Áudio gerado com sucesso"
}
```

### D. Gerar Áudio para Matéria Existente

```bash
curl -X POST http://localhost:3002/api/tts/generate-post/1
```

---

## 6️⃣ Integrar no Frontend

### A. Adicionar Botão no `PostForm.tsx`

```tsx
import { Mic } from 'lucide-react';

// No componente PostForm
const [generatingAudio, setGeneratingAudio] = useState(false);
const [audioUrl, setAudioUrl] = useState<string | null>(null);

const handleGenerateAudio = async () => {
  if (!post.conteudo || post.conteudo.length < 100) {
    setError('Conteúdo muito curto para gerar áudio');
    return;
  }

  try {
    setGeneratingAudio(true);
    setError(null);

    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: post.conteudo,
        titulo: post.titulo,
        postId: postId
      })
    });

    const data = await response.json();

    if (data.success) {
      setAudioUrl(data.audioUrl);
      successFlash(`Áudio gerado! Duração: ${data.duration.toFixed(1)}s`);
    } else {
      setError(data.error || 'Erro ao gerar áudio');
    }
  } catch (e) {
    setError('Erro ao gerar áudio');
  } finally {
    setGeneratingAudio(false);
  }
};

// No JSX, adicionar botão:
<button
  onClick={handleGenerateAudio}
  disabled={generatingAudio || !post.conteudo}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
>
  {generatingAudio ? (
    <RefreshCw className="w-4 h-4 animate-spin" />
  ) : (
    <Mic className="w-4 h-4" />
  )}
  Gerar Áudio
</button>

{audioUrl && (
  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-sm font-medium text-green-800 mb-2">✅ Áudio gerado com sucesso!</p>
    <audio controls className="w-full">
      <source src={audioUrl} type="audio/mpeg" />
      Seu navegador não suporta áudio.
    </audio>
  </div>
)}
```

### B. Adicionar Player na Página da Matéria

No `ArticlePage.tsx`:

```tsx
{post.audioUrl && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div className="flex items-center gap-2 mb-2">
      <Mic className="w-5 h-5 text-blue-600" />
      <h3 className="font-semibold text-blue-900">Ouça esta matéria</h3>
    </div>
    <audio controls className="w-full">
      <source src={post.audioUrl} type="audio/mpeg" />
      Seu navegador não suporta reprodução de áudio.
    </audio>
  </div>
)}
```

---

## 7️⃣ Custos e Limites

### Plano Gratuito (F0)
- ✅ **5 horas de áudio/mês** (grátis)
- ✅ Vozes neurais incluídas
- ✅ Todas as funcionalidades
- ⚠️ Após 5h, serviço é bloqueado até próximo mês

### Plano Standard (S0)
- 💰 **$1 por 1M caracteres** (Neural)
- 💰 **$4 por 1M caracteres** (Custom Neural)
- 📊 **Estimativa para R10:**
  - Matéria média: 500 palavras = ~3.000 caracteres
  - 333 matérias = $1
  - **Custo mensal estimado: $5-10** (para 1.500-3.000 matérias)

### Calculadora de Custos
```
1 matéria (3.000 chars) = $0.003
100 matérias/dia = $0.30/dia = $9/mês
50 matérias/dia = $0.15/dia = $4.5/mês
```

---

## 8️⃣ Próximos Passos

### Automatização
1. ✅ Gerar áudio automaticamente ao publicar matéria
2. ✅ Armazenar URL no banco de dados
3. ✅ Exibir player em todas as matérias com áudio

### Otimizações
1. Cache de áudios gerados
2. Compressão de arquivos MP3
3. CDN para distribuição (Cloudinary)
4. Webhook para processamento assíncrono

### Analytics
1. Rastrear reproduções de áudio
2. Tempo médio de escuta
3. Taxa de conclusão

---

## 🆘 Troubleshooting

### Erro: "AZURE_SPEECH_KEY não configurada"
**Solução:** Verifique se o `.env` está na raiz do projeto e reinicie o servidor.

### Erro: "Invalid subscription key"
**Solução:** Verifique se copiou a chave corretamente do Azure Portal.

### Erro: "Region not supported"
**Solução:** Use `brazilsouth` ou `eastus`. Verifique a região no Azure Portal.

### Áudio não é gerado
**Solução:** 
1. Verifique os logs do servidor
2. Teste a rota `/api/tts/status`
3. Verifique se o diretório `/uploads/audio` existe

### Áudio com qualidade ruim
**Solução:** 
1. Use vozes Neural (ex: `pt-BR-AntonioNeural`)
2. Verifique se o texto está limpo (sem HTML)
3. Ajuste a velocidade no SSML (prosody rate)

---

## 📞 Suporte

- **Documentação Azure:** https://docs.microsoft.com/azure/cognitive-services/speech-service/
- **Vozes disponíveis:** https://docs.microsoft.com/azure/cognitive-services/speech-service/language-support
- **SSML Reference:** https://docs.microsoft.com/azure/cognitive-services/speech-service/speech-synthesis-markup

---

**✅ Configuração Concluída!**

Agora você tem um sistema completo de Text-to-Speech integrado ao R10 Piauí usando Azure Cognitive Services.
