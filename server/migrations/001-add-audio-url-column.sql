-- Migração: Adicionar coluna audio_url à tabela tts_cache
-- Data: 2025-10-09
-- Motivo: Migração de filesystem local para Cloudinary

-- Adicionar coluna audio_url (se não existir)
ALTER TABLE tts_cache ADD COLUMN audio_url TEXT;

-- Adicionar coluna cloudinary_public_id (se não existir)
ALTER TABLE tts_cache ADD COLUMN cloudinary_public_id TEXT;

-- Migrar dados antigos (se houver): copiar audio_filename para audio_url temporariamente
-- Isso não será útil, mas evita NULL
UPDATE tts_cache SET audio_url = '/uploads/tts-cache/' || audio_filename WHERE audio_url IS NULL AND audio_filename IS NOT NULL;

-- Limpar registros que não têm URL válida do Cloudinary (filesystem local)
DELETE FROM tts_cache WHERE audio_url LIKE '/uploads/tts-cache/%' OR audio_url IS NULL;
