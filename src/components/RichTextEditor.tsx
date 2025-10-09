import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Type, Quote, List, Palette,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image, Video, Undo2, Redo2, Sparkles, Info, Minus, Eraser, Upload
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<number>(0);

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

  const uploadFileReturnUrl = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      setUploading(true);
      setUploadQueue(q => q + 1);
      const token = localStorage.getItem('token');
      const resp = await fetch(`${apiBase}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!resp.ok) throw new Error('Upload falhou');
      const data = await resp.json();
      return data.imageUrl || data.url || data.relative || data.relativeUrl || null;
    } catch (e) {
      console.error('Falha upload imagem editor:', e);
      return null;
    } finally {
      setUploadQueue(q => q - 1);
      setUploading(false);
    }
  };

  const insertImageAtCursor = (url: string) => {
    if (!editorRef.current) return;
    const img = document.createElement('img');
    img.src = url;
    img.className = 'max-w-full h-auto rounded-lg my-2';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.insertNode(img);
    } else {
      editorRef.current.appendChild(img);
    }
    handleContentChange();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      // Preview imediato opcional (dataURL) poderia ser adicionado — aqui subimos direto
      const url = await uploadFileReturnUrl(file);
      if (url) insertImageAtCursor(url);
    }
  };

  const triggerFileDialog = () => {
    editorRef.current?.focus();
    fileInputRef.current?.click();
  };

  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await handleFiles(files);
    event.target.value = '';
  };

  // Inicializar editor com conteúdo
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
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
    onChange(content);
    
    // Adicionar ao histórico apenas se o conteúdo mudou significativamente
    const lastHistory = history[historyIndex];
    if (!lastHistory || content !== lastHistory.content) {
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

  // Limpar formatação
  const clearFormatting = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Se há texto selecionado, limpar apenas a seleção
    if (!selection.isCollapsed) {
      // Remove formatação da seleção
      document.execCommand('removeFormat');
      document.execCommand('unlink');
      
      // Remove classes e estilos inline da seleção
      const range = selection.getRangeAt(0);
      const contents = range.extractContents();
      
      // Função recursiva para limpar nós
      const cleanNode = (node: Node): Node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Remove atributos de formatação
          element.removeAttribute('style');
          element.removeAttribute('class');
          element.removeAttribute('data-highlight');
          
          // Limpa filhos recursivamente
          Array.from(element.childNodes).forEach(child => {
            const cleaned = cleanNode(child);
            if (cleaned !== child) {
              element.replaceChild(cleaned, child);
            }
          });
          
          // Se o elemento é apenas formatação visual (span, b, i, etc.), extrair o conteúdo
          if (['SPAN', 'B', 'I', 'U', 'STRONG', 'EM'].includes(element.tagName)) {
            const fragment = document.createDocumentFragment();
            while (element.firstChild) {
              fragment.appendChild(element.firstChild);
            }
            return fragment;
          }
          
          return element;
        }
        return node;
      };
      
      const cleanedContents = document.createDocumentFragment();
      Array.from(contents.childNodes).forEach(node => {
        cleanedContents.appendChild(cleanNode(node));
      });
      
      range.insertNode(cleanedContents);
      
    } else {
      // Se não há seleção, limpar todo o editor
      const content = editorRef.current.innerHTML;
      
      // Remove toda formatação mas preserva quebras de linha e parágrafos
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      const cleanAllNodes = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Preserva quebras de linha importantes
          if (['BR', 'P', 'DIV'].includes(element.tagName)) {
            const childText = Array.from(element.childNodes)
              .map(child => cleanAllNodes(child))
              .join('');
            return element.tagName === 'BR' ? '\n' : `${childText}\n`;
          }
          
          // Para outros elementos, apenas extrair o texto
          return Array.from(element.childNodes)
            .map(child => cleanAllNodes(child))
            .join('');
        }
        return '';
      };
      
      const plainText = cleanAllNodes(tempDiv);
      
      // Reconstroi o HTML apenas com parágrafos simples
      const paragraphs = plainText
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
      
      editorRef.current.innerHTML = paragraphs || '<p></p>';
    }
    
    handleContentChange();
  };

  // Inserir highlight
  const insertHighlight = (type: 'simple' | 'animated') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const span = document.createElement('span');
      
      if (type === 'animated') {
        span.className = 'highlight-animated';
        span.setAttribute('data-highlight', 'animated');
        span.style.position = 'relative';
        span.style.background = 'linear-gradient(90deg, rgb(251, 191, 36), rgb(245, 158, 11)) left center / 0% 100% no-repeat';
        span.style.transition = 'background-size 2s cubic-bezier(0.4, 0, 0.2, 1)';
        span.style.color = 'rgb(0, 0, 0)';
        span.style.fontWeight = '600';
        span.style.padding = '2px 4px';
        span.style.borderRadius = '4px';
        span.style.display = 'inline';
      } else {
        span.className = 'bg-yellow-200 px-1 rounded';
      }
      
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      selection.removeAllRanges();
      
      handleContentChange();
    }
  };

  // Inserir elemento especial
  const insertSpecialElement = (tag: string, placeholder: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    const element = document.createElement(tag);
    
    if (tag === 'blockquote') {
      element.className = 'bg-gray-50 border-l-4 border-blue-500 pl-4 py-2 my-2 italic';
    } else if (tag === 'div') {
      element.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 my-2 text-blue-800';
    }
    
    element.contentEditable = 'true';
    
    // Se há texto selecionado, usar esse texto; senão usar placeholder
    if (selectedText) {
      // 🔧 FIX: Usar extractContents() para preservar formatação inline
      const fragment = range.extractContents();
      element.appendChild(fragment);
    } else {
      element.textContent = placeholder;
    }
    
    range.insertNode(element);
    selection.removeAllRanges();
    
    // Se inserimos um placeholder, posicionar cursor dentro do elemento
    if (!selectedText) {
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      selection.addRange(newRange);
    }
    
    handleContentChange();
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
    <div className="border border-gray-300 rounded-lg overflow-hidden">
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
            onClick={triggerFileDialog}
            className="p-2 hover:bg-gray-200 rounded text-emerald-600 transition-colors"
            title="Fazer upload de imagem"
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleDirectUpload}
            className="hidden"
          />
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
        <div className="flex gap-1">
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
          <button
            type="button"
            onClick={clearFormatting}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 transition-colors"
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
          const items = e.clipboardData?.items;
          let imageHandled = false;
          if (items) {
            for (const it of items) {
              if (it.kind === 'file') {
                const f = it.getAsFile();
                if (f && f.type.startsWith('image/')) {
                  e.preventDefault();
                  handleFiles({ 0: f, length: 1, item: () => f } as any);
                  imageHandled = true;
                  break;
                }
              }
            }
          }
          if (imageHandled) return;

          // Tentar obter HTML rico
            const html = e.clipboardData?.getData('text/html');
            const plain = e.clipboardData?.getData('text/plain');
            if (html) {
              e.preventDefault();
              // Sanitizar removendo estilos de fonte/cor/tamanho, wrappers span/font
              const temp = document.createElement('div');
              temp.innerHTML = html;

              const ALLOWED_BLOCK = new Set(['P','DIV','H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE']);
              const ALLOWED_INLINE = new Set(['STRONG','B','EM','I','U','A','SPAN']); // span será filtrado se vazio

              const cleanNode = (node: Node): Node | null => {
                if (node.nodeType === Node.TEXT_NODE) return node;
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as HTMLElement;
                  const tag = el.tagName.toUpperCase();
                  // Remover estilos proibidos
                  if (el.hasAttribute('style')) {
                    el.removeAttribute('style');
                  }
                  // Eliminar classes relacionadas a fonte/cores (simplificado)
                  el.removeAttribute('color');
                  el.removeAttribute('face');
                  el.removeAttribute('size');
                  if (/font|color|size/i.test(el.className)) el.removeAttribute('class');

                  // Se for FONT => substitui por span simples
                  if (tag === 'FONT') {
                    const span = document.createElement('span');
                    while (el.firstChild) span.appendChild(cleanNode(el.firstChild) as Node);
                    return span;
                  }
                  // Se for SPAN sem atributos -> pode ser mantido só se contiver algo relevante
                  if (tag === 'SPAN' && !el.attributes.length) {
                    // flatten
                    const frag = document.createDocumentFragment();
                    while (el.firstChild) frag.appendChild(cleanNode(el.firstChild) as Node);
                    return frag;
                  }
                  // Se tag não está nas listas permitidas de bloco ou inline -> converter em fragment
                  if (!ALLOWED_BLOCK.has(tag) && !ALLOWED_INLINE.has(tag)) {
                    const frag = document.createDocumentFragment();
                    Array.from(el.childNodes).forEach(ch => {
                      const cleaned = cleanNode(ch);
                      if (cleaned) frag.appendChild(cleaned);
                    });
                    return frag;
                  }
                  // Recursão normal
                  const children = Array.from(el.childNodes);
                  children.forEach(ch => {
                    const cleaned = cleanNode(ch);
                    if (cleaned !== ch) {
                      if (cleaned) el.replaceChild(cleaned, ch); else el.removeChild(ch);
                    }
                  });
                  return el;
                }
                return null;
              };

              const nodes = Array.from(temp.childNodes).map(n => cleanNode(n)).filter(Boolean);
              const frag = document.createDocumentFragment();
              nodes.forEach(n => frag.appendChild(n as Node));

              // Remover spans vazios residuais
              frag.querySelectorAll?.('span').forEach((sp: any) => { if (!sp.textContent?.trim()) sp.remove(); });

              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(frag);
                sel.collapseToEnd();
              } else if (editorRef.current) {
                editorRef.current.appendChild(frag);
              }
              handleContentChange();
            } else if (plain) {
              e.preventDefault();
              const lines = plain.replace(/\r\n/g,'\n').split('\n');
              const frag = document.createDocumentFragment();
              lines.forEach(line => {
                if (line.trim()) { const p = document.createElement('p'); p.textContent = line; frag.appendChild(p); }
                else frag.appendChild(document.createElement('br'));
              });
              const sel = window.getSelection();
              if (sel && sel.rangeCount) { const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(frag); sel.collapseToEnd(); }
              else editorRef.current?.appendChild(frag);
              handleContentChange();
            } else {
              setTimeout(handleContentChange,0);
            }
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer?.files || null);
        }}
        onDragOver={(e) => { e.preventDefault(); }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {uploading && (
        <div className="px-4 pb-2 text-xs text-gray-500">🔄 Enviando imagem{uploadQueue>1?'s':''} ({uploadQueue})...</div>
      )}

      {/* Estilos CSS */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #1f2937;
        }
        
        [contenteditable] blockquote {
          background-color: #f9fafb;
          border-left: 4px solid #3b82f6;
          padding: 0.5rem 1rem;
          margin: 0.5rem 0;
          font-style: italic;
        }
        
        [contenteditable] ul {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        [contenteditable] hr {
          margin: 1rem 0;
          border: none;
          height: 1px;
          background-color: #d1d5db;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        
        [contenteditable] iframe {
          width: 100%;
          height: 16rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;