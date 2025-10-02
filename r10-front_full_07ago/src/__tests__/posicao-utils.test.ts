import { describe, expect, it } from 'vitest';
import { getPosicaoAliases, normalizePosicao, toCanonicalLabel } from '../utils/posicao';

describe('utils/posicao', () => {
  it('normaliza aliases para valores canônicos', () => {
    expect(normalizePosicao('Super Manchete')).toBe('supermanchete');
    expect(normalizePosicao('destaque secundário')).toBe('destaque');
    expect(normalizePosicao('Home Grid')).toBe('geral');
  });

  it('remove acentos e trata valores vazios como geral', () => {
    expect(normalizePosicao('Municípios')).toBe('municipios');
    expect(normalizePosicao('   ')).toBe('geral');
    expect(normalizePosicao(undefined)).toBe('geral');
  });

  it('retorna aliases conhecidos por posição', () => {
    expect(getPosicaoAliases('supermanchete')).toContain('super-manchete');
    expect(getPosicaoAliases('destaque')).toContain('destaque-principal');
    expect(getPosicaoAliases('geral')).toContain('geral');
  });

  it('converte canônico em rótulo amigável', () => {
    expect(toCanonicalLabel('supermanchete')).toBe('SUPER MANCHETE');
    expect(toCanonicalLabel('destaque')).toBe('DESTAQUE');
    expect(toCanonicalLabel('municipios')).toBe('MUNICIPIOS');
    expect(toCanonicalLabel('qualquer-coisa')).toBe('GERAL');
  });
});
