export type CursorState = 'default' | 'link' | 'project' | 'hidden';
export type CursorTone = 'dark' | 'light';

/**
 * Resolves cursor state from DOM element target.
 * Hides marker over inputs/textareas/selects so the native I-beam/caret is unimpeded.
 * Expands to project frame on project rows.
 * Expands to bracket frame on buttons/links.
 */
export function resolveCursorState(target: Element | null): CursorState {
  if (!target) return 'default';

  // 1. Text editing and form controls: hide custom marker, show native cursor
  const isInputControl = target.closest('input, textarea, select, [contenteditable="true"]');
  if (isInputControl) {
    return 'hidden';
  }

  // 2. Custom explicit cursor attribute
  const cursorAttrEl = target.closest('[data-cursor]');
  if (cursorAttrEl) {
    const attrVal = cursorAttrEl.getAttribute('data-cursor');
    if (attrVal === 'project') return 'project';
    if (attrVal === 'link' || attrVal === 'button' || attrVal === 'pointer') return 'link';
    if (attrVal === 'hidden' || attrVal === 'none') return 'hidden';
  }

  // 3. Project row detection
  if (target.closest('[data-project-id], .projects-row-item, .projects-row-btn')) {
    return 'project';
  }

  // 4. Interactive buttons and links
  if (target.closest('button, a, [role="button"], [role="link"]')) {
    return 'link';
  }

  return 'default';
}

function luminanceOf(color: string): { luminance: number; alpha: number } | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m?.[1]) return null;
  const parts = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  const [r = 0, g = 0, b = 0, alpha = 1] = parts;
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return { luminance: 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b), alpha };
}

/**
 * Resolves cursor tone from the surface underneath.
 * 'dark' tone means the surface is dark (formwork) so the marker is light (limewash).
 * 'light' tone means the surface is light (limewash, concrete) so the marker is dark (ink).
 * An explicit `data-cursor-tone` or dark sheet class wins; otherwise the first opaque
 * background colour up the tree decides, so every surface (sheets, the building window,
 * the header, dialogs) gets a marker with at least 3:1 contrast.
 */
export function resolveCursorTone(target: Element | null): CursorTone {
  if (!target) return 'light';

  const toneEl = target.closest('[data-cursor-tone], [data-sheet-tone], .sheet-tone-dark');
  if (toneEl) {
    const cursorTone = toneEl.getAttribute('data-cursor-tone');
    if (cursorTone === 'dark') return 'dark';
    if (cursorTone === 'light') return 'light';

    const sheetTone = toneEl.getAttribute('data-sheet-tone');
    if (sheetTone === 'dark' || toneEl.classList.contains('sheet-tone-dark')) {
      return 'dark';
    }
  }

  for (let el: Element | null = target; el; el = el.parentElement) {
    const parsed = luminanceOf(getComputedStyle(el).backgroundColor);
    if (parsed && parsed.alpha > 0.5) {
      // Marker colours are formwork (L about 0.02) and limewash (L about 0.8): pick the one
      // with the higher contrast against this surface.
      return parsed.luminance < 0.2 ? 'dark' : 'light';
    }
  }

  return 'light';
}
