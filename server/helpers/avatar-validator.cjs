// Validador de avatar reutilizável
// Regras: null mantém/limpa, string URL http(s) até 500 chars, base64 data URL imagem até 200KB, qualquer outra coisa rejeita.
const MAX_LEN = 500;
const MAX_DATA_URL_BYTES = 200 * 1024; // 200KB

function validateAvatarInput(input) {
  if (input === null) return { ok: true, value: null };
  if (input === undefined) return { ok: true, value: undefined };
  if (typeof input !== 'string') return { ok: false, error: 'avatar inválido (tipo)' };
  const s = input.trim();
  if (!s) return { ok: true, value: null };
  if (s.length > MAX_LEN) return { ok: false, error: 'avatar muito longo' };
  // Data URL
  if (s.startsWith('data:image/')) {
    const commaIdx = s.indexOf(',');
    if (commaIdx === -1) return { ok: false, error: 'data URL inválida' };
    const b64 = s.slice(commaIdx + 1);
    try {
      const buf = Buffer.from(b64, 'base64');
      if (buf.length > MAX_DATA_URL_BYTES) return { ok: false, error: 'imagem base64 muito grande (>200KB)' };
    } catch(_) { return { ok: false, error: 'base64 inválido' }; }
    return { ok: true, value: s };
  }
  // URL http(s)
  if (/^https?:\/\//i.test(s)) {
    return { ok: true, value: s };
  }
  return { ok: false, error: 'avatar deve ser URL http(s) ou data URL imagem' };
}

module.exports = { validateAvatarInput };
