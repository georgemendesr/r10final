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

interface HistoryState { content: string; timestamp: number; }

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Digite o conteúdo da matéria aqui...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0);

  // Identificador de build para debug visual no console
  useEffect(() => {
    console.info('%c[R10-EDITOR] Build ativo: v2 + upload inline + paste sanitizado', 'background:#1e3a8a;color:#fff;padding:2px 6px;border-radius:4px');
  }, []);

  // API base
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
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadFileReturnUrl(file);
      if (url) insertImageAtCursor(url);
    }
    handleContentChange();
  };

  // Inicializa com valor vindo de fora sem perder cursor se possível
  useEffect(() => {
    if (editorRef.current && !isComposing) {
      const current = editorRef.current.innerHTML;
      const next = value || '';
      if (current !== next) {
        editorRef.current.innerHTML = next;
      }
    }
  }, [value, isComposing]);

  // Preview animação para spans existentes com data-highlight="animated"
  useEffect(() => {
    if (!editorRef.current) return;
    const animated = editorRef.current.querySelectorAll('[data-highlight="animated"]');
    animated.forEach((el) => {
      const element = el as HTMLElement;
      setTimeout(() => { element.classList.add('animate-in-view'); element.style.backgroundSize = '100% 100%'; }, 300);
    });
  }, [value]);

  const addToHistory = useCallback((content: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), { content, timestamp: Date.now() }];
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleContentChange = useCallback(() => {
    if (!editorRef.current || isComposing) return;
    const content = editorRef.current.innerHTML;
    onChange(content);
    const last = history[historyIndex];
    const now = Date.now();
    if (!last || (content !== last.content && (!last.timestamp || now - last.timestamp > 500))) {
      addToHistory(content);
    }
  }, [onChange, isComposing, history, historyIndex, addToHistory]);

  const applyFormat = useCallback((format: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    switch (format) {
      case 'bold': document.execCommand('bold'); break;
      case 'italic': document.execCommand('italic'); break;
      case 'underline': document.execCommand('underline'); break;
      case 'h3': document.execCommand('formatBlock', false, 'h3'); break;
      case 'quote': insertSpecialElement('blockquote', 'citação'); break;
      case 'list': document.execCommand('insertUnorderedList'); break;
      case 'justify-left': document.execCommand('justifyLeft'); break;
      case 'justify-center': document.execCommand('justifyCenter'); break;
      case 'justify-right': document.execCommand('justifyRight'); break;
      case 'justify-full': document.execCommand('justifyFull'); break;
      case 'highlight-simple': insertHighlight('simple'); break;
      case 'highlight-animated': insertHighlight('animated'); break;
      case 'info': insertSpecialElement('div', 'informação importante'); break;
      case 'separator': insertSeparator(); break;
    }
    handleContentChange();
  }, [handleContentChange]);

  // Destaque preservando animação (NÃO tocar na lógica de spans anteriores)
  const insertHighlight = (type: 'simple' | 'animated') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) { alert('Selecione um texto para destacar'); return; }
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) { alert('Selecione um texto válido'); return; }
    const span = document.createElement('span');
    if (type === 'animated') {
      span.className = 'highlight-animated';
      span.setAttribute('data-highlight', 'animated');
      span.style.cssText = `position:relative; background:linear-gradient(90deg,#FF8C42,#FF6B35); background-size:0% 100%; background-repeat:no-repeat; background-position:left center; color:#000; font-weight:600; padding:2px 4px; border-radius:4px; display:inline; -webkit-box-decoration-break:clone; box-decoration-break:clone;`;
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
      selection.removeAllRanges();
      // Preview apenas no editor
      setTimeout(() => { span.style.transition = 'background-size 0.8s ease-out'; span.style.backgroundSize = '100% 100%'; }, 100);
    } else {
      span.className = 'highlight-simple';
      span.style.cssText = 'background-color:#fef3c7; padding:2px 4px; border-radius:4px; display:inline;';
      span.textContent = selectedText;
      range.deleteContents(); range.insertNode(span); selection.removeAllRanges();
    }
    setTimeout(() => handleContentChange(), 120);
  };

  const insertSpecialElement = (tag: string, placeholder: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
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
    const fragment = selectedText.trim() ? range.extractContents() : document.createTextNode(placeholder);
    element.appendChild(fragment as any);
    element.contentEditable = 'true';
    range.insertNode(element);
    selection.removeAllRanges();
    if (!selectedText.trim()) {
      const newRange = document.createRange(); newRange.selectNodeContents(element); selection.addRange(newRange);
    }
    setTimeout(handleContentChange, 100);
  };

  const insertSeparator = () => {
    const separator = document.createElement('hr');
    separator.className = 'my-4 border-gray-300';
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) { const range = selection.getRangeAt(0); range.insertNode(separator); }
  };

  const fileInputRef = useRef<HTMLInputElement|null>(null);

  const triggerFileDialog = () => {
    editorRef.current?.focus();
    fileInputRef.current?.click();
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleFiles(files);
    e.target.value = '';
  };

  const insertImage = () => {
    const url = prompt('URL da imagem:');
    if (url) { insertImageAtCursor(url); handleContentChange(); }
  };

  const insertVideo = () => {
    const url = prompt('URL do vídeo (YouTube, etc):');
    if (!url) return;
    let embedUrl = url;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0]; embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]; embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl; iframe.className = 'w-full h-64 rounded-lg my-2';
    iframe.setAttribute('frameborder','0'); iframe.setAttribute('allowfullscreen','true');
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) { const range = sel.getRangeAt(0); range.insertNode(iframe); handleContentChange(); }
  };

  const clearFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      if (editorRef.current) {
        const plainText = editorRef.current.innerText || '';
        editorRef.current.innerHTML = plainText.replace(/\n/g, '<br>');
        handleContentChange();
      }
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const selectedText = range.toString();
    const textNode = document.createTextNode(selectedText);
    range.deleteContents(); range.insertNode(textNode);
    selection.removeAllRanges();
    handleContentChange();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1; const prev = history[newIndex];
      if (editorRef.current && prev) { editorRef.current.innerHTML = prev.content; onChange(prev.content); setHistoryIndex(newIndex); }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1; const next = history[newIndex];
      if (editorRef.current && next) { editorRef.current.innerHTML = next.content; onChange(next.content); setHistoryIndex(newIndex); }
    }
  };

  return (
    <div className="rich-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Formatação Básica */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Negrito"><Bold size={16} /></button>
          <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Itálico"><Italic size={16} /></button>
          <button type="button" onClick={() => applyFormat('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Sublinhado"><Underline size={16} /></button>
        </div>
        {/* Alinhamento */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={() => applyFormat('justify-left')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Alinhar à esquerda"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => applyFormat('justify-center')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Centralizar"><AlignCenter size={16} /></button>
            <button type="button" onClick={() => applyFormat('justify-right')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Alinhar à direita"><AlignRight size={16} /></button>
          <button type="button" onClick={() => applyFormat('justify-full')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Justificar"><AlignJustify size={16} /></button>
        </div>
        {/* Estruturais */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={() => applyFormat('h3')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Título H3"><Type size={16} /></button>
          <button type="button" onClick={() => applyFormat('quote')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Citação"><Quote size={16} /></button>
          <button type="button" onClick={() => applyFormat('list')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Lista"><List size={16} /></button>
        </div>
        {/* Destaques */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={() => applyFormat('highlight-simple')} className="p-2 hover:bg-gray-200 rounded text-yellow-600" title="Destaque Simples"><Palette size={16} /></button>
          <button type="button" onClick={() => applyFormat('highlight-animated')} className="p-2 hover:bg-gray-200 rounded text-yellow-600 animate-pulse" title="Destaque Animado"><Sparkles size={16} /></button>
        </div>
        {/* Especiais */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={() => applyFormat('info')} className="p-2 hover:bg-gray-200 rounded text-blue-600" title="Caixa de Informação"><Info size={16} /></button>
          <button type="button" onClick={() => applyFormat('separator')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Separador"><Minus size={16} /></button>
        </div>
        {/* Mídia */}
        <div className="flex gap-1 pr-2 border-r border-gray-300">
          <button type="button" onClick={insertImage} className="p-2 hover:bg-gray-200 rounded text-green-600" title="Inserir Imagem por URL"><Image size={16} /></button>
          <button type="button" onClick={triggerFileDialog} className="p-2 hover:bg-gray-200 rounded text-emerald-600" title="Fazer upload de imagem (arquivo)"><Upload size={16} /></button>
          <button type="button" onClick={insertVideo} className="p-2 hover:bg-gray-200 rounded text-red-600" title="Inserir Vídeo"><Video size={16} /></button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleDirectUpload} className="hidden" />
        </div>
        {/* Undo/Redo + Limpar */}
        <div className="flex gap-1">
          <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50" title="Desfazer"><Undo2 size={16} /></button>
          <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50" title="Refazer"><Redo2 size={16} /></button>
          <button type="button" onClick={clearFormatting} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Limpar Formatação"><Eraser size={16} /></button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose prose-lg max-w-none"
        style={{ lineHeight: '1.6', fontSize: '16px' }}
        onInput={handleContentChange}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => { setIsComposing(false); handleContentChange(); }}
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
          const html = e.clipboardData?.getData('text/html');
          const plain = e.clipboardData?.getData('text/plain');
          if (html) {
            e.preventDefault();
            const temp = document.createElement('div'); temp.innerHTML = html;
            const ALLOWED_BLOCK = new Set(['P','DIV','H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE']);
            const ALLOWED_INLINE = new Set(['STRONG','B','EM','I','U','A','SPAN']);
            const cleanNode = (node: Node): Node | null => {
              if (node.nodeType === Node.TEXT_NODE) return node;
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement; const tag = el.tagName.toUpperCase();
                if (el.hasAttribute('style')) el.removeAttribute('style');
                el.removeAttribute('color'); el.removeAttribute('face'); el.removeAttribute('size');
                if (/font|color|size/i.test(el.className)) el.removeAttribute('class');
                if (tag === 'FONT') {
                  const span = document.createElement('span');
                  while (el.firstChild) span.appendChild(cleanNode(el.firstChild) as Node);
                  return span;
                }
                if (tag === 'SPAN' && !el.attributes.length) {
                  const frag = document.createDocumentFragment();
                  while (el.firstChild) frag.appendChild(cleanNode(el.firstChild) as Node);
                  return frag;
                }
                if (!ALLOWED_BLOCK.has(tag) && !ALLOWED_INLINE.has(tag)) {
                  const frag = document.createDocumentFragment();
                  Array.from(el.childNodes).forEach(ch => { const cleaned = cleanNode(ch); if (cleaned) frag.appendChild(cleaned); });
                  return frag;
                }
                Array.from(el.childNodes).forEach(ch => {
                  const cleaned = cleanNode(ch);
                  if (cleaned !== ch) { if (cleaned) el.replaceChild(cleaned, ch); else el.removeChild(ch); }
                });
                return el;
              }
              return null;
            };
            const nodes = Array.from(temp.childNodes).map(n => cleanNode(n)).filter(Boolean);
            const frag = document.createDocumentFragment(); nodes.forEach(n => frag.appendChild(n as Node));
            frag.querySelectorAll?.('span').forEach((sp: any) => { if (!sp.textContent?.trim()) sp.remove(); });
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) { const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(frag); sel.collapseToEnd(); }
            else editorRef.current?.appendChild(frag);
            handleContentChange();
          } else if (plain) {
            e.preventDefault();
            const lines = plain.replace(/\r\n/g,'\n').split('\n');
            const frag = document.createDocumentFragment();
            lines.forEach(line => { if (line.trim()) { const p = document.createElement('p'); p.textContent = line; frag.appendChild(p); } else frag.appendChild(document.createElement('br')); });
            const sel = window.getSelection();
            if (sel && sel.rangeCount) { const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(frag); sel.collapseToEnd(); }
            else editorRef.current?.appendChild(frag);
            handleContentChange();
          } else {
            setTimeout(handleContentChange,0);
          }
        }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer?.files || null); }}
        onDragOver={(e) => { e.preventDefault(); }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {uploading && <div className="px-4 pb-2 text-xs text-gray-500">🔄 Enviando imagem{uploadQueue>1?'s':''} ({uploadQueue})...</div>}

      <style dangerouslySetInnerHTML={{ __html: `
        .rich-editor [contenteditable]:empty:before { content: attr(data-placeholder); color:#9ca3af; pointer-events:none; }
        .rich-editor [contenteditable] h3 { font-size:1.5rem; font-weight:600; margin:1rem 0 .5rem; color:#1f2937; }
        .rich-editor [contenteditable] blockquote { background-color:transparent!important; border-left:4px solid #3b82f6!important; padding:.5rem 1rem!important; margin:1rem 0!important; font-style:italic!important; }
        .rich-editor [contenteditable] ul { padding-left:1.5rem; margin:.5rem 0; }
        .rich-editor [contenteditable] hr { margin:1rem 0; border:none; height:1px; background-color:#d1d5db; }
        .rich-editor [contenteditable] img { max-width:100%; height:auto; border-radius:.5rem; margin:.5rem 0; }
        .rich-editor [contenteditable] iframe { width:100%; height:16rem; border-radius:.5rem; margin:.5rem 0; }
        .highlight-animated, [data-highlight="animated"] { position:relative!important; background:linear-gradient(90deg,#fbbf24,#f59e0b)!important; background-size:0% 100%!important; background-repeat:no-repeat!important; background-position:left center!important; transition:background-size 2s cubic-bezier(.4,0,.2,1)!important; color:#000!important; font-weight:600!important; padding:2px 4px!important; border-radius:4px!important; display:inline!important; -webkit-box-decoration-break:clone; box-decoration-break:clone; }
        .highlight-animated.animate-in-view,[data-highlight="animated"].animate-in-view { background-size:100% 100%!important; }
      `}} />
    </div>
  );
};

export default RichTextEditor;