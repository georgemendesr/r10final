export function buildCaption(title: string): string {
  // Limita o título a 100 caracteres
  const limitedTitle = title.length > 100 
    ? title.substring(0, 97) + '...' 
    : title;
  
  return `${limitedTitle}\nConfira mais em R10piaui.com\n#piripiri #piaui #noticias`;
} 