/**
 * Authoritative motion numbers and curves animated by GSAP / Lenis.
 * Static values live in tokens.css; all animated thresholds and values reside here.
 */
export const MOTION = {
  sheetStack: {
    scaleMin: 0.94,
    scaleMax: 1,
    radiusSheetPx: 32,
    radiusSquarePx: 0,
    dimOverlayOpacity: 0.4,
    transformOrigin: 'center top',
    ease: 'power2.out',
  },
  scroll: {
    duration: 1.2,
    ease: 'power2.out',
    lagSmoothing: 0,
    resizeDebounceMs: 150,
  },
} as const;
