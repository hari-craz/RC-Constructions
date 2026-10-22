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
    /** A fling never spins faster than this (deg/s), whatever the pointer events' timing; its travel (speed / inertiaDecay) stays under half a turn. */
    inertiaMaxSpeed: 360,
    tiltLimitDeg: 80,
    /** Roll while twisting with two fingers or dragging with Shift. */
    rollDegPerPx: 0.4,
    /** Rest pose (three-quarter view) and a mild perspective (1 / eye distance in model units). */
    restRx: 16,
    restRy: -35,
    restRz: 0,
    restInvDistance: 1 / 60,
    /** Axis gizmo reach in drawing units. */
    gizmoLength: 36,
    /** Dimension label text is never drawn smaller than this on screen (px), and lines shorter than this many drawing units are hidden. */
    minLabelPx: 12,
    minDimensionUnits: 70,
    /** The house holds the rest angle this long before auto-rotate starts. */
    restHoldMs: 600,
    /** Seconds the house takes to raise itself on first load (stage by stage). */
    introSeconds: 3.2,
    /**
     * Taking the house down, top first, as shares of the dissolve: roof, upper storey, ground
     * storey, porch. Each fades by opacity and settles a little downward; the plinth stays.
     */
    dissolveWindows: [
      [0, 0.4],
      [0.2, 0.62],
      [0.4, 0.86],
      [0.5, 0.9],
    ],
    dissolveSettleMetres: 0.45,
    /** Surface hairlines closer than this on screen are left out; they return this long after a turn stops on phones. */
    minLinePx: 1.5,
    lodRestoreMs: 120,
    /** Overlay layout below 1024 px: where the house centres in the hero and how much of the width it may use. */
    overlayCentreY: 0.49,
    overlayFill: 0.96,
    /** The share of its container the house's bounding sphere may fill at any rotation (it never clips). */
    heroFill: 0.98,
  },
  /*
   * The morph from the hero house to the building (src/lib/morph.ts). m runs 0 to 1 while the About
   * sheet arrives; every number below is a share of m. Scrubbed by scroll, so it reverses exactly.
   */
  morph: {
    /** The house reaches its front elevation (orthographic) by this share. */
    frontEnd: 0.25,
    /** It moves and scales until its ground line and width match the building's footprint. */
    landStart: 0.05,
    landEnd: 0.45,
    /** Its palette steps one tone darker and its ink turns to steel as it meets the dark window. */
    recolourStart: 0.2,
    recolourEnd: 0.45,
    /** The site window slides in (desktop) or the drawing appears behind the text (phones). */
    windowStart: 0.3,
    windowEnd: 0.5,
    /** The house dissolves top first: roof, upper storey, ground storey, porch. */
    dissolveStart: 0.5,
    dissolveEnd: 0.92,
    /** Below 1024 px the house is dimmed (to a ghost that text can be read over) across this stretch of the dissolve. */
    dimEnd: 0.6,
    /** The ground hairlines fade out by this share. */
    groundFadeEnd: 0.4,
    /** The controls and hint (low in the hero) go first. */
    controlsFadeEnd: 0.1,
    /** Below 1024 px: the hero text fades, then the stage backdrop turns from concrete to formwork. */
    heroTextFadeStart: 0.03,
    heroTextFadeEnd: 0.16,
    backdropStart: 0.18,
    backdropEnd: 0.3,
    /** The plinth that stays on the ground line fades over this much scroll (viewports) as the pit is dug. */
    plinthFadeViewport: 0.2,
    /** The house stops turning by itself once the morph has begun. */
    autoStopShare: 0.005,
  },
  /** Below 1024 px, building detail (hairlines, window frames, lit panes) under a block of text is hidden. */
  textClear: {
    /** How far around each line of text the detail is cleared. */
    marginPx: 6,
  },
  /** Below 1024 px the building is a fixed full-screen layer; text is read in the upper part of it. */
  stageLayer: {
    readingShare: 0.34,
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
    /** The first part of the foundation (excavation) is scrubbed over at least this much scroll (viewports). */
    foundationMinViewport: 0.25,
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
