import { MOTION } from '../../lib/motion';

/*
 * Below 1024 px the building is a fixed layer behind the text. Its fills are a quiet ghost, but its
 * hairlines and detail (window frames, mullions, lit panes, rails, the stair, set-out strings) run
 * behind the words and make them busy. Where a block of text sits over such a detail the detail is
 * hidden (visibility only, so nothing moves) and structure there keeps its fill but loses its
 * outline (Building.css, `data-clear`); both return as soon as the text has scrolled off. The rule
 * is by region, not global: between the text blocks the building is drawn whole.
 *
 * Text rectangles are measured in document coordinates once (and again when the layout changes),
 * so each scroll frame is only arithmetic plus one bounding-box read per detail element.
 */
/** Detail that is hidden under text (window frames and openings, panes, mullions, rails, strings, and the thin slab and beam strips, which read as highlight bars behind a line of text). */
const DETAIL =
  '.b-mullion, .b-frame, .b-pane, .b-rail, .b-stair, .b-string, .b-starter, .b-level, .b-datum, .b-opening, .b-door, .b-slab, .b-beam, .b-canopy, .b-ground-slab, .b-stub, .b-tie';
/** Structure whose outline is hidden under text (the fill stays, so the building is still there). */
const OUTLINE = '.b-wall, .b-col, .b-core, .b-parapet, .b-footing';
const TEXT_SCOPE = '.sheet-stage :is(h1, h2, h3, p, li, span, td, dt, dd, a, strong)';

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Document-space rectangles of every line of text in the sheets. */
function measureText(margin: number): Box[] {
  const out: Box[] = [];
  const y0 = window.scrollY;
  const x0 = window.scrollX;
  for (const el of document.querySelectorAll(TEXT_SCOPE)) {
    const own = [...el.childNodes].some(
      (n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0,
    );
    if (!own) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    for (const r of range.getClientRects()) {
      if (r.width < 4 || r.height < 4) continue;
      out.push({
        l: r.left + x0 - margin,
        t: r.top + y0 - margin,
        r: r.right + x0 + margin,
        b: r.bottom + y0 + margin,
      });
    }
  }
  return out;
}

/**
 * Start hiding building detail under text. Returns a cleanup that restores everything.
 * `layer` is the element that holds the building svg.
 */
export function startTextClear(layer: HTMLElement): () => void {
  const T = MOTION.textClear;
  const query = window.matchMedia('(width < 1024px)');
  let boxes: Box[] = [];
  let measureDirty = true;
  let frame = 0;
  // What is cleared now: detail is hidden, structure loses its outline (both by a data attribute)
  const cleared = new Set<Element>();

  const clearAll = () => {
    for (const el of cleared) el.removeAttribute('data-clear');
    cleared.clear();
  };

  const covers = (el: Element, near: Box[], sx: number, sy: number) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    for (const b of near) {
      if (r.right > b.l - sx && r.left < b.r - sx && r.bottom > b.t - sy && r.top < b.b - sy) {
        return true;
      }
    }
    return false;
  };

  const update = () => {
    frame = 0;
    if (!query.matches) {
      clearAll();
      return;
    }
    if (measureDirty) {
      boxes = measureText(T.marginPx);
      measureDirty = false;
    }
    const sy = window.scrollY;
    const sx = window.scrollX;
    // Only text near the screen can matter
    const near = boxes.filter((b) => b.b - sy > -T.marginPx && b.t - sy < window.innerHeight);
    const apply = (selector: string, value: 'hide' | 'bare') => {
      for (const el of layer.querySelectorAll(selector)) {
        if (covers(el, near, sx, sy)) {
          if (!cleared.has(el)) {
            el.setAttribute('data-clear', value);
            cleared.add(el);
          }
        } else if (cleared.delete(el)) {
          el.removeAttribute('data-clear');
        }
      }
    };
    apply(DETAIL, 'hide');
    apply(OUTLINE, 'bare');
  };

  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const remeasure = () => {
    measureDirty = true;
    request();
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  const ro = new ResizeObserver(remeasure);
  ro.observe(document.body);
  void document.fonts?.ready.then(remeasure);
  query.addEventListener('change', remeasure);
  remeasure();

  return () => {
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', remeasure);
    query.removeEventListener('change', remeasure);
    ro.disconnect();
    cancelAnimationFrame(frame);
    clearAll();
  };
}
