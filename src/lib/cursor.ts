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

/**
 * Resolves cursor tone based on surface underneath.
 * 'dark' tone means the surface is dark (e.g. formwork) so cursor is light (limewash).
 * 'light' tone means surface is light (e.g. limewash, concrete) so cursor is dark (ink).
 */
export function resolveCursorTone(target: Element | null): CursorTone {
  if (!target) return 'light';

  // Check closest element declaring explicit tone
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

  return 'light';
}
