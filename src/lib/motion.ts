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
  hero: {
    boundaryStart: 0.0,
    boundaryDuration: 1.0,
    stakesStart: 0.8,
    stakesDuration: 0.2,
    setbackStart: 0.6,
    setbackDuration: 0.8,
    footprintStart: 1.0,
    footprintDuration: 0.8,
    gridStart: 1.4,
    gridDuration: 0.6,
    gridStagger: 0.04,
    dimensionsStart: 1.8,
    dimensionsDuration: 0.8,
    dimensionLabelsDelay: 0.4,
    headlineStart: 0.5,
    headlineDuration: 0.9,
    headlineStagger: 0.12,
    totalDuration: 2.6,
    ease: 'power2.out',
    scrollLinked: {
      gridScaleMax: 1.35,
      ease: 'none',
    },
  },
} as const;
