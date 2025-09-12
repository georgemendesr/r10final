const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/noticias.db');

console.log('🧹 CORRIGINDO FORMATAÇÃO DA MATÉRIA 21...\n');

// Função para limpar HTML e manter apenas formatação simples
function cleanContent(htmlContent) {
    // Primeiro, remover todas as tags de estilo inline problemáticas
    let cleaned = htmlContent;
    
    // Remover divs com estilos inline
    cleaned = cleaned.replace(/<div[^>]*style="[^"]*"[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/div>/gi, '<br><br>');
    
    // Remover spans com cores específicas, mas manter o conteúdo
    cleaned = cleaned.replace(/<span[^>]*style="color:[^"]*"[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    
    // Corrigir elementos de destaque problemáticos - remover formatação complexa
    cleaned = cleaned.replace(/<span class="highlight-animated[^"]*"[^>]*style="[^"]*"[^>]*>/gi, '<strong>');
    
    // Corrigir citações mal formatadas
    cleaned = cleaned.replace(/<blockquote[^>]*>/gi, '<blockquote>');
    
    // Remover &nbsp; desnecessários
    cleaned = cleaned.replace(/&nbsp;/gi, ' ');
    
    // Limpar múltiplas quebras de linha
    cleaned = cleaned.replace(/(<br>\s*){3,}/gi, '<br><br>');
    
    // Remover elementos vazios
    cleaned = cleaned.replace(/<[^>]*><\/[^>]*>/gi, '');
    
    // Normalizar espaços
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned.trim();
}

// Buscar e corrigir a matéria 21
db.get('SELECT * FROM noticias WHERE id = 21', [], (err, row) => {
    if (err) {
        console.error('Erro:', err);
        db.close();
        return;
    }

    if (!row) {
        console.log('❌ Matéria 21 não encontrada!');
        db.close();
        return;
    }

    console.log('📰 MATÉRIA 21 - ANTES DA CORREÇÃO:');
    console.log('---START BEFORE---');
    console.log(row.conteudo.substring(0, 200) + '...');
    console.log('---END BEFORE---\n');

    // Aplicar limpeza
    const cleanedContent = cleanContent(row.conteudo);
    
    console.log('📰 MATÉRIA 21 - APÓS LIMPEZA:');
    console.log('---START AFTER---');
    console.log(cleanedContent);
    console.log('---END AFTER---\n');

    // Atualizar no banco
    db.run(
        'UPDATE noticias SET conteudo = ?, updated_at = datetime("now") WHERE id = 21',
        [cleanedContent],
        function(err) {
            if (err) {
                console.error('❌ Erro ao atualizar:', err);
            } else {
                console.log('✅ Matéria 21 corrigida com sucesso!');
                console.log('🎯 Formatação limpa aplicada');
            }
            db.close();
        }
    );
});