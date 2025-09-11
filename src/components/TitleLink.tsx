import React from 'react';
import { getEditoriaTextColor, getEditoriaHoverColor } from '../lib/editorias-colors';

interface TitleLinkProps {
  title: string;
  categoria?: string;
  subcategoria?: string;
  postId?: number | string;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Componente de título clicável com cor por editoria e linha animada
 * Implementa:
 * - Cores de texto baseadas na editoria (paleta oficial)
 * - Linha animada L→R no hover
 * - Motion-safe para transições
 * - Focus-visible para acessibilidade
 * - Links funcionais para notícias
 */
const TitleLink: React.FC<TitleLinkProps> = ({
  title,
  categoria,
  subcategoria,
  postId,
  href,
  onClick,
  className = '',
  children
}) => {
  const textColor = getEditoriaTextColor(categoria, subcategoria);
  const hoverColor = getEditoriaHoverColor(categoria, subcategoria);

  // Gerar URL se não foi fornecida
  const finalHref = href || (postId && categoria ? 
    `/noticia/${categoria}/${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${postId}` 
    : undefined
  );

  const baseClasses = `
    relative inline-block
    font-medium leading-relaxed
    transition-colors duration-200
    motion-safe:transition-colors
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:ring-offset-2
    cursor-pointer
  `;

  // Usar anchor tag quando há href, span quando há apenas onClick
  const Component = finalHref ? 'a' : 'span';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
    // Para elementos 'a' com href, deixar o navegador lidar com a navegação normalmente
  };

  const handleMouseEnter = (e: React.MouseEvent<any>) => {
    // Não alterar cor do título - apenas animar a linha
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) {
      line.style.width = '100%';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<any>) => {
    // Não alterar cor do título - apenas animar a linha
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) {
      line.style.width = '0';
    }
  };

  const handleFocus = (e: React.FocusEvent<any>) => {
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) {
      line.style.width = '100%';
      line.style.transition = 'none';
    }
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) {
      line.style.width = '0';
      line.style.transition = 'width 0.3s ease';
    }
  };

  return (
    <Component
      onClick={onClick ? handleClick : undefined}
      href={Component === 'a' ? finalHref : undefined}
      className={`${baseClasses} ${className} title-with-line`}
      style={{
        color: textColor,
        textDecoration: 'none'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children || title}
      
      {/* Linha animada */}
      <span
        className="title-line absolute bottom-0 left-0 h-px w-0 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
        style={{
          backgroundColor: 'currentColor',
          transition: 'width 0.3s ease'
        }}
      />
    </Component>
  );
};

export default TitleLink;
