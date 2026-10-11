import type { ReactNode } from 'react';

export interface SheetProps {
  id: string;
  label: string;
  tone?: 'dark' | 'light' | 'concrete' | 'raised';
  headingTag?: 'h1' | 'h2' | 'span';
  children: ReactNode;
  className?: string;
}

export function Sheet({
  id,
  label,
  tone = 'dark',
  headingTag: HeadingTag = 'h2',
  children,
  className = '',
}: SheetProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`sheet sheet-tone-${tone} ${className}`.trim()}
      data-sheet-id={id}
    >
      <div className="sheet-dim-overlay" aria-hidden="true" />
      <div className="sheet-inner">
        <header className="sheet-header">
          <HeadingTag id={headingId} className="sheet-label">
            {label}
          </HeadingTag>
        </header>
        <div className="sheet-content">{children}</div>
      </div>
    </section>
  );
}
