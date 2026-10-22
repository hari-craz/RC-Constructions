import { HOUSE } from '../../lib/model3d/houseModel';
import {
  eulerOf,
  Q_IDENTITY,
  qFromEuler,
  qSlerp,
  qToMat3,
  rollQ,
  tiltQ,
  turnQ,
  type Quat,
} from '../../lib/model3d/orientation';
import {
  buildFrame,
  buildIdPolygons,
  DEFAULT_POSE,
  FACE_CLASSES,
  fitScale,
  gizmoAxes,
  landing,
  REST_INV_DISTANCE,
  type Frame,
  type FrameOptions,
} from '../../lib/model3d/render';
import { morphRamp, onMorph, type MorphState } from '../../lib/morph';
import { MOTION } from '../../lib/motion';
import { siteTarget } from '../../lib/siteTarget';

const M = MOTION.model3d;
const MO = MOTION.morph;
const NARROW_QUERY = '(width < 1024px)';

export type Axis = 'turn' | 'tilt' | 'roll';

export interface ControllerElements {
  /** The whole widget; receives data-* state and focus/hover events. */
  root: HTMLElement;
  /** The interactive area (pointer drag, keyboard); on desktop also the area the house stands in. */
  stage: HTMLElement;
  /** The svg inside the hero, and the fixed full-screen layer svg that carries the house later. */
  heroSvg: SVGSVGElement;
  layerSvg: SVGSVGElement | null;
  /** The group holding ground, dimensions and faces; it moves between the two svgs. */
  scene: SVGGElement;
  faces: SVGGElement;
  ground: SVGPathElement;
  dims: SVGGElement;
  gizmo: SVGGElement;
}

export interface ControllerOptions {
  reducedMotion: boolean;
  onInteract: () => void;
}

interface PoolSlot {
  path: SVGPathElement;
  d: string;
  opacity: number;
  hidden: boolean;
}

/** The rest orientation (three-quarter view), and the front elevation the morph eases to. */
const Q_REST = qFromEuler(DEFAULT_POSE.rx, DEFAULT_POSE.ry, DEFAULT_POSE.rz);

/** Face paths are whole numbers of quarter pixels; their group is scaled to match (see the face CSS). */
const FACE_QUANTUM = 4;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const svgNs = 'http://www.w3.org/2000/svg';

/** The dissolve value (0 to 1) for a morph value. */
const dissolveOf = (m: number) =>
  clamp01((m - MO.dissolveStart) / (MO.dissolveEnd - MO.dissolveStart));

/** The drawing area the house is fitted to, in viewport pixels (drawing units are CSS pixels). */
interface View {
  cx: number;
  cy: number;
  halfSize: number;
  fill: number;
  /** Fitted scale at rest (px per metre). */
  scale0: number;
}

/**
 * Drives the hero house: auto-rotate, drag with inertia, button and key steps, the scroll morph
 * (front elevation, landing on the building's footprint, dissolving top first) and the axis gizmo.
 * One requestAnimationFrame loop runs only while something moves; at rest nothing is scheduled.
 *
 * Drawing units are CSS pixels of the viewport, so the same scene can sit in the hero svg or in
 * the fixed layer svg without any change of coordinates.
 */
export class ModelController {
  /** The house's orientation (a unit quaternion); the matrix is made once per frame. */
  private q: Quat = Q_REST;
  private anim: { from: Quat; to: Quat; start: number } | null = null;
  private vel = { ry: 0, rx: 0 };
  private autoOn = true;
  private hovered = false;
  private focused = false;
  private dragging = false;
  private visible = true;
  private resumeAt = 0;
  private morph: MorphState = { m: 0, beyond: 0 };
  private bobAmp = 0;
  private bobPhase = 0;
  private wasAuto = false;
  private raf = 0;
  private last = 0;
  private destroyed = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastMove = 0;
  private frameMsSum = 0;
  private frameMsMax = 0;
  private frameCount = 0;
  private frameStatAt = 0;
  private classPools: PoolSlot[][] = [];
  private classUsed = new Int32Array(FACE_CLASSES.length);
  private desired: SVGPathElement[] = [];
  private dimNodes: { line: SVGPathElement; label: SVGGElement; text: SVGTextElement }[] = [];
  /** The gizmo: one path for the three axis lines and a label each (positioned by one transform). */
  private gizmoLines: SVGPathElement | null = null;
  private gizmoLabels: { label: string; text: SVGTextElement; anchor: string }[] = [];
  private frames = 0;
  private autoSpin = false;
  /** How much of the house has been raised (the intro): 0 to 1. */
  private built = 0;
  private view: View = { cx: 500, cy: 400, halfSize: 400, fill: 1.08, scale0: 40 };
  /** Scale and centre that put the house's ground line and footprint on the building's. */
  private target = { scale: 40, cx: 500, cy: 400 };
  private narrow = window.matchMedia(NARROW_QUERY).matches;
  private host: 'hero' | 'layer' = 'hero';
  private mixNow = -1;
  private groundOpacity = '';
  private plinthOpacity = '';
  private idMode = false;
  private remeasure: (() => void) | null = null;
  private idPool: SVGPathElement[] = [];
  private resumeTimer = 0;
  private lodOn = false;
  private lodTimer = 0;
  private phoneQuery = window.matchMedia('(width < 768px)');
  private cleanups: (() => void)[] = [];

  constructor(
    private readonly el: ControllerElements,
    private readonly opts: ControllerOptions,
  ) {
    this.built = opts.reducedMotion ? 1 : 0;
    this.buildStatic();
    this.bind();
    this.render();
    if (new URLSearchParams(window.location.search).has('hm-test')) this.installTestHook();
  }

  /**
   * Test-only (`?hm-test`): hold the house still, hide the rest of the page and expose a hook to set
   * the orientation, so tests can render the real SVG at any angle and compare it with a reference.
   */
  private installTestHook() {
    this.built = 1;
    this.autoOn = false;
    const style = document.createElement('style');
    style.textContent =
      '.nav-bar,.hero-content,.hero-model-controls,.hero-model-hint,.hero-model-gizmo,.stage-backdrop,.loading-line,.skip-link{display:none !important}.hero-model-widget{animation:none !important}';
    document.head.appendChild(style);
    // The hidden controls change the stage's size: measure again now, not after a resize event
    this.remeasure?.();
    (window as unknown as { __hm: unknown }).__hm = {
      setPose: (rx: number, ry: number, rz: number) => {
        this.q = qFromEuler(rx, ry, rz);
        this.anim = null;
        this.vel = { ry: 0, rx: 0 };
        this.render();
      },
      /** Draw each body piece in a unique colour (no edges, detail or anti-aliasing). */
      idMode: (on: boolean) => {
        this.idMode = on;
        this.render();
      },
      /** The projection in use, so a test can render the same view with a reference renderer. */
      state: () => {
        const o = this.frameOptions(REST_INV_DISTANCE);
        return {
          cx: o.cx,
          cy: o.cy,
          scale: fitScale(HOUSE, o),
          invDistance: REST_INV_DISTANCE,
          centre: HOUSE.centre,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    };
    this.render();
  }

  /** Public state for tests and the toggle button. */
  get autoRotate(): boolean {
    return this.autoOn;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.resumeTimer);
    window.clearTimeout(this.lodTimer);
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }

  // ----- actions -------------------------------------------------------------------------------

  /** Rotate by one step about an axis, easing (or snapping under reduced motion). */
  step(axis: Axis, direction: 1 | -1) {
    this.interact();
    const base = this.anim ? this.anim.to : this.q;
    const d = direction * M.stepDeg;
    if (axis === 'turn') this.moveTo(turnQ(base, d));
    else if (axis === 'tilt') this.moveTo(tiltQ(base, d, M.tiltLimitDeg));
    else this.moveTo(rollQ(base, d));
  }

  reset() {
    this.interact();
    this.moveTo(Q_REST);
  }

  toggleAuto(): boolean {
    this.autoOn = !this.autoOn;
    this.interact();
    this.resumeAt = 0;
    this.request();
    return this.autoOn;
  }

  // ----- internals -----------------------------------------------------------------------------

  private moveTo(to: Quat) {
    if (this.opts.reducedMotion) {
      this.q = to;
      this.anim = null;
      this.render();
      return;
    }
    this.anim = { from: this.q, to, start: performance.now() };
    this.vel = { ry: 0, rx: 0 };
    this.request();
  }

  /** Any user input: pause auto-rotate, restart the idle timer, tell the host once. */
  private interact() {
    this.scheduleResume();
    this.opts.onInteract();
  }

  /** Auto-rotate restarts this long after the last input; a timer, not a loop, waits it out. */
  private scheduleResume(delay: number = M.resumeMs) {
    this.resumeAt = performance.now() + delay;
    window.clearTimeout(this.resumeTimer);
    this.resumeTimer = window.setTimeout(() => this.request(), delay + 30);
  }

  private request() {
    if (this.destroyed || this.raf) return;
    this.raf = requestAnimationFrame((t) => this.tick(t));
  }

  private autoActive(now: number): boolean {
    return (
      !this.opts.reducedMotion &&
      this.autoOn &&
      this.visible &&
      !document.hidden &&
      !this.hovered &&
      !this.focused &&
      !this.dragging &&
      !this.anim &&
      now >= this.resumeAt &&
      this.morph.m < MO.autoStopShare &&
      this.built >= 1
    );
  }

  private tick(now: number) {
    this.raf = 0;
    if (this.destroyed) return;
    // A slow auto-turn (18 degrees a second) needs no more than about 30 updates a second
    if (
      this.autoSpin &&
      !this.anim &&
      !this.dragging &&
      this.vel.ry === 0 &&
      this.vel.rx === 0 &&
      now - this.last < 1000 / M.autoFps - 2
    ) {
      this.request();
      return;
    }
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    const started = performance.now();

    // Eased button / key step
    if (this.anim) {
      const t = Math.min(1, (now - this.anim.start) / (M.stepSeconds * 1000));
      const e = easeOutCubic(t);
      this.q = qSlerp(this.anim.from, this.anim.to, e);
      if (t >= 1) {
        this.q = this.anim.to;
        this.anim = null;
      }
    } else if (!this.dragging && (this.vel.ry !== 0 || this.vel.rx !== 0)) {
      // Inertia after a drag
      this.q = tiltQ(turnQ(this.q, this.vel.ry * dt), this.vel.rx * dt, M.tiltLimitDeg);
      const decay = Math.exp(-M.inertiaDecay * dt);
      this.vel.ry *= decay;
      this.vel.rx *= decay;
      if (Math.abs(this.vel.ry) < M.inertiaMinSpeed) this.vel.ry = 0;
      if (Math.abs(this.vel.rx) < M.inertiaMinSpeed) this.vel.rx = 0;
    }

    // Intro: the house is raised in stages behind the headline
    if (this.built < 1) {
      this.built = Math.min(1, this.built + dt / M.introSeconds);
    }

    // Auto-rotate with a gentle bob; pausing bakes the bob into the pose so nothing jumps
    const auto = this.autoActive(now);
    if (auto) {
      if (!this.wasAuto) {
        this.bobAmp = 0;
        this.bobPhase = 0;
      }
      this.q = turnQ(this.q, (360 / M.autoSeconds) * dt);
      this.bobAmp = Math.min(1, this.bobAmp + dt / M.bobRampSeconds);
      this.bobPhase += dt;
    } else if (this.wasAuto) {
      this.q = tiltQ(this.q, this.bobOffset(), M.tiltLimitDeg);
      this.bobAmp = 0;
    }
    this.wasAuto = auto;
    this.autoSpin = auto;
    this.updateLod(
      auto || this.dragging || this.anim !== null || this.vel.ry !== 0 || this.vel.rx !== 0,
    );
    this.render();

    const spent = performance.now() - started;
    this.frameMsSum += spent;
    if (spent > this.frameMsMax) this.frameMsMax = spent;
    this.frameCount += 1;
    if (now - this.frameStatAt > 1000 && this.frameCount > 0) {
      this.el.root.dataset.frameMs = (this.frameMsSum / this.frameCount).toFixed(2);
      this.el.root.dataset.frameMsMax = this.frameMsMax.toFixed(2);
      this.frameMsMax = 0;
      this.frameMsSum = 0;
      this.frameCount = 0;
      this.frameStatAt = now;
    }

    const moving =
      auto || this.built < 1 || this.anim !== null || this.vel.ry !== 0 || this.vel.rx !== 0;
    if (moving) this.request();
    else this.last = 0;
  }

  private bobOffset(): number {
    return M.bobDeg * this.bobAmp * Math.sin((this.bobPhase * 2 * Math.PI) / M.bobSeconds);
  }

  /**
   * Level of detail on phones: surface hairlines are left out while the house is being dragged or
   * turns by itself, and come back shortly after it stops (massing, openings and trim stay).
   */
  private updateLod(moving: boolean) {
    if (!this.phoneQuery.matches) {
      this.lodOn = false;
      return;
    }
    if (moving) {
      this.lodOn = true;
      window.clearTimeout(this.lodTimer);
      this.lodTimer = 0;
    } else if (this.lodOn && !this.lodTimer) {
      this.lodTimer = window.setTimeout(() => {
        this.lodTimer = 0;
        this.lodOn = false;
        if (!this.destroyed) this.render();
      }, M.lodRestoreMs);
    }
  }

  // ----- rendering -----------------------------------------------------------------------------

  /** The morph value in use: none at all under reduced motion (the house simply swaps out). */
  private morphValue(): number {
    return this.opts.reducedMotion ? 0 : this.morph.m;
  }

  /** The orientation and perspective for this frame: the turning house eases to the front elevation. */
  private displayPose(): { q: Quat; invDistance: number } {
    const q = this.wasAuto ? tiltQ(this.q, this.bobOffset(), M.tiltLimitDeg) : this.q;
    const e = easeInOut(clamp01(this.morphValue() / MO.frontEnd));
    if (e === 0) return { q, invDistance: REST_INV_DISTANCE };
    return {
      q: qSlerp(q, Q_IDENTITY, e),
      invDistance: lerp(REST_INV_DISTANCE, 0, e),
    };
  }

  /** Options for one frame: the fit, the landing on the building, the intro and the dissolve. */
  private frameOptions(invDistance: number): FrameOptions {
    const v = this.view;
    const m = this.morphValue();
    const land = morphRamp(m, MO.landStart, MO.landEnd);
    return {
      invDistance,
      halfSize: v.halfSize,
      cx: lerp(v.cx, this.target.cx, land),
      cy: lerp(v.cy, this.target.cy, land),
      fill: v.fill,
      scale: lerp(v.scale0, this.target.scale, land),
      build: this.built,
      dissolve: dissolveOf(m),
      lines: !this.lodOn,
      quantum: FACE_QUANTUM,
    };
  }

  private buildStatic() {
    const { gizmo } = this.el;
    this.el.faces.setAttribute('transform', `scale(${1 / FACE_QUANTUM})`);
    // Gizmo: three axis lines (one path) with a label each
    const lines = document.createElementNS(svgNs, 'path');
    lines.setAttribute('class', 'hm-axis');
    gizmo.appendChild(lines);
    this.gizmoLines = lines;
    for (const label of ['x', 'y', 'z'] as const) {
      const text = document.createElementNS(svgNs, 'text');
      text.setAttribute('class', 'hm-axis-label');
      text.textContent = label;
      gizmo.appendChild(text);
      this.gizmoLabels.push({ label, text, anchor: '' });
    }
  }

  private ensureDims(frame: Frame) {
    while (this.dimNodes.length < frame.dimensions.length) {
      const line = document.createElementNS(svgNs, 'path');
      line.setAttribute('class', 'hm-dim');
      const label = document.createElementNS(svgNs, 'g');
      label.setAttribute('class', 'hm-dim-label');
      const rect = document.createElementNS(svgNs, 'rect');
      rect.setAttribute('x', '-40');
      rect.setAttribute('y', '-13');
      rect.setAttribute('width', '80');
      rect.setAttribute('height', '26');
      rect.setAttribute('rx', '2');
      const text = document.createElementNS(svgNs, 'text');
      text.setAttribute('y', '5');
      text.setAttribute('text-anchor', 'middle');
      label.append(rect, text);
      this.el.dims.append(line, label);
      this.dimNodes.push({ line, label, text });
    }
  }

  /**
   * Where the scene is drawn. Below 1024 px it lives in the fixed full-screen layer behind the text
   * all the time. On desktop it stands in the hero (behind the headline) until the morph begins,
   * then moves to the layer above the site window, so it can land on the window's footprint.
   */
  private placeScene(m: number) {
    const layer = this.el.layerSvg;
    const want: 'hero' | 'layer' = layer && (this.narrow || m > 0) ? 'layer' : 'hero';
    if (want === this.host) return;
    (want === 'layer' && layer ? layer : this.el.heroSvg).appendChild(this.el.scene);
    this.host = want;
  }

  /** Palette mix (0 on the limewash hero, 1 on the dark window), written only when it changes. */
  private applyMix(m: number) {
    const mix = Math.round(morphRamp(m, MO.recolourStart, MO.recolourEnd) * 50) / 50;
    if (mix === this.mixNow) return;
    this.mixNow = mix;
    this.el.heroSvg.style.setProperty('--hm-mix', String(mix));
    this.el.layerSvg?.style.setProperty('--hm-mix', String(mix));
  }

  private render() {
    const { q, invDistance } = this.displayPose();
    const matrix = qToMat3(q);
    const m = this.morphValue();
    this.placeScene(m);
    this.applyMix(m);
    if (this.idMode) {
      this.renderIds(matrix, this.frameOptions(invDistance));
      return;
    }
    const frame = buildFrame(matrix, this.frameOptions(invDistance));

    // One path element per run, taken from a pool for its appearance class, so a class never changes
    // on an element (that would restyle it every frame); the elements are then put in paint order
    // with the fewest moves
    const used = this.classUsed;
    used.fill(0);
    const desired = this.desired;
    desired.length = 0;
    for (const f of frame.faces) {
      let pool = this.classPools[f.cls];
      if (!pool) pool = this.classPools[f.cls] = [];
      const k = used[f.cls] as number;
      used[f.cls] = k + 1;
      let slot = pool[k];
      if (!slot) {
        const path = document.createElementNS(svgNs, 'path');
        path.setAttribute('class', FACE_CLASSES[f.cls] as string);
        this.el.faces.appendChild(path);
        slot = { path, d: '', opacity: 1, hidden: false };
        pool.push(slot);
      }
      if (slot.d !== f.d) {
        slot.path.setAttribute('d', f.d);
        slot.d = f.d;
      }
      if (slot.opacity !== f.opacity) {
        if (f.opacity < 1) slot.path.setAttribute('opacity', String(f.opacity));
        else slot.path.removeAttribute('opacity');
        slot.opacity = f.opacity;
      }
      if (slot.hidden) {
        slot.path.style.display = '';
        slot.hidden = false;
      }
      desired.push(slot.path);
    }
    for (let c = 0; c < this.classPools.length; c++) {
      const pool = this.classPools[c];
      if (!pool) continue;
      for (let k = used[c] as number; k < pool.length; k++) {
        const slot = pool[k] as PoolSlot;
        if (!slot.hidden) {
          slot.path.style.display = 'none';
          slot.hidden = true;
        }
      }
    }
    let cursor: ChildNode | null = this.el.faces.firstChild;
    for (const el of desired) {
      if (el === cursor) cursor = cursor.nextSibling;
      else this.el.faces.insertBefore(el, cursor);
    }
    this.el.ground.setAttribute('d', frame.ground);
    const groundOpacity = (1 - clamp01(m / MO.groundFadeEnd)).toFixed(2);
    if (groundOpacity !== this.groundOpacity) {
      this.groundOpacity = groundOpacity;
      this.el.ground.setAttribute('opacity', groundOpacity);
    }

    // After the dissolve only the plinth is left; it fades as the pit is dug where it stood, and the
    // drawing is hidden once nothing of the house remains (under reduced motion, once the hero has
    // left the viewport)
    const plinth =
      m >= 1 ? 1 - clamp01(this.morph.beyond / (window.innerHeight * MO.plinthFadeViewport)) : 1;
    const gone = this.opts.reducedMotion ? this.morph.m >= 1 : plinth <= 0;
    const plinthText = plinth.toFixed(2);
    if (plinthText !== this.plinthOpacity) {
      this.plinthOpacity = plinthText;
      this.el.scene.setAttribute('opacity', plinthText);
    }
    const svg = this.host === 'layer' ? this.el.layerSvg : this.el.heroSvg;
    if (svg) {
      const display = gone ? 'none' : '';
      if (svg.style.display !== display) svg.style.display = display;
    }

    this.ensureDims(frame);
    frame.dimensions.forEach((d, i) => {
      const node = this.dimNodes[i];
      if (!node) return;
      const hide = d.length < M.minDimensionUnits || this.built < 1 || m > 0.001;
      const display = hide ? 'none' : '';
      if (node.line.style.display !== display) {
        node.line.style.display = display;
        node.label.style.display = display;
      }
      node.line.setAttribute('d', d.d);
      node.label.setAttribute('transform', `translate(${d.lx.toFixed(1)} ${d.ly.toFixed(1)})`);
      if (node.text.textContent !== d.label) node.text.textContent = d.label;
    });

    let axisPath = '';
    // Always x, y, z in that order (not by depth), so a path always lists the same axis first
    for (const a of gizmoAxes(matrix, M.gizmoLength, 0, 0).sort((p, q) =>
      p.label < q.label ? -1 : 1,
    )) {
      axisPath += `M0 0L${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
      const node = this.gizmoLabels.find((n) => n.label === a.label);
      if (!node) continue;
      node.text.setAttribute(
        'transform',
        `translate(${(a.x + (a.x >= 0 ? 6 : -6)).toFixed(1)} ${(a.y + 4).toFixed(1)})`,
      );
      const anchor = a.x >= 0 ? 'start' : 'end';
      if (node.anchor !== anchor) {
        node.text.setAttribute('text-anchor', anchor);
        node.anchor = anchor;
      }
    }
    this.gizmoLines?.setAttribute('d', axisPath);

    // State for tests and styles; written every fourth frame while auto-rotating (cheaper)
    this.frames += 1;
    if (this.autoSpin && this.frames % 4 !== 0) return;
    const ds = this.el.root.dataset;
    const euler = eulerOf(q);
    ds.rx = euler.rx.toFixed(2);
    ds.ry = euler.ry.toFixed(2);
    ds.rz = euler.rz.toFixed(2);
    ds.auto = this.autoActive(performance.now()) ? 'true' : 'false';
    ds.autoRotate = this.autoOn ? 'on' : 'off';
    ds.built = this.built.toFixed(3);
    ds.dissolve = dissolveOf(m).toFixed(3);
    ds.host = this.host;
    ds.plinth = plinth.toFixed(2);
  }

  /** Test mode: each body piece in its own flat colour, in paint order, with no edges or detail. */
  private renderIds(matrix: ReturnType<typeof qToMat3>, o: FrameOptions) {
    const polys = buildIdPolygons(matrix, { ...o, scale: fitScale(HOUSE, o) });
    this.el.faces.style.display = 'none';
    this.el.ground.style.display = 'none';
    this.el.dims.style.display = 'none';
    while (this.idPool.length < polys.length) {
      const path = document.createElementNS(svgNs, 'path');
      path.setAttribute('shape-rendering', 'crispEdges');
      path.setAttribute('stroke', 'none');
      this.el.scene.appendChild(path);
      this.idPool.push(path);
    }
    this.idPool.forEach((path, i) => {
      const poly = polys[i];
      if (!poly) {
        path.style.display = 'none';
        return;
      }
      path.style.display = '';
      path.setAttribute(
        'd',
        `M${poly.pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L')}Z`,
      );
      // Eight apart in each channel, so small compositing differences cannot change an id
      path.style.fill = `rgb(${(poly.id % 32) * 8},${(Math.floor(poly.id / 32) % 32) * 8},200)`;
    });
  }

  // ----- input ---------------------------------------------------------------------------------

  private listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener(type, fn as EventListener, options);
    this.cleanups.push(() => target.removeEventListener(type, fn as EventListener));
  }

  private bind() {
    const { root, stage } = this.el;

    // Pause on hover and focus; resume after the idle delay
    this.listen(stage, 'pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        this.hovered = true;
        this.request();
      }
    });
    this.listen(stage, 'pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.hovered = false;
        this.scheduleResume();
      }
    });
    // Focus on the model itself pauses it (the visitor is rotating by keyboard); the buttons
    // beside it do not, so toggling Auto-rotate on starts it straight away
    this.listen(stage, 'focus', () => {
      this.focused = true;
    });
    this.listen(stage, 'blur', () => {
      this.focused = false;
      this.scheduleResume();
    });

    // Drag: one pointer turns and tilts, shift-drag (or two fingers) rolls
    this.listen(stage, 'pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stage.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragging = true;
      this.anim = null;
      this.vel = { ry: 0, rx: 0 };
      this.lastMove = performance.now();
      this.interact();
    });
    this.listen(stage, 'pointermove', (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      const now = performance.now();
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (this.pointers.size >= 2) {
        // Two-finger twist rolls about z
        const others = [...this.pointers.entries()].find(([id]) => id !== e.pointerId);
        if (others) {
          const o = others[1];
          const before = Math.atan2(prev.y - o.y, prev.x - o.x);
          const after = Math.atan2(e.clientY - o.y, e.clientX - o.x);
          let delta = ((after - before) * 180) / Math.PI;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          this.q = rollQ(this.q, -delta);
        }
      } else if (e.shiftKey && e.pointerType !== 'touch') {
        this.q = rollQ(this.q, -dx * M.rollDegPerPx);
      } else {
        this.q = turnQ(this.q, dx * M.dragDegPerPx);
        if (e.pointerType !== 'touch') {
          this.q = tiltQ(this.q, dy * M.dragDegPerPx, M.tiltLimitDeg);
        }
        const secs = Math.max(0.001, (now - this.lastMove) / 1000);
        // Smoothed release velocity (deg/s)
        const cap = (v: number) => Math.max(-M.inertiaMaxSpeed, Math.min(M.inertiaMaxSpeed, v));
        this.vel.ry = cap(lerp(this.vel.ry, (dx * M.dragDegPerPx) / secs, 0.5));
        this.vel.rx =
          e.pointerType === 'touch' ? 0 : cap(lerp(this.vel.rx, (dy * M.dragDegPerPx) / secs, 0.5));
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.lastMove = now;
      this.interact();
      this.updateLod(true);
      this.render();
    });
    const release = (e: PointerEvent) => {
      if (!this.pointers.delete(e.pointerId)) return;
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      if (this.pointers.size === 0) {
        this.dragging = false;
        // A pause before release means no fling
        if (performance.now() - this.lastMove > 80 || this.opts.reducedMotion) {
          this.vel = { ry: 0, rx: 0 };
        }
        this.interact();
        this.request();
      }
    };
    this.listen(stage, 'pointerup', release);
    this.listen(stage, 'pointercancel', release);

    // Keyboard
    this.listen(stage, 'keydown', (e) => {
      if (e.target !== stage || e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowLeft') this.step('turn', -1);
      else if (key === 'ArrowRight') this.step('turn', 1);
      else if (key === 'ArrowUp') this.step('tilt', 1);
      else if (key === 'ArrowDown') this.step('tilt', -1);
      else if (key === 'q' || key === 'Q') this.step('roll', 1);
      else if (key === 'e' || key === 'E') this.step('roll', -1);
      else if (key === '0' || key === 'Home') this.reset();
      else if (key === ' ') this.toggleAuto();
      else handled = false;
      if (handled) e.preventDefault();
    });

    // The drawing area, in viewport pixels. Below 1024 px it is the whole screen (the fixed layer,
    // house behind the text); on desktop it is the stage beside the headline.
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      this.narrow = window.matchMedia(NARROW_QUERY).matches;
      const r = this.el.stage.getBoundingClientRect();
      const nav = parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.5;
      const area = this.narrow
        ? { left: 0, top: nav, width: vw, height: vh - nav }
        : { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 };
      const halfSize = Math.min(area.width, area.height) / 2;
      const fill = this.narrow ? M.overlayFill : M.heroFill;
      const cx = area.left + area.width / 2;
      const cy = area.top + area.height * (this.narrow ? M.overlayCentreY : 0.5);
      this.view = {
        cx,
        cy,
        halfSize,
        fill,
        scale0: fitScale(HOUSE, { invDistance: REST_INV_DISTANCE, halfSize, fill, cx, cy }),
      };

      // Where the house lands: the ground line and width of the building's footprint
      const t = siteTarget(vw, vh, this.narrow);
      this.target = landing(t);

      // Both svgs use viewport pixels as drawing units
      this.el.heroSvg.setAttribute(
        'viewBox',
        `${r.left.toFixed(1)} ${r.top.toFixed(1)} ${(r.width || 1).toFixed(1)} ${(r.height || 1).toFixed(1)}`,
      );
      this.el.layerSvg?.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      this.render();
    };
    this.remeasure = measure;
    const ro = new ResizeObserver(measure);
    ro.observe(this.el.stage);
    this.cleanups.push(() => ro.disconnect());
    window.addEventListener('resize', measure, { passive: true });
    this.cleanups.push(() => window.removeEventListener('resize', measure));
    measure();

    // Off-screen and hidden tab
    const io = new IntersectionObserver((entries) => {
      this.visible = entries.some((en) => en.isIntersecting);
      if (this.visible) this.request();
    });
    io.observe(root);
    this.cleanups.push(() => io.disconnect());

    const onVisibility = () => {
      if (!document.hidden) this.request();
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

    // The morph follows the scroll (see lib/morph.ts)
    let seen = false;
    const offMorph = onMorph((state) => {
      const changed = !seen || state.m !== this.morph.m || state.beyond !== this.morph.beyond;
      const prev = this.morph.m;
      seen = true;
      this.morph = state;
      // The controls and hint (low in the hero) go first, and the house can no longer be handled
      const keep = this.opts.reducedMotion ? 1 : 1 - clamp01(state.m / MO.controlsFadeEnd);
      root.style.setProperty('--hm-controls-opacity', keep.toFixed(3));
      const away = state.m >= MO.controlsFadeEnd;
      if (root.inert !== away) root.inert = away;
      // Hold the idle timer while the hero scrolls away so auto-rotate restarts calmly
      if (state.m > 0 && state.m !== prev) this.scheduleResume(400);
      if (changed) this.request();
    });
    this.cleanups.push(offMorph);

    // Hold the rest angle for a moment, then start turning
    this.scheduleResume(
      this.opts.reducedMotion ? M.restHoldMs : M.introSeconds * 1000 + M.restHoldMs,
    );
    this.request();
  }
}
