import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Type, Quote, List, Palette,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image, Video, Undo2, Redo2, Sparkles, Info, Minus, Eraser
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface HistoryState {
  content: string;
  timestamp: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Digite o conteúdo da matéria aqui..." 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);

  // Inicializar editor com conteúdo
  useEffect(() => {
    if (editorRef.current && !isComposing) {
      const currentContent = editorRef.current.innerHTML;
      const newContent = value || '';
      
      // Só atualizar se o conteúdo realmente mudou
      if (currentContent !== newContent) {
        // Salvar posição do cursor
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const cursorOffset = range ? range.startOffset : 0;
        const cursorNode = range ? range.startContainer : null;
        
        editorRef.current.innerHTML = newContent;
        
        // Restaurar cursor se possível
        if (cursorNode && editorRef.current.contains(cursorNode)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(cursorNode, Math.min(cursorOffset, cursorNode.textContent?.length || 0));
            newRange.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          } catch (e) {
            // Ignorar erros de restauração de cursor
          }
        }
      }
    }
  }, [value, isComposing]);

  // Preview de animação no editor (apenas visual, não afeta salvamento)
  useEffect(() => {
    if (!editorRef.current) return;

    // Ativar animação para elementos que já existem (preview no editor)
    const animatedElements = editorRef.current.querySelectorAll('[data-highlight="animated"]');
    animatedElements.forEach((el) => {
      const element = el as HTMLElement;
      // Pequeno delay para mostrar a animação
      setTimeout(() => {
        element.style.backgroundSize = '100% 100%';
        element.classList.add('animate-in-view');
      }, 300);
    });
  }, [value]);

  // Adicionar ao histórico
  const addToHistory = useCallback((content: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), {
      content,
      timestamp: Date.now()
    }];
    
    // Manter apenas últimas 50 entradas
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Manipular mudanças no conteúdo
  const handleContentChange = useCallback(() => {
    if (!editorRef.current || isComposing) return;
    
    const content = editorRef.current.innerHTML;
    
    // Chamar onChange SEMPRE que houver mudança
    onChange(content);
    
    // Adicionar ao histórico apenas se o conteúdo mudou significativamente
    const lastHistory = history[historyIndex];
    const now = Date.now();
    
    // Adicionar ao histórico se:
    // 1. Não há histórico anterior
    // 2. Conteúdo é diferente
    // 3. Passou mais de 500ms desde última entrada (evitar spam)
    if (!lastHistory || 
        (content !== lastHistory.content && (!lastHistory.timestamp || now - lastHistory.timestamp > 500))) {
      addToHistory(content);
    }
  }, [onChange, isComposing, history, historyIndex, addToHistory]);

  // Aplicar formatação
  const applyFormat = useCallback((format: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    switch (format) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'underline':
        document.execCommand('underline');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'quote':
        insertSpecialElement('blockquote', 'citação');
        break;
      case 'list':
        document.execCommand('insertUnorderedList');
        break;
      case 'justify-left':
        document.execCommand('justifyLeft');
        break;
      case 'justify-center':
        document.execCommand('justifyCenter');
        break;
      case 'justify-right':
        document.execCommand('justifyRight');
        break;
      case 'justify-full':
        document.execCommand('justifyFull');
        break;
      case 'highlight-simple':
        insertHighlight('simple');
        break;
      case 'highlight-animated':
        insertHighlight('animated');
        break;
      case 'info':
        insertSpecialElement('div', 'informação importante');
        break;
      case 'separator':
        insertSeparator();
        break;
    }
    
    handleContentChange();
  }, [handleContentChange]);

  // Inserir highlight
  const insertHighlight = (type: 'simple' | 'animated') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      alert('Por favor, selecione o texto que deseja destacar.');
      return;
    }
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) {
      alert('Por favor, selecione o texto que deseja destacar.');
      return;
    }
    
    const span = document.createElement('span');
    
    if (type === 'animated') {
      // Classes e atributos
      span.className = 'highlight-animated';
      span.setAttribute('data-highlight', 'animated');
      
      // Estilos inline CRÍTICOS - serão preservados ao salvar
      span.style.cssText = `
        position: relative;
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
        background-size: 0% 100%;
        background-repeat: no-repeat;
        background-position: left center;
        transition: background-size 2s cubic-bezier(0.4, 0, 0.2, 1);
        color: #000;
        font-weight: 600;
        padding: 2px 4px;
        border-radius: 4px;
        display: inline;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
      `.replace(/\s+/g, ' ').trim();
      
      span.textContent = selectedText;
      
      // Inserir o span
      range.deleteContents();
      range.insertNode(span);
      
      // Limpar seleção
      selection.removeAllRanges();
      
      // Ativar animação após delay (preview no editor)
      setTimeout(() => {
        span.style.backgroundSize = '100% 100%';
        span.classList.add('animate-in-view');
      }, 300);
      
    } else {
      // Destaque simples
      span.className = 'highlight-simple';
      span.style.cssText = `
        background-color: #fef3c7;
        padding: 2px 4px;
        border-radius: 4px;
        display: inline;
      `.replace(/\s+/g, ' ').trim();
      
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      selection.removeAllRanges();
    }
    
    // CRÍTICO: Chamar handleContentChange para salvar
    setTimeout(() => {
      handleContentChange();
    }, 100);
  };

  // Inserir elemento especial
  const insertSpecialElement = (tag: string, placeholder: string) => {
    const selection = window.getSelection();
    
    // Se há texto selecionado, aplicar o elemento ao texto selecionado
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText.trim()) {
        // Aplicar formatação ao texto selecionado
        const element = document.createElement(tag);
        
        if (tag === 'blockquote') {
          element.style.borderLeft = '4px solid #3b82f6';
          element.style.paddingLeft = '1rem';
          element.style.paddingTop = '0.5rem';
          element.style.paddingBottom = '0.5rem';
          element.style.margin = '1rem 0';
          element.style.fontStyle = 'italic';
          element.style.backgroundColor = 'transparent';
        } else if (tag === 'div') {
          element.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 my-2 text-blue-800';
        }
        
        element.textContent = selectedText;
        range.deleteContents();
        range.insertNode(element);
        selection.removeAllRanges();
      } else {
        // Se não há seleção, inserir elemento vazio com placeholder
        const element = document.createElement(tag);
        
        if (tag === 'blockquote') {
          element.style.borderLeft = '4px solid #3b82f6';
          element.style.paddingLeft = '1rem';
          element.style.paddingTop = '0.5rem';
          element.style.paddingBottom = '0.5rem';
          element.style.margin = '1rem 0';
          element.style.fontStyle = 'italic';
          element.style.backgroundColor = 'transparent';
        } else if (tag === 'div') {
          element.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 my-2 text-blue-800';
        }
        
        element.contentEditable = 'true';
        element.textContent = placeholder;
        
        range.insertNode(element);
        
        // Posicionar cursor dentro do elemento
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  // Inserir separador
  const insertSeparator = () => {
    const separator = document.createElement('hr');
    separator.className = 'my-4 border-gray-300';
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(separator);
    }
  };

  // Inserir imagem
  const insertImage = () => {
    const url = prompt('URL da imagem:');
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'max-w-full h-auto rounded-lg my-2';
      img.alt = 'Imagem da matéria';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        handleContentChange();
      }
    }
  };

  // Inserir vídeo
  const insertVideo = () => {
    const url = prompt('URL do vídeo (YouTube, etc):');
    if (url) {
      let embedUrl = url;
      
      if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.className = 'w-full h-64 rounded-lg my-2';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', 'true');
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(iframe);
        handleContentChange();
      }
    }
  };

  // Limpar formatação
  const clearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Se não há seleção, limpar toda a formatação do editor
      if (editorRef.current) {
        const plainText = editorRef.current.innerText || editorRef.current.textContent || '';
        editorRef.current.innerHTML = plainText.replace(/\n/g, '<br>');
        handleContentChange();
      }
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Pegar texto sem formatação da seleção
    const selectedText = range.toString();
    
    // Criar novo nó de texto sem formatação
    const textNode = document.createTextNode(selectedText);
    
    try {
      // Substituir seleção pelo texto limpo
      range.deleteContents();
      range.insertNode(textNode);
      
      // Limpar seleção e atualizar conteúdo
      selection.removeAllRanges();
      handleContentChange();
    } catch (error) {
      console.error('Erro ao limpar formatação:', error);
    }
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      if (editorRef.current && previousState) {
        editorRef.current.innerHTML = previousState.content;
        onChange(previousState.content);
        setHistoryIndex(newIndex);
      }
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      if (editorRef.current && nextState) {
        editorRef.current.innerHTML = nextState.content;
        onChange(nextState.content);
        setHistoryIndex(newIndex);
      }
    }
  };

  return (
    <div className="rich-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        
        {/* Formatação Básica */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Negrito"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Itálico"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Sublinhado"
          >
            <Underline size={16} />
          </button>
        </div>

        {/* Alinhamento */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={() => applyFormat('justify-left')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Alinhar à esquerda"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('justify-center')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Centralizar"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('justify-right')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Alinhar à direita"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('justify-full')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Justificar"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Elementos Estruturais */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={() => applyFormat('h3')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Título H3"
          >
            <Type size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('quote')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Citação"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('list')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Lista"
          >
            <List size={16} />
          </button>
        </div>

        {/* Destaques */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={() => applyFormat('highlight-simple')}
            className="p-2 hover:bg-gray-200 rounded text-yellow-600 transition-colors"
            title="Destaque Simples"
          >
            <Palette size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('highlight-animated')}
            className="p-2 hover:bg-gray-200 rounded text-yellow-600 transition-colors animate-pulse"
            title="Destaque Animado"
          >
            <Sparkles size={16} />
          </button>
        </div>

        {/* Elementos Especiais */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={() => applyFormat('info')}
            className="p-2 hover:bg-gray-200 rounded text-blue-600 transition-colors"
            title="Caixa de Informação"
          >
            <Info size={16} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('separator')}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Separador"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Mídia */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={insertImage}
            className="p-2 hover:bg-gray-200 rounded text-green-600 transition-colors"
            title="Inserir Imagem"
          >
            <Image size={16} />
          </button>
          <button
            type="button"
            onClick={insertVideo}
            className="p-2 hover:bg-gray-200 rounded text-red-600 transition-colors"
            title="Inserir Vídeo"
          >
            <Video size={16} />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Desfazer"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refazer"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Limpar Formatação */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={clearFormatting}
            className="p-2 hover:bg-gray-200 rounded text-red-600 transition-colors"
            title="Limpar Formatação"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose prose-lg max-w-none"
        style={{
          lineHeight: '1.6',
          fontSize: '16px'
        }}
        onInput={handleContentChange}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          handleContentChange();
        }}
        onPaste={(e) => {
          setTimeout(handleContentChange, 0);
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Estilos CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .rich-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .rich-editor [contenteditable] h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #1f2937;
        }
        
        .rich-editor [contenteditable] blockquote {
          background-color: transparent !important;
          border-left: 4px solid #3b82f6 !important;
          padding-left: 1rem !important;
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        
        .rich-editor [contenteditable] ul {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .rich-editor [contenteditable] hr {
          margin: 1rem 0;
          border: none;
          height: 1px;
          background-color: #d1d5db;
        }
        
        .rich-editor [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        
        .rich-editor [contenteditable] iframe {
          width: 100%;
          height: 16rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        .highlight-animated {
          position: relative !important;
          background: linear-gradient(90deg, #fbbf24, #f59e0b) !important;
          background-size: 0% 100% !important;
          background-repeat: no-repeat !important;
          background-position: left center !important;
          transition: background-size 2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          color: #000 !important;
          font-weight: 600 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          display: inline !important;
          -webkit-box-decoration-break: clone; box-decoration-break: clone;
        }

        .highlight-animated.animate-in-view { background-size: 100% 100% !important; }

        /* CSS para quando renderizado fora do editor */
        [data-highlight="animated"] {
          position: relative !important;
          background: linear-gradient(90deg, #fbbf24, #f59e0b) !important;
          background-size: 0% 100% !important;
          background-repeat: no-repeat !important;
          background-position: left center !important;
          transition: background-size 2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          color: #000 !important;
          font-weight: 600 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          display: inline !important;
          -webkit-box-decoration-break: clone; box-decoration-break: clone;
        }

        [data-highlight="animated"].animate-in-view { background-size: 100% 100% !important; }
        `
      }} />
    </div>
  );
};

export default RichTextEditor;