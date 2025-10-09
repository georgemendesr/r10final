# Migração TTS: Filesystem Local → Cloudinary

**Data:** 2025-06-01  
**Commit:** 7018e46  
**Status:** ✅ Implementado

## 🎯 Problema Resolvido

Sistema TTS gerava áudios com ElevenLabs e salvava no filesystem local (`/uploads/tts-cache/`), mas no Render.com os arquivos eram perdidos devido ao **filesystem efêmero**.

### Sintomas Observados
- ✅ Backend gerava MP3 com sucesso (logs: "✅ TTS gerado com ElevenLabs")
- ✅ Cache SQLite salvava metadata corretamente
- ❌ Acessar URL do áudio retornava HTML da app React (não o MP3)
- ❌ Frontend não conseguia reproduzir áudios gerados

**Causa Raiz:** Render reinicia containers e perde todos os arquivos locais

## ✅ Solução Implementada

### 1. Migração de Armazenamento

**ANTES:**
```javascript
// ❌ Salvava no filesystem local (perdido no Render)
const filePath = path.join(TTS_CACHE_DIR, filename);
fs.writeFileSync(filePath, audioBuffer);
const audioUrl = `/uploads/tts-cache/${filename}`;
```

**DEPOIS:**
```javascript
// ✅ Upload direto para Cloudinary CDN
const { uploadAudioToCloudinary } = require('./cloudinary-config.cjs');
const cloudinaryResult = await uploadAudioToCloudinary(audioBuffer, filename);
const audioUrl = cloudinaryResult.secure_url; // https://res.cloudinary.com/...
```

### 2. Novas Funções Cloudinary

**Arquivo:** `server/cloudinary-config.cjs`

```javascript
// Upload de áudio MP3
async function uploadAudioToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'r10-piaui/tts-audio',
        public_id: filename.replace(/\.[^.]+$/, ''),
        resource_type: 'video', // 'video' suporta áudio
        format: 'mp3'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// Deletar áudio expirado
async function deleteAudioFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(`r10-piaui/tts-audio/${publicId}`, {
    resource_type: 'video'
  });
}
```

### 3. Atualização do Schema SQLite

**ANTES:**
```sql
CREATE TABLE tts_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  audio_filename TEXT NOT NULL,  -- ❌ Nome do arquivo local
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  file_size INTEGER,
  UNIQUE(post_id)
)
```

**DEPOIS:**
```sql
CREATE TABLE tts_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  audio_url TEXT NOT NULL,          -- ✅ URL completa do Cloudinary
  cloudinary_public_id TEXT,        -- ✅ ID para deletar depois
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  file_size INTEGER,
  UNIQUE(post_id)
)
```

### 4. Limpeza de Cache Expirado

**ANTES:**
```javascript
// ❌ Deletava arquivo local
fs.unlinkSync(filePath);
```

**DEPOIS:**
```javascript
// ✅ Deleta do Cloudinary
const { deleteAudioFromCloudinary } = require('./cloudinary-config.cjs');
await deleteAudioFromCloudinary(record.cloudinary_public_id);
```

## 📊 Impacto

### Benefícios
- ✅ Áudios TTS persistem entre restarts do Render
- ✅ Cache de 30 dias funciona corretamente
- ✅ URLs acessíveis via HTTPS (Cloudinary CDN)
- ✅ Mesma solução já validada para imagens
- ✅ Não há mudanças no frontend (URLs transparentes)

### Limites Cloudinary
- **Plano Free:** 10GB de storage video/audio por mês
- **Formato:** MP3 (~1-2MB por notícia)
- **Estimativa:** ~5.000-10.000 áudios por mês no plano free

### Otimizações de Custo
1. ✅ Cache de 30 dias evita regerar áudios
2. ✅ Cleanup automático deleta expirados do Cloudinary
3. ✅ Apenas super-manchetes/destaques usam ElevenLabs
4. ✅ Notícias comuns usam Web Speech API (grátis)

## 🧪 Como Testar

### Local
1. Certificar que `CLOUDINARY_*` estão no `.env`
2. Reiniciar backend: `npm run dev:backend`
3. Criar super-manchete com TTS
4. Verificar logs: "✅ TTS gerado com ElevenLabs e enviado para Cloudinary"
5. Acessar URL do áudio (deve ser https://res.cloudinary.com/...)
6. Reproduzir no player

### Produção (Render)
1. Variáveis já configuradas no Render Dashboard
2. Deploy automático via GitHub push
3. Testar com super-manchete existente
4. Confirmar áudio reproduz após vinheta
5. Recarregar página → áudio deve vir do cache

## 🔄 Migração de Dados

**Script criado:** `limpar-cache-tts-antigo.cjs`

```bash
node limpar-cache-tts-antigo.cjs
```

**Ação:** Remove registros antigos sem `cloudinary_public_id` (filesystem local)

**Status:** Não necessário rodar - tabela `tts_cache` será criada do zero na próxima inicialização do backend.

## 📝 Arquivos Modificados

1. `server/server-api-simple.cjs` (linhas 3690-3850)
   - Removido criação do diretório `TTS_CACHE_DIR`
   - Substituído `fs.writeFileSync()` por `uploadAudioToCloudinary()`
   - Atualizado schema da tabela `tts_cache`
   - Modificado `cleanExpiredTTSCache()` para usar `deleteAudioFromCloudinary()`

2. `server/cloudinary-config.cjs` (linhas 60-110)
   - Adicionado `uploadAudioToCloudinary(buffer, filename)`
   - Adicionado `deleteAudioFromCloudinary(publicId)`
   - Exportado novas funções

3. `limpar-cache-tts-antigo.cjs` (novo)
   - Script de migração para limpar cache antigo
   - Opcional: só necessário se houver registros pré-migração

## 🚀 Próximos Passos

1. ✅ **CONCLUÍDO:** Migrar armazenamento para Cloudinary
2. 🔄 **TESTING:** Testar em produção com super-manchete real
3. ⏳ **PENDING:** Monitorar uso de storage no Cloudinary Dashboard
4. ⏳ **PENDING:** Ajustar tempo de cache se necessário (30 dias → 15 dias?)
5. ⏳ **PENDING:** Considerar compressão de áudio se storage estourar

## 🐛 Troubleshooting

### Áudio não gera
- Verificar `ELEVENLABS_API_KEY` no Render
- Verificar logs: `🎤 Gerando TTS com ElevenLabs para post {id}...`
- Confirmar que notícia é super-manchete/destaque

### Áudio não reproduz
- Abrir URL do áudio no navegador (deve ser Cloudinary, não localhost)
- Verificar console do navegador (erros CORS?)
- Confirmar que vinheta toca antes

### Cache não funciona
- Verificar tabela `tts_cache` tem registros
- Confirmar `expires_at > NOW()`
- Logs devem mostrar: `✅ TTS em cache: https://res.cloudinary.com/...`

### Storage Cloudinary cheio
- Rodar `cleanExpiredTTSCache()` manualmente
- Reduzir tempo de cache para 15 dias
- Avaliar upgrade para plano pago

---

**Autor:** GitHub Copilot  
**Revisão:** George Mendes
