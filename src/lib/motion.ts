/**
 * Authoritative motion numbers and curves animated by GSAP / Lenis.
 * Static values live in tokens.css; all animated thresholds and values reside here.
 */
export const MOTION = {
  sheetStack: {
    radiusSheetPx: 32,
    radiusSquarePx: 0,
    dimOverlayOpacity: 0.1,
    ease: 'power2.out',
  },
  motionGate: {
    idleMs: 8000,
    mountDelayMs: 150,
  },
  scroll: {
    duration: 1.2,
    ease: 'power2.out',
    lagSmoothing: 0,
    resizeDebounceMs: 150,
  },
  /* hero.headline* timings are mirrored by the CSS in Hero.css (the headline rises via CSS) */
  hero: {
    headlineStart: 0.5,
    headlineDuration: 0.9,
    headlineStagger: 0.12,
    totalDuration: 2.6,
    ease: 'power2.out',
  },
  /* The hero 3D house (src/lib/model3d and src/components/HeroModel) */
  model3d: {
    /** Seconds per revolution about y while auto-rotating, and the gentle bob on x. */
    autoSeconds: 20,
    bobDeg: 8,
    bobSeconds: 9,
    bobRampSeconds: 1,
    /** Auto-rotate redraws at most this many times a second. */
    autoFps: 30,
    /** Auto-rotate resumes after this long without interaction. */
    resumeMs: 3000,
    /** The hint line stays this long unless the visitor interacts first. */
    hintMs: 6000,
    /** Each button or key press, and how long the ease takes. */
    stepDeg: 15,
    stepSeconds: 0.25,
    /** Pointer drag: degrees per pixel, inertia decay per second and the stop speed (deg/s). */
    dragDegPerPx: 0.45,
    inertiaDecay: 3.5,
    inertiaMinSpeed: 4,
    tiltLimitDeg: 80,
    /** Roll while twisting with two fingers or dragging with Shift. */
    rollDegPerPx: 0.4,
    /** Rest pose (three-quarter view) and a mild perspective (1 / eye distance in model units). */
    restRx: 16,
    restRy: -35,
    restRz: 0,
    restInvDistance: 1 / 60,
    /** Scroll hand-off: share of the hand-off by which the house reaches the front elevation. */
    frontShare: 0.15,
    /** Share of the hand-off at which the model starts to fade (opacity only). */
    fadeStartShare: 0.1,
    /** The house is gone before the arriving sheet reaches its base: desktop and phone. */
    fadeEndShare: 0.3,
    fadeEndSharePhone: 0.56,
    /** The controls and hint (low in the hero) go first. */
    controlsFadeEndShare: 0.1,
    /** Axis gizmo reach in drawing units. */
    gizmoLength: 36,
    /** Dimension label text is never drawn smaller than this on screen (px), and lines shorter than this many drawing units are hidden. */
    minLabelPx: 12,
    minDimensionUnits: 70,
    /** The house holds the rest angle this long before auto-rotate starts. */
    restHoldMs: 1500,
  },
  building: {
    // While the foundation is drawn the whole drawing is lifted (and may be scaled) so the site
    // fills the window; it settles to its resting frame as the structure rises (process step 4)
    siteCameraScale: 1,
    siteCameraLiftDesktop: 270,
    siteCameraLiftPhone: 190,
    stageStart: 'top 85%',
    stageEnd: 'top 20%',
    strokeEase: 'power2.out',
    fillEase: 'power1.inOut',
    digDuration: 0.5,
    footingDuration: 0.3,
    footingStagger: 0.08,
    foundationDrawDuration: 0.3,
    columnRiseDuration: 0.3,
    columnRiseStagger: 0.06,
    levelDuration: 0.5,
    levelStagger: 0.55,
    slabDrawDuration: 0.5,
    slabDrawStagger: 0.55,
    memberDuration: 0.3,
    memberStagger: 0.06,
    starterStagger: 0.02,
    wallDuration: 0.4,
    wallStagger: 0.12,
    wallFillDuration: 0.4,
    detailDuration: 0.4,
    detailStagger: 0.04,
    windowLitStagger: 0.05,
    windowSwitchDuration: 0.01,
    dimensionDrawDuration: 0.5,
    dimensionLabelDelay: 0.3,
    plotFadeShare: 0.5,
    windowEnterViewport: 1,
  },
  stats: {
    countDuration: 1.6,
    ease: 'power2.out',
  },
  founder: {
    revealDuration: 0.9,
    ease: 'power2.out',
  },
  cursor: {
    quickToDuration: 0.1,
    quickToEase: 'power2.out',
    frameSize: 28,
    dotSize: 3,
    crosshairLength: 12,
  },
  overlay: {
    sheetRiseDuration: 0.7,
    sheetFallDuration: 0.5,
    ease: 'power2.out',
    backdropDimOpacity: 0.4,
    scaleBackground: 0.94,
  },
} as const;
