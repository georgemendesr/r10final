// utils/posicao.ts - Normalização de posições para compatibilidade
export const POS_ALIASES: Record<string,string[]> = {
  supermanchete: ['supermanchete','super-manchete','super manchete','super','manchete-principal'],
  destaque: ['destaque','destaque-principal','destaque-secundario','destaque principal','destaque secundario','manchete-principal'],
  geral: ['geral','destaque-inferior','destaque-slideshow','lateral','home-grid','noticia-comum'],
};

export function normalizePosicao(x: string | null | undefined): string {
  const s = (x ?? '').normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase().trim().replace(/\s+/g,'-');
  
  // mapeia para canônico se cair num alias
  for (const [canon, aliases] of Object.entries(POS_ALIASES)) {
    if (aliases.includes(s)) return canon;
  }
  return s || 'geral';
}

export function getPosicaoAliases(canonical: 'supermanchete'|'destaque'|'geral'): string[] {
  return POS_ALIASES[canonical] || [canonical];
}

// Converte o canônico minúsculo para o rótulo usado na UI/tipos (maiúsculo e com espaço)
export function toCanonicalLabel(canon: string): 'SUPER MANCHETE' | 'DESTAQUE' | 'GERAL' | 'MUNICIPIOS' {
  switch ((canon || '').toLowerCase()) {
    case 'supermanchete':
    case 'super-manchete':
      return 'SUPER MANCHETE';
    case 'destaque':
    case 'manchete-principal':
    case 'destaque-principal':
    case 'destaque-secundario':
      return 'DESTAQUE';
    case 'municipios':
      return 'MUNICIPIOS';
    case 'geral':
    default:
      return 'GERAL';
  }
}
