import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Heading3, Quote, Lightbulb, 
  List, SeparatorHorizontal, Highlighter, Sparkles, AlignJustify,
  Image, Video, X, Upload, Link, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Eraser
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [history, setHistory] = useState<HistoryState[]>([{ content: value, timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Adicionar ao histórico
  const addToHistory = useCallback((content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ content, timestamp: Date.now() });
    
    // Manter apenas os últimos 50 estados
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Desfazer (Ctrl+Z)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex].content);
    }
  }, [historyIndex, history, onChange]);

  // Refazer (Ctrl+Y)
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex].content);
    }
  }, [historyIndex, history, onChange]);

  // Detectar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Aplicar formatação - VERSÃO CORRIGIDA
  const applyFormat = (format: string) => {
    if (!editorRef.current) return;
    
    // Garantir foco no editor
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    
    // Verificar se há texto selecionado para formatações que precisam dele
    const needsSelection = ['highlight-simple', 'highlight-animated', 'info'];
    if (needsSelection.includes(format) && selectedText.length === 0) {
      alert('Por favor, selecione o texto que deseja destacar.');
      return;
    }
    
    if (selectedText.length === 0 && !['separator', 'justify-left', 'justify-center', 'justify-right', 'justify-full', 'h3', 'quote', 'list'].includes(format)) return;

    // Verificar se a seleção está dentro do editor
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Salvar estado antes da modificação
    addToHistory(value);

    // Aplicar formatação baseada no tipo
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'h3':
        try {
          // Inserir marcação de subtítulo
          if (selectedText) {
            const h3Text = `### ${selectedText}`;
            range.deleteContents();
            range.insertNode(document.createTextNode(h3Text));
          } else {
            range.insertNode(document.createTextNode('### '));
          }
        } catch (error) {
          console.warn('Erro ao aplicar H3:', error);
        }
        break;
      case 'quote':
        try {
          // Inserir marcação de citação
          if (selectedText) {
            const quoteText = `> ${selectedText}`;
            range.deleteContents();
            range.insertNode(document.createTextNode(quoteText));
          } else {
            range.insertNode(document.createTextNode('> '));
          }
        } catch (error) {
          console.warn('Erro ao aplicar citação:', error);
        }
        break;
      case 'list':
        try {
          // Inserir marcação de lista
          if (selectedText) {
            const listText = `• ${selectedText}`;
            range.deleteContents();
            range.insertNode(document.createTextNode(listText));
          } else {
            range.insertNode(document.createTextNode('• '));
          }
        } catch (error) {
          console.warn('Erro ao aplicar lista:', error);
        }
        break;
      case 'highlight-simple':
        if (selectedText.length > 0) {
          try {
            const span = document.createElement('span');
            span.className = 'highlight-simple';
            span.style.cssText = 'background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%); padding: 2px 4px; border-radius: 4px; border: 1px solid #f59e0b; display: inline;';
            
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
            
            // Posicionar cursor após o span
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            selection.addRange(newRange);
          } catch (error) {
            console.warn('Erro ao aplicar destaque simples:', error);
          }
        }
        break;
      case 'highlight-animated':
        if (selectedText.length > 0) {
          try {
            const spanAnim = document.createElement('span');
            spanAnim.className = 'highlight-animated';
            spanAnim.style.cssText = 'background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%); padding: 2px 4px; border-radius: 4px; border: 2px solid #ef4444; animation: highlight-pulse 2s infinite; display: inline;';
            
            const contents = range.extractContents();
            spanAnim.appendChild(contents);
            range.insertNode(spanAnim);
            
            // Posicionar cursor após o span
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartAfter(spanAnim);
            newRange.collapse(true);
            selection.addRange(newRange);
          } catch (error) {
            console.warn('Erro ao aplicar destaque animado:', error);
          }
        }
        break;
      case 'info':
        if (selectedText.length > 0) {
          try {
            const infoText = `💡 ${selectedText}`;
            range.deleteContents();
            range.insertNode(document.createTextNode(infoText));
          } catch (error) {
            console.warn('Erro ao aplicar info:', error);
          }
        }
        break;
      case 'separator':
        try {
          const separatorText = '\n---\n';
          range.insertNode(document.createTextNode(separatorText));
        } catch (error) {
          console.warn('Erro ao aplicar separador:', error);
        }
        break;
      case 'justify-left':
        try {
          // Aplicar alinhamento usando CSS diretamente
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            // Encontrar o elemento de parágrafo mais próximo
            while (element && element.nodeType !== Node.ELEMENT_NODE) {
              element = element.parentNode as Node;
            }
            
            if (element && element instanceof HTMLElement) {
              // Se estiver dentro do editor, aplicar alinhamento
              if (editorRef.current?.contains(element)) {
                // Aplicar ao elemento ou ao parágrafo pai
                let targetElement = element;
                if (targetElement.tagName === 'SPAN' || targetElement.tagName === 'STRONG' || targetElement.tagName === 'EM') {
                  // Procurar pelo parágrafo pai
                  while (targetElement.parentElement && targetElement.parentElement !== editorRef.current) {
                    targetElement = targetElement.parentElement;
                    if (targetElement.tagName === 'P' || targetElement.tagName === 'DIV') break;
                  }
                }
                targetElement.style.textAlign = 'left';
              }
            }
          } else {
            // Se não há seleção, aplicar ao editor inteiro
            if (editorRef.current) {
              editorRef.current.style.textAlign = 'left';
            }
          }
        } catch (error) {
          console.warn('Erro ao alinhar à esquerda:', error);
        }
        break;
      case 'justify-center':
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            while (element && element.nodeType !== Node.ELEMENT_NODE) {
              element = element.parentNode as Node;
            }
            
            if (element && element instanceof HTMLElement) {
              if (editorRef.current?.contains(element)) {
                let targetElement = element;
                if (targetElement.tagName === 'SPAN' || targetElement.tagName === 'STRONG' || targetElement.tagName === 'EM') {
                  while (targetElement.parentElement && targetElement.parentElement !== editorRef.current) {
                    targetElement = targetElement.parentElement;
                    if (targetElement.tagName === 'P' || targetElement.tagName === 'DIV') break;
                  }
                }
                targetElement.style.textAlign = 'center';
              }
            }
          } else {
            if (editorRef.current) {
              editorRef.current.style.textAlign = 'center';
            }
          }
        } catch (error) {
          console.warn('Erro ao centralizar:', error);
        }
        break;
      case 'justify-right':
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            while (element && element.nodeType !== Node.ELEMENT_NODE) {
              element = element.parentNode as Node;
            }
            
            if (element && element instanceof HTMLElement) {
              if (editorRef.current?.contains(element)) {
                let targetElement = element;
                if (targetElement.tagName === 'SPAN' || targetElement.tagName === 'STRONG' || targetElement.tagName === 'EM') {
                  while (targetElement.parentElement && targetElement.parentElement !== editorRef.current) {
                    targetElement = targetElement.parentElement;
                    if (targetElement.tagName === 'P' || targetElement.tagName === 'DIV') break;
                  }
                }
                targetElement.style.textAlign = 'right';
              }
            }
          } else {
            if (editorRef.current) {
              editorRef.current.style.textAlign = 'right';
            }
          }
        } catch (error) {
          console.warn('Erro ao alinhar à direita:', error);
        }
        break;
      case 'justify-full':
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;
            
            while (element && element.nodeType !== Node.ELEMENT_NODE) {
              element = element.parentNode as Node;
            }
            
            if (element && element instanceof HTMLElement) {
              if (editorRef.current?.contains(element)) {
                let targetElement = element;
                if (targetElement.tagName === 'SPAN' || targetElement.tagName === 'STRONG' || targetElement.tagName === 'EM') {
                  while (targetElement.parentElement && targetElement.parentElement !== editorRef.current) {
                    targetElement = targetElement.parentElement;
                    if (targetElement.tagName === 'P' || targetElement.tagName === 'DIV') break;
                  }
                }
                targetElement.style.textAlign = 'justify';
              }
            }
          } else {
            if (editorRef.current) {
              editorRef.current.style.textAlign = 'justify';
            }
          }
        } catch (error) {
          console.warn('Erro ao justificar:', error);
        }
        break;
    }

    // Atualizar o conteúdo após um pequeno delay
    setTimeout(() => updateContent(), 10);
  };

  // Atualizar conteúdo do editor - VERSÃO ULTRA LIMPA
  const updateContent = () => {
    if (!editorRef.current) return;
    
    try {
      // Obter o HTML atual do editor
      const html = editorRef.current.innerHTML;
      
      // Processar HTML de forma SUPER SIMPLES - NUNCA gerar marcadores ALIGN
      let processedText = html
        // PRIMEIRO: Remover qualquer marcador problemático que possa existir
        .replace(/ALIGN_[^_]*_(START|END)[A]*/g, '')
        .replace(/\*\*ALIGN_[^*]*\*\*/g, '')
        
        // Processar formatação básica
        .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
        .replace(/<u[^>]*>(.*?)<\/u>/g, '__$1__')
        
        // Processar elementos estruturais
        .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
        .replace(/<li[^>]*>(.*?)<\/li>/g, '• $1')
        
        // Processar parágrafos e quebras
        .replace(/<p[^>]*>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        
        // Remover TODAS as outras tags HTML 
        .replace(/<[^>]+>/g, '')
        
        // Limpar quebras excessivas
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // GARANTIA EXTRA: Verificar se ainda há marcadores problemáticos
      if (processedText.includes('ALIGN_') || processedText.includes('_START') || processedText.includes('_END')) {
        console.warn('🚨 Detectados marcadores problemáticos! Removendo...');
        processedText = processedText
          .replace(/ALIGN_[^_]*_(START|END)[A]*/g, '')
          .replace(/\*\*ALIGN_[^*]*\*\*/g, '')
          .replace(/_START[A]*/g, '')
          .replace(/_END/g, '')
          .replace(/ALIGN_[^\s]*/g, '');
      }
      
      // Atualizar apenas se houver mudanças significativas e SEM marcadores problemáticos
      if (processedText !== value && !processedText.includes('ALIGN_')) {
        onChange(processedText);
      }
    } catch (error) {
      console.warn('Erro ao atualizar conteúdo:', error);
    }
  };

  // Função para limpar formatação problemática
  const cleanupFormattingIssues = () => {
    if (!editorRef.current) return;
    
    // Remover elementos vazios ou problemáticos
    const emptyElements = editorRef.current.querySelectorAll('span:empty, mark:empty, strong:empty, em:empty');
    emptyElements.forEach(el => el.remove());
    
    // Corrigir spans aninhados desnecessários
    const spans = editorRef.current.querySelectorAll('span');
    spans.forEach(span => {
      if (span.childNodes.length === 1 && span.firstChild?.nodeType === Node.TEXT_NODE) {
        // Preservar apenas spans com classes específicas
        if (!span.className.includes('highlight')) {
          const parent = span.parentNode;
          if (parent) {
            parent.insertBefore(span.firstChild, span);
            parent.removeChild(span);
          }
        }
      }
    });
  };

  // Obter início da seleção
  const getSelectionStart = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return value.length;
    
    const range = selection.getRangeAt(0);
    
    // Verificar se a seleção está dentro do editor
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return value.length;
    }
    
    try {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current!);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      
      const start = preCaretRange.toString().length;
      return Math.max(0, Math.min(start, value.length));
    } catch (error) {
      console.warn('Erro ao calcular início da seleção:', error);
      return value.length;
    }
  };

  // Inserir imagem
  const insertImage = () => {
    if (!imageUrl.trim()) return;
    
    const imageMarkdown = `\n<div class="image-container"><img src="${imageUrl}" alt="${imageAlt || 'Imagem'}" class="max-w-full h-auto rounded-lg border border-gray-200" /></div>\n`;
    const cursorPosition = getSelectionStart();
    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    
    const newContent = before + imageMarkdown + after;
    onChange(newContent);
    addToHistory(newContent);
    
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Inserir vídeo
  const insertVideo = () => {
    if (!videoUrl.trim()) return;
    
    const videoMarkdown = `\n<div class="video-container"><div class="video-title">🎥 <strong>${videoTitle || 'Vídeo'}</strong></div><div class="video-url">${videoUrl}</div></div>\n`;
    const cursorPosition = getSelectionStart();
    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    
    const newContent = before + videoMarkdown + after;
    onChange(newContent);
    addToHistory(newContent);
    
    setShowVideoModal(false);
    setVideoUrl('');
    setVideoTitle('');
  };

  // Upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Upload de vídeo
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setVideoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Renderizar conteúdo formatado - VERSÃO ULTRA AGRESSIVA ANTI-MARCADORES
  const renderFormattedContent = (content: string) => {
    if (!content) return '';
    
    // FILTRO MEGA AGRESSIVO: Remover TODOS os marcadores de uma vez
    console.log('🔍 Conteúdo original:', content.substring(0, 200));
    
    content = content
      // Remover ALIGN_justify_START e ALIGN_justify_END especificamente
      .replace(/ALIGN_justify_START[A]*/g, '')
      .replace(/ALIGN_justify_END/g, '')
      
      // Remover outros padrões ALIGN
      .replace(/\*\*ALIGN_[^*]*_START[A]*\*\*/g, '')
      .replace(/\*\*ALIGN_[^*]*_END\*\*/g, '')
      .replace(/ALIGN_[^_]*_(START|END)[A]*/g, '')
      .replace(/ALIGN_[^\s\n]*/g, '')
      .replace(/_START[A]*/g, '')
      .replace(/_END/g, '')
      
      // Limpar espaços duplos que podem ficar
      .replace(/\s{2,}/g, ' ')
      .trim();
      
    console.log('🧹 Conteúdo limpo:', content.substring(0, 200));
    
    // Se ainda houver ALIGN, forçar remoção extrema
    if (content.includes('ALIGN') || content.includes('START') || content.includes('END')) {
      console.error('🚨 AINDA TEM MARCADORES! Removendo com força bruta...');
      content = content.replace(/[A-Z_]*ALIGN[A-Z_]*/g, '').replace(/[A-Z_]*START[A-Z_]*/g, '').replace(/[A-Z_]*END[A-Z_]*/g, '');
    }
    
    try {
      let formattedContent = content
        // ✅ CORRIGIDO: Converter destaques markdown para HTML com estilos inline
        .replace(/\[DESTAQUE\](.*?)\[\/DESTAQUE\]/g, '<span class="highlight-simple" style="background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%); padding: 2px 4px; border-radius: 4px; border: 1px solid #f59e0b; display: inline;">$1</span>')
        .replace(/\[DESTAQUE_ANIMADO\](.*?)\[\/DESTAQUE_ANIMADO\]/g, '<span class="highlight-animated" style="background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%); padding: 2px 4px; border-radius: 4px; border: 2px solid #ef4444; animation: highlight-pulse 2s infinite; display: inline;">$1</span>')
        
        // Manter compatibilidade com destaques HTML antigos
        .replace(/<span class="highlight-simple"[^>]*>(.*?)<\/span>/g, '<span class="highlight-simple" style="background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%); padding: 2px 4px; border-radius: 4px; border: 1px solid #f59e0b; display: inline;">$1</span>')
        .replace(/<span class="highlight-animated"[^>]*>(.*?)<\/span>/g, '<span class="highlight-animated" style="background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%); padding: 2px 4px; border-radius: 4px; border: 2px solid #ef4444; animation: highlight-pulse 2s infinite; display: inline;">$1</span>')
        
        // Aplicar formatações markdown básicas
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>') // Itálico mais preciso
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/^### (.*?)(?=\n|$)/gm, '<h3 class="text-lg font-semibold text-gray-900 my-3">$1</h3>')
        .replace(/^> (.*?)(?=\n|$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-blue-900 my-2">$1</blockquote>')
        .replace(/^• (.*?)(?=\n|$)/gm, '<li class="ml-4 my-1">$1</li>')
        
        // Processar separadores
        .replace(/^---$/gm, '<hr class="separator" style="border: none; height: 2px; background: linear-gradient(90deg, transparent, #d1d5db, transparent); margin: 20px 0;">')
        
        // Processar caixas de informação
        .replace(/^💡 (.*?)(?=\n|$)/gm, '<div class="info-box" style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><span style="color: #0ea5e9;">💡</span> <strong>$1</strong></div>')
        
        // Limpar quebras excessivas
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Processar quebras de linha e parágrafos
      const paragraphs = formattedContent.split(/\n\s*\n/).filter((p: string) => p.trim());
      
      if (paragraphs.length > 1) {
        // Múltiplos parágrafos
        formattedContent = paragraphs.map((paragraph: string) => {
          const lines = paragraph.trim().replace(/\n/g, '<br>');
          return lines ? `<p style="margin: 8px 0; line-height: 1.6;">${lines}</p>` : '';
        }).filter((p: string) => p).join('');
      } else {
        // Parágrafo único
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        if (formattedContent.trim() && !formattedContent.startsWith('<p>')) {
          formattedContent = `<p style="margin: 8px 0; line-height: 1.6;">${formattedContent}</p>`;
        }
      }

      return formattedContent;
    } catch (error) {
      console.warn('Erro ao renderizar conteúdo:', error);
      return content;
    }
  };

  // Lidar com mudanças no editor - ULTRA SIMPLES
  const handleEditorChange = () => {
    if (!editorRef.current) return;
    
    try {
      // ✅ CORRIGIDO: Atualizar o conteúdo com processamento correto
      const currentHtml = editorRef.current.innerHTML;
      
      // Processar HTML para markdown de forma segura
      let processedText = currentHtml
        // Remover marcadores problemáticos PRIMEIRO
        .replace(/ALIGN_[^_]*_(START|END)[A]*/g, '')
        .replace(/\*\*ALIGN_[^*]*\*\*/g, '')
        
        // ✅ CORRIGIDO: Preservar destaques animados ANTES de converter outras tags
        .replace(/<span class="highlight-simple"[^>]*>(.*?)<\/span>/g, '**HIGHLIGHT_SIMPLE_START**$1**HIGHLIGHT_SIMPLE_END**')
        .replace(/<span class="highlight-animated"[^>]*>(.*?)<\/span>/g, '**HIGHLIGHT_ANIMATED_START**$1**HIGHLIGHT_ANIMATED_END**')
        
        // Converter formatação HTML para markdown
        .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
        .replace(/<u[^>]*>(.*?)<\/u>/g, '__$1__')
        
        // ✅ CORRIGIDO: Quote funciona agora
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
        
        // ✅ CORRIGIDO: H3 funciona
        .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
        
        // ✅ CORRIGIDO: Lista funciona  
        .replace(/<li[^>]*>(.*?)<\/li>/g, '• $1')
        
        // ✅ CORRIGIDO: Quebras de linha preservadas
        .replace(/<p[^>]*>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        
        // Remover outras tags HTML
        .replace(/<[^>]+>/g, '')
        
        // ✅ RESTAURAR destaques como markdown especial
        .replace(/\*\*HIGHLIGHT_SIMPLE_START\*\*(.*?)\*\*HIGHLIGHT_SIMPLE_END\*\*/g, '[DESTAQUE]$1[/DESTAQUE]')
        .replace(/\*\*HIGHLIGHT_ANIMATED_START\*\*(.*?)\*\*HIGHLIGHT_ANIMATED_END\*\*/g, '[DESTAQUE_ANIMADO]$1[/DESTAQUE_ANIMADO]')
        
        // ✅ CORRIGIDO: Limpar quebras excessivas mas preservar estrutura
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // ✅ SALVAR SEMPRE - sem verificação problemática
      if (processedText !== value) {
        console.log('💾 Salvando alteração:', processedText.substring(0, 100) + '...');
        onChange(processedText);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mudança do editor:', error);
    }
  };

  // Detectar seleção de texto
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        // Mostrar feedback visual de que o texto está selecionado
        console.log('Texto selecionado:', selectedText);
      }
    }
  };

  // Manipular evento de colar (paste) para preservar quebras de linha
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;
    
    // Salvar a posição atual do cursor
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const cursorPos = getSelectionStart();
    
    // Processar o texto para preservar quebras de linha
    let processedText = pastedText
      // Normalizar quebras de linha
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Converter quebras duplas em marcadores de parágrafo
      .replace(/\n\s*\n/g, '\n\n**PARAGRAPH_BREAK**\n\n')
      // Converter quebras simples em marcadores de linha
      .replace(/\n/g, '**LINE_BREAK**')
      // Restaurar quebras de parágrafo
      .replace(/\*\*PARAGRAPH_BREAK\*\*/g, '\n\n')
      // Envolver em HTML
      .split('\n\n')
      .filter(p => p.trim())
      .map(paragraph => {
        const lines = paragraph
          .replace(/\*\*LINE_BREAK\*\*/g, '<br>')
          .trim();
        return lines ? `<p>${lines}</p>` : '';
      })
      .filter(p => p)
      .join('');
    
    // Atualizar o valor diretamente sem usar DOM manipulation
    const before = value.substring(0, cursorPos);
    const after = value.substring(cursorPos);
    const newContent = before + processedText + after;
    
    // Atualizar o conteúdo
    onChange(newContent);
    addToHistory(newContent);
    
    // Atualizar o cursor para depois do texto colado
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        // Mover cursor para o final do texto inserido
        const newPos = cursorPos + processedText.length;
        try {
          const newSelection = window.getSelection();
          if (newSelection && editorRef.current.firstChild) {
            const range = document.createRange();
            const textNode = editorRef.current.firstChild;
            const maxPos = Math.min(newPos, (textNode.textContent || '').length);
            range.setStart(textNode, maxPos);
            range.collapse(true);
            newSelection.removeAllRanges();
            newSelection.addRange(range);
          }
        } catch (error) {
          // Silenciosamente falhar se não conseguir restaurar o cursor
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-1 flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-600 mr-2">Formatação:</span>
          
          {/* Desfazer/Refazer */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refazer (Ctrl+Y)"
            aria-label="Refazer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" aria-hidden="true" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Formatação básica */}
          <button
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Negrito (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Itálico (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('underline')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Sublinhado (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Alinhamento */}
          <button
            onClick={() => applyFormat('justify-left')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Alinhar à Esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('justify-center')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Centralizar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('justify-right')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Alinhar à Direita"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('justify-full')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Justificar Texto"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Elementos estruturais */}
          <button
            onClick={() => applyFormat('h3')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Subtítulo H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('quote')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Citação"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('list')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Destaques */}
          <button
            onClick={() => applyFormat('highlight-simple')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Destaque Simples"
          >
            <Highlighter className="w-4 h-4 text-yellow-600" />
          </button>
          <button
            onClick={() => applyFormat('highlight-animated')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Destaque Animado"
          >
            <Sparkles className="w-4 h-4 text-red-500" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Mídia */}
          <button
            onClick={() => setShowImageModal(true)}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Inserir Imagem"
            aria-label="Inserir Imagem"
          >
            <Image className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Inserir Vídeo"
            aria-label="Inserir Vídeo"
          >
            <Video className="w-4 h-4 text-purple-600" aria-hidden="true" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Limpeza */}
          <button
            onClick={cleanupFormattingIssues}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Limpar Formatação Problemática"
          >
            <Eraser className="w-4 h-4 text-red-500" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Extras */}
          <button
            onClick={() => applyFormat('info')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Caixa de Informação"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('separator')}
            className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-300"
            title="Separador"
          >
            <SeparatorHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 <strong>Dica:</strong> Selecione o texto e clique nos botões para formatar. Os destaques (amarelo/vermelho) só funcionam com texto selecionado. Use Ctrl+Z para desfazer e Ctrl+Y para refazer.<br/>
          📋 <strong>Cole texto:</strong> Ao colar texto do bloco de notas, as quebras de linha e parágrafos serão preservados automaticamente.
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-64 resize-none outline-none bg-white"
          style={{ 
            fontSize: '15px', 
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden'
          }}
          onInput={handleEditorChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: renderFormattedContent(value) }}
          suppressContentEditableWarning={true}
        />
        
        {!value && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* Modal de Imagem */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Image className="w-5 h-5 text-blue-600 mr-2" />
                Inserir Imagem
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto Alternativo
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Descrição da imagem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou fazer upload
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Escolher arquivo</span>
                </button>
              </div>
              
              {imageUrl && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <img src={imageUrl} alt={imageAlt} className="max-w-full h-auto rounded" />
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={insertImage}
                disabled={!imageUrl.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vídeo */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Video className="w-5 h-5 text-purple-600 mr-2" />
                Inserir Vídeo
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Vídeo
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Vídeo
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Título do vídeo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou fazer upload
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Escolher arquivo</span>
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={insertVideo}
                disabled={!videoUrl.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .highlight-simple {
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid #f59e0b;
        }
        
        .highlight-animated {
          background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%);
          padding: 2px 4px;
          border-radius: 4px;
          border: 2px solid #ef4444;
          animation: highlight-pulse 2s infinite;
        }
        
        @keyframes highlight-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.02);
            opacity: 0.9;
          }
        }
        
        .info-box {
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 12px;
          margin: 8px 0;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .image-container {
          margin: 16px 0;
          text-align: center;
        }
        
        .video-container {
          margin: 16px 0;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        
        .video-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .separator {
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d1d5db, transparent);
          margin: 20px 0;
        }
        
        .video-url {
          color: #64748b;
          font-size: 14px;
          word-break: break-all;
        }
        
        /* Estilos para parágrafos e formatação de texto */
        [contenteditable] p {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        [contenteditable] p:first-child {
          margin-top: 0;
        }
        
        [contenteditable] p:last-child {
          margin-bottom: 0;
        }
        
        [contenteditable] br {
          line-height: 1.6;
        }
        
        /* Estilos para destaques */
        .highlight-simple {
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid #f59e0b;
          display: inline;
        }
        
        .highlight-animated {
          background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%);
          padding: 2px 4px;
          border-radius: 4px;
          border: 2px solid #ef4444;
          display: inline;
          position: relative;
          overflow: hidden;
        }
        
        /* Animação de revelação da esquerda para direita */
        .highlight-animated::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(120deg, #fecaca 0%, #fca5a5 100%);
          animation: reveal-highlight 2s ease-out;
        }
        
        @keyframes reveal-highlight {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        
        /* Animação contínua para destaques que entram no viewport */
        .highlight-animated.in-viewport::before {
          animation: reveal-highlight 1.5s ease-out;
        }
        
        /* Estilos para caixa de informação */
        .info-box {
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 0 8px 8px 0;
        }
        
        /* Alinhamentos */
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        `
      }} />
    </div>
  );
};

export default RichTextEditor; 