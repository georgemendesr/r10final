/**
 * Mapa de cores das editorias
 * Define as cores exatas para títulos e hovers de cada editoria
 */

export interface EditoriaColors {
  text: string;
  hover: string;
}

export const editoriasColors: Record<string, EditoriaColors> = {
  policia: {
    text: '#dc2626',  // red-600
    hover: '#b91c1c' // red-700
  },
  política: {
    text: '#2563eb',  // blue-600
    hover: '#1d4ed8' // blue-700
  },
  politica: { // variação sem acento
    text: '#2563eb',  
    hover: '#1d4ed8'
  },
  esporte: {
    text: '#16a34a',  // green-600
    hover: '#15803d' // green-700
  },
  entretenimento: {
    text: '#9333ea',  // purple-600
    hover: '#7e22ce' // purple-700
  },
  geral: {
    text: '#ea580c',  // orange-600
    hover: '#c2410c' // orange-700
  }
};

/**
 * Mapeia uma categoria para uma editoria válida
 * @param categoria - categoria do post
 * @param subcategoria - subcategoria opcional
 * @returns editoria normalizada
 */
export function mapToEditoria(categoria?: string, subcategoria?: string): string {
  const categoryToCheck = (subcategoria || categoria || '').toLowerCase();
  
  // Mapeamento para as 5 subcategorias editoriais obrigatórias:
  if (categoryToCheck.includes('polici') || categoryToCheck.includes('segur') || 
      categoryToCheck.includes('crime') || categoryToCheck.includes('violenc')) {
    return 'policia';
  }
  
  if (categoryToCheck.includes('politic') || categoryToCheck.includes('eleic') || 
      categoryToCheck.includes('governo') || categoryToCheck.includes('prefeito') ||
      categoryToCheck.includes('vereador') || categoryToCheck.includes('deputado')) {
    return 'politica';
  }
  
  if (categoryToCheck.includes('esport') || categoryToCheck.includes('futebol') || 
      categoryToCheck.includes('campeonato') || categoryToCheck.includes('jogo') ||
      categoryToCheck.includes('copa') || categoryToCheck.includes('time')) {
    return 'esporte';
  }
  
  if (categoryToCheck.includes('entret') || categoryToCheck.includes('cultura') || 
      categoryToCheck.includes('festival') || categoryToCheck.includes('show') ||
      categoryToCheck.includes('cinema') || categoryToCheck.includes('música') ||
      categoryToCheck.includes('arte')) {
    return 'entretenimento';
  }
  
  // Default: geral (para economia, saúde, educação, especiais, municípios, etc.)
  return 'geral';
}

/**
 * Retorna as cores de uma editoria
 * @param editoria - nome da editoria
 * @returns objeto com cores de texto e hover
 */
export function getEditoriaColors(editoria: string): EditoriaColors {
  return editoriasColors[editoria] || editoriasColors.geral;
}

/**
 * Retorna a cor do texto para uma editoria
 * @param categoria - categoria do post
 * @param subcategoria - subcategoria opcional
 * @returns cor hexadecimal do texto
 */
export function getEditoriaTextColor(categoria?: string, subcategoria?: string): string {
  const editoria = mapToEditoria(categoria, subcategoria);
  return getEditoriaColors(editoria).text;
}

/**
 * Retorna a cor do hover para uma editoria
 * @param categoria - categoria do post
 * @param subcategoria - subcategoria opcional
 * @returns cor hexadecimal do hover
 */
export function getEditoriaHoverColor(categoria?: string, subcategoria?: string): string {
  const editoria = mapToEditoria(categoria, subcategoria);
  return getEditoriaColors(editoria).hover;
}
