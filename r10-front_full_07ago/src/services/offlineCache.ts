// src/services/offlineCache.ts
import { Post } from '../types/Post';

// Chave para o localStorage - usando a versão 5 conforme solicitado
export const LS_KEY = 'r10.offline.posts2025.v5';

/**
 * Lê todos os posts do cache offline
 */
export function readAllOffline(): Post[] {
  try { 
    const data = JSON.parse(localStorage.getItem(LS_KEY) || '{"items":[]}');
    return Array.isArray(data.items) ? data.items : [];
  } catch { 
    return []; 
  } 
}

/**
 * Carrega dados offline do arquivo estático /bootstrap/posts-2025.min.json
 * Valida se os dados são uma exportação válida do MySQL e salva no localStorage
 * @returns Número de itens carregados ou 0 se inválido
 */
export async function preloadOfflineFromStatic(): Promise<number> {
  try {
    console.log('Carregando dados offline...');
    const response = await fetch('/bootstrap/posts-2025.min.json');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validar que é uma exportação válida do MySQL ou aceitar o formato simplificado
    if (
      (data?.meta?.origin === 'mysql-export' && 
       Array.isArray(data.items) && 
       data.meta.count === data.items.length) ||
      (Array.isArray(data.items) && data.updatedAt)
    ) {
      // Se não tiver meta, adicionamos
      if (!data.meta) {
        data.meta = {
          origin: 'mysql-export',
          count: data.items.length
        };
      }
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      console.log(`Cache offline carregado: ${data.items.length} posts`);
      return data.items.length;
    } else {
      console.error('Dados offline inválidos:', data);
      return 0;
    }
  } catch (e) {
    console.error('Erro ao carregar dados offline:', e);
    return 0;
  }
}

/**
 * Obtém posts por posição a partir do cache offline
 */
export function getOfflineByPosition(posicao: string, limit = 20): Post[] {
  const norm = normalizePos(posicao);
  return readAllOffline()
    .filter(p => normalizePos(p.posicao || '') === norm)
    .slice(0, limit);
}

export function normalizePos(v: string): string {
  const m: Record<string,string> = {
    'supermanchete':'SUPER MANCHETE','super-manchete':'SUPER MANCHETE','super':'SUPER MANCHETE',
    'destaque':'DESTAQUE','destaques':'DESTAQUE','manchete-principal':'DESTAQUE',
    'geral':'GERAL','noticia':'GERAL','noticias':'GERAL','noticia-comum':'GERAL',
    'municipios':'MUNICIPIOS','municipio':'MUNICIPIOS','municípios':'MUNICIPIOS'
  };
  const k = String(v || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  return m[k] || v;
}
