import type { ReactNode } from 'react';

export interface SheetProps {
  id: string;
  tone?: 'dark' | 'light' | 'concrete' | 'raised';
  children: ReactNode;
  className?: string;
  /** A sheet read over the fixed building layer below 1024 px: transparent, its blocks on plates. */
  stage?: boolean;
}

/**
 * A stacked sheet. It carries no label of its own: the section's headline (an element with
 * id `${id}-heading`) names the landmark and opens the section.
 */
export function Sheet({ id, tone = 'dark', children, className = '', stage = false }: SheetProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`sheet sheet-tone-${tone} ${stage ? 'sheet-stage' : ''} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      data-sheet-id={id}
    >
      <div className="sheet-dim-overlay" aria-hidden="true" />
      <div className="sheet-inner">{children}</div>
    </section>
  );
}
