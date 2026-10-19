import { clampTilt, wrapAngle } from '../../lib/model3d/math';
import {
  buildFrame,
  DEFAULT_POSE,
  gizmoAxes,
  mergeRuns,
  REST_INV_DISTANCE,
  restOptions,
  VIEW,
  type Frame,
  type Pose,
} from '../../lib/model3d/render';
import { MOTION } from '../../lib/motion';

const M = MOTION.model3d;
/** Font size of dimension labels in drawing units (HeroModel.css). */
const LABEL_FONT_UNITS = 15;

export type Axis = 'turn' | 'tilt' | 'roll';

export interface ControllerElements {
  /** The whole widget; receives data-* state and focus/hover events. */
  root: HTMLElement;
  /** The interactive area (pointer drag, keyboard). */
  stage: HTMLElement;
  faces: SVGGElement;
  ground: SVGPathElement;
  dims: SVGGElement;
  gizmo: SVGGElement;
  /** The hero element used to measure scroll hand-off progress (the About sheet). */
  handoffTarget: () => HTMLElement | null;
}

export interface ControllerOptions {
  reducedMotion: boolean;
  onInteract: () => void;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const svgNs = 'http://www.w3.org/2000/svg';

/**
 * Drives the hero house: auto-rotate, drag with inertia, button and key steps, the scroll hand-off
 * to the front elevation, and the axis gizmo. One requestAnimationFrame loop runs only while
 * something moves; at rest nothing is scheduled.
 */
export class ModelController {
  private pose: Pose = { ...DEFAULT_POSE };
  private anim: { from: Pose; to: Pose; start: number } | null = null;
  private vel = { ry: 0, rx: 0 };
  private autoOn = true;
  private hovered = false;
  private focused = false;
  private dragging = false;
  private visible = true;
  private resumeAt = 0;
  private handoff = 0;
  private bobAmp = 0;
  private bobPhase = 0;
  private wasAuto = false;
  private raf = 0;
  private last = 0;
  private destroyed = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastMove = 0;
  private frameMsSum = 0;
  private frameCount = 0;
  private frameStatAt = 0;
  private paths: SVGPathElement[] = [];
  private dimNodes: { line: SVGPathElement; label: SVGGElement; text: SVGTextElement }[] = [];
  private gizmoNodes: { line: SVGLineElement; text: SVGTextElement }[] = [];
  private frames = 0;
  private autoSpin = false;
  private resumeTimer = 0;
  /** Labels are enlarged so their text is never smaller than MOTION.model3d.minLabelPx on screen. */
  private labelScale = 1;
  private cleanups: (() => void)[] = [];

  constructor(
    private readonly el: ControllerElements,
    private readonly opts: ControllerOptions,
  ) {
    this.buildStatic();
    this.bind();
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
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }

  // ----- actions -------------------------------------------------------------------------------

  /** Rotate by one step about an axis, easing (or snapping under reduced motion). */
  step(axis: Axis, direction: 1 | -1) {
    this.interact();
    const base = this.anim ? this.anim.to : this.pose;
    const to: Pose = { ...base };
    const d = direction * M.stepDeg;
    if (axis === 'turn') to.ry = base.ry + d;
    if (axis === 'tilt') to.rx = clampTilt(base.rx + d, M.tiltLimitDeg);
    if (axis === 'roll') to.rz = base.rz + d;
    this.moveTo(to);
  }

  reset() {
    this.interact();
    const base = this.currentBase();
    this.moveTo({
      rx: DEFAULT_POSE.rx,
      ry: base.ry + wrapAngle(DEFAULT_POSE.ry - base.ry),
      rz: base.rz + wrapAngle(DEFAULT_POSE.rz - base.rz),
    });
  }

  toggleAuto(): boolean {
    this.autoOn = !this.autoOn;
    this.interact();
    this.resumeAt = 0;
    this.request();
    return this.autoOn;
  }

  // ----- internals -----------------------------------------------------------------------------

  private currentBase(): Pose {
    return { ...this.pose };
  }

  private moveTo(to: Pose) {
    if (this.opts.reducedMotion) {
      this.pose = { ...to };
      this.anim = null;
      this.render();
      return;
    }
    this.anim = { from: this.currentBase(), to, start: performance.now() };
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
      this.handoff < 0.005
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
      this.pose = {
        rx: lerp(this.anim.from.rx, this.anim.to.rx, e),
        ry: lerp(this.anim.from.ry, this.anim.to.ry, e),
        rz: lerp(this.anim.from.rz, this.anim.to.rz, e),
      };
      if (t >= 1) {
        this.pose = { ...this.anim.to };
        this.anim = null;
      }
    } else if (!this.dragging && (this.vel.ry !== 0 || this.vel.rx !== 0)) {
      // Inertia after a drag
      this.pose.ry += this.vel.ry * dt;
      this.pose.rx = clampTilt(this.pose.rx + this.vel.rx * dt, M.tiltLimitDeg);
      const decay = Math.exp(-M.inertiaDecay * dt);
      this.vel.ry *= decay;
      this.vel.rx *= decay;
      if (Math.abs(this.vel.ry) < M.inertiaMinSpeed) this.vel.ry = 0;
      if (Math.abs(this.vel.rx) < M.inertiaMinSpeed) this.vel.rx = 0;
    }

    // Auto-rotate with a gentle bob; pausing bakes the bob into the pose so nothing jumps
    const auto = this.autoActive(now);
    if (auto) {
      if (!this.wasAuto) {
        this.bobAmp = 0;
        this.bobPhase = 0;
      }
      this.pose.ry += (360 / M.autoSeconds) * dt;
      this.bobAmp = Math.min(1, this.bobAmp + dt / M.bobRampSeconds);
      this.bobPhase += dt;
    } else if (this.wasAuto) {
      this.pose.rx = clampTilt(this.pose.rx + this.bobOffset(), M.tiltLimitDeg);
      this.bobAmp = 0;
    }
    this.wasAuto = auto;
    this.autoSpin = auto;
    this.pose.ry = wrapAngle(this.pose.ry);
    if (!this.anim) this.pose.rz = wrapAngle(this.pose.rz);

    this.render();

    this.frameMsSum += performance.now() - started;
    this.frameCount += 1;
    if (now - this.frameStatAt > 1000 && this.frameCount > 0) {
      this.el.root.dataset.frameMs = (this.frameMsSum / this.frameCount).toFixed(2);
      this.frameMsSum = 0;
      this.frameCount = 0;
      this.frameStatAt = now;
    }

    const moving = auto || this.anim !== null || this.vel.ry !== 0 || this.vel.rx !== 0;
    if (moving) this.request();
    else this.last = 0;
  }

  private bobOffset(): number {
    return M.bobDeg * this.bobAmp * Math.sin((this.bobPhase * 2 * Math.PI) / M.bobSeconds);
  }

  // ----- rendering -----------------------------------------------------------------------------

  private displayPose(): { pose: Pose; invDistance: number } {
    const rx = this.pose.rx + (this.wasAuto ? this.bobOffset() : 0);
    const e = this.opts.reducedMotion ? 0 : easeInOut(Math.min(1, this.handoff / M.frontShare));
    if (e === 0)
      return { pose: { rx, ry: this.pose.ry, rz: this.pose.rz }, invDistance: REST_INV_DISTANCE };
    return {
      pose: {
        rx: lerp(rx, 0, e),
        ry: lerp(wrapAngle(this.pose.ry), 0, e),
        rz: lerp(wrapAngle(this.pose.rz), 0, e),
      },
      invDistance: lerp(REST_INV_DISTANCE, 0, e),
    };
  }

  private buildStatic() {
    const { gizmo } = this.el;
    // Gizmo: three axis lines with labels, plus a centre pip
    for (const label of ['x', 'y', 'z'] as const) {
      const line = document.createElementNS(svgNs, 'line');
      line.setAttribute('class', 'hm-axis');
      const text = document.createElementNS(svgNs, 'text');
      text.setAttribute('class', 'hm-axis-label');
      text.textContent = label;
      gizmo.append(line, text);
      this.gizmoNodes.push({ line, text });
    }
  }

  private ensureFacePool(n: number) {
    while (this.paths.length < n) {
      const path = document.createElementNS(svgNs, 'path');
      this.el.faces.appendChild(path);
      this.paths.push(path);
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

  private render() {
    const { pose, invDistance } = this.displayPose();
    const frame = buildFrame(pose, restOptions(invDistance));

    const runs = mergeRuns(frame.faces);
    this.ensureFacePool(runs.length);
    runs.forEach((f, i) => {
      const path = this.paths[i] as SVGPathElement;
      path.setAttribute('d', f.d);
      const cls = `hm-face hm-${f.kind}`;
      if (path.getAttribute('class') !== cls) path.setAttribute('class', cls);
      if (path.style.display) path.style.display = '';
    });
    for (let i = runs.length; i < this.paths.length; i++) {
      const path = this.paths[i] as SVGPathElement;
      if (path.style.display !== 'none') path.style.display = 'none';
    }
    this.el.ground.setAttribute('d', frame.ground);

    this.ensureDims(frame);
    frame.dimensions.forEach((d, i) => {
      const node = this.dimNodes[i];
      if (!node) return;
      const hide = d.length < M.minDimensionUnits;
      const display = hide ? 'none' : '';
      if (node.line.style.display !== display) {
        node.line.style.display = display;
        node.label.style.display = display;
      }
      node.line.setAttribute('d', d.d);
      node.label.setAttribute(
        'transform',
        `translate(${d.lx.toFixed(1)} ${d.ly.toFixed(1)}) scale(${this.labelScale})`,
      );
      if (node.text.textContent !== d.label) node.text.textContent = d.label;
    });

    const axes = gizmoAxes(pose, M.gizmoLength, 0, 0);
    axes.forEach((a) => {
      const node = this.gizmoNodes.find((n) => n.text.textContent === a.label);
      if (!node) return;
      node.line.setAttribute('x1', '0');
      node.line.setAttribute('y1', '0');
      node.line.setAttribute('x2', a.x.toFixed(1));
      node.line.setAttribute('y2', a.y.toFixed(1));
      const tx = a.x + (a.x >= 0 ? 6 : -6);
      node.text.setAttribute('x', tx.toFixed(1));
      node.text.setAttribute('y', (a.y + 4).toFixed(1));
      node.text.setAttribute('text-anchor', a.x >= 0 ? 'start' : 'end');
    });

    // State for tests and styles; written every fourth frame while auto-rotating (cheaper)
    this.frames += 1;
    if (this.autoSpin && this.frames % 4 !== 0) return;
    const ds = this.el.root.dataset;
    ds.rx = pose.rx.toFixed(2);
    ds.ry = pose.ry.toFixed(2);
    ds.rz = pose.rz.toFixed(2);
    ds.auto = this.autoActive(performance.now()) ? 'true' : 'false';
    ds.autoRotate = this.autoOn ? 'on' : 'off';
    ds.handoff = this.handoff.toFixed(3);
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
          this.pose.rz -= delta;
        }
      } else if (e.shiftKey && e.pointerType !== 'touch') {
        this.pose.rz -= dx * M.rollDegPerPx;
      } else {
        this.pose.ry += dx * M.dragDegPerPx;
        if (e.pointerType !== 'touch') {
          this.pose.rx = clampTilt(this.pose.rx + dy * M.dragDegPerPx, M.tiltLimitDeg);
        }
        const secs = Math.max(0.001, (now - this.lastMove) / 1000);
        // Smoothed release velocity (deg/s)
        this.vel.ry = lerp(this.vel.ry, (dx * M.dragDegPerPx) / secs, 0.5);
        this.vel.rx =
          e.pointerType === 'touch' ? 0 : lerp(this.vel.rx, (dy * M.dragDegPerPx) / secs, 0.5);
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.lastMove = now;
      this.interact();
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

    // Keep label text readable: enlarge it when the drawing is shown small
    const measure = () => {
      const r = this.el.stage.getBoundingClientRect();
      const unitsPx = Math.min(r.width / VIEW.width, r.height / VIEW.height) || 1;
      this.labelScale = Math.min(3, Math.max(1, M.minLabelPx / (LABEL_FONT_UNITS * unitsPx)));
      this.render();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(this.el.stage);
    this.cleanups.push(() => ro.disconnect());
    measure();

    // Off-screen, hidden tab and scroll hand-off
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

    const onScroll = () => {
      const target = this.el.handoffTarget();
      if (!target) return;
      const vh = window.innerHeight || 1;
      const next = Math.max(0, Math.min(1, 1 - target.getBoundingClientRect().top / vh));
      if (next !== this.handoff) {
        this.handoff = next;
        // The controls and hint sit low in the hero, so the arriving sheet reaches them first
        const keep = this.opts.reducedMotion ? 1 : 1 - Math.min(1, next / M.controlsFadeEndShare);
        this.el.root.style.setProperty('--hm-controls-opacity', keep.toFixed(3));
        // Hold the idle timer while the hero scrolls away so auto-rotate restarts calmly
        if (next > 0) this.scheduleResume(400);
        this.request();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    this.cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
    onScroll();

    // Hold the rest angle for a moment, then start turning
    this.scheduleResume(M.restHoldMs);
    this.request();
  }
}
