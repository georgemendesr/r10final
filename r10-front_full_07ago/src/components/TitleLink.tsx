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
  forceColor?: string;
  highlightLines?: boolean;
  highlightBg?: string;
  highlightPaddingX?: number;
  highlightPaddingY?: number;
  highlightRadius?: number;
  highlightGapY?: number;
}

const TitleLink: React.FC<TitleLinkProps> = ({
  title,
  categoria,
  subcategoria,
  postId,
  href,
  onClick,
  className = '',
  children,
  forceColor,
  highlightLines = false,
  highlightBg = 'rgba(255,255,255,0.96)',
  highlightPaddingX = 8,
  highlightPaddingY = 2,
  highlightRadius = 4,
  highlightGapY = 0
}) => {
  const textColor = forceColor || getEditoriaTextColor(categoria, subcategoria);
  const hoverColor = getEditoriaHoverColor(categoria, subcategoria);

  const finalHref = href || (postId && categoria ?
    `/noticia/${categoria}/${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${postId}`
    : undefined
  );

  const baseClasses = `
    relative
    transition-colors duration-200
    motion-safe:transition-colors
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:ring-offset-2
    cursor-pointer
  `;

  const Component: any = finalHref ? 'a' : 'span';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<any>) => {
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) line.style.width = '100%';
  };
  const handleMouseLeave = (e: React.MouseEvent<any>) => {
    const line = e.currentTarget.querySelector('.title-line') as HTMLElement;
    if (line) line.style.width = '0';
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

  const componentStyle: React.CSSProperties = {
    color: textColor,
    textDecoration: 'none'
  };

  return (
    <Component
      onClick={onClick ? handleClick : undefined}
      href={finalHref}
      className={`${baseClasses} ${highlightLines ? 'inline' : 'inline-block'} ${className} title-with-line`}
      style={componentStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {highlightLines ? (
        <span
          style={{
            backgroundColor: highlightBg,
            padding: `${highlightPaddingY}px ${highlightPaddingX}px`,
            borderRadius: highlightRadius,
            backgroundClip: 'padding-box',
            boxDecorationBreak: 'clone' as any,
            WebkitBoxDecorationBreak: 'clone' as any,
            borderTop: highlightGapY ? `${highlightGapY}px solid transparent` : undefined,
            borderBottom: highlightGapY ? `${highlightGapY}px solid transparent` : undefined,
            lineHeight: 'inherit',
            display: 'inline'
          }}
        >
          {children || title}
        </span>
      ) : (
        children || title
      )}

      {!highlightLines && (
        <span
          className="title-line absolute bottom-0 left-0 h-px w-0 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
          style={{
            backgroundColor: 'currentColor',
            transition: 'width 0.3s ease'
          }}
        />
      )}
    </Component>
  );
};

export default TitleLink;
