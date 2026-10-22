import { MOTION } from '../motion';
import type { FaceKind } from './house';
import { DETAIL_STRIDE, DISSOLVE_CLASSES, HOUSE, ITEM_STRIDE, type BspModel } from './houseModel';
import { apply, pose as poseMatrix, project, sub, type Camera, type Mat3, type Vec3 } from './math';

export interface Pose {
  rx: number;
  ry: number;
  rz: number;
}

/** The kinds in the order the shipped model numbers them (checked by the model test). */
const KINDS: readonly FaceKind[] = [
  'wall',
  'roof',
  'trim',
  'stone',
  'glass',
  'door',
  'line',
  'muntin',
  'slab',
];

/**
 * Appearance classes: a kind, a flat tone (0 lit, 1 side, 2 shaded) and how it is drawn. A face with
 * only real edges is one path (fill and edge); a piece with a seam (a cut made by the BSP) is a fill
 * whose stroke is its own colour, so no crack shows, followed by a stroke-only path of its real edges.
 */
const FACE_MOD = { solid: 0, seam: 1, open: 2 } as const;
export const FACE_CLASSES: readonly string[] = KINDS.flatMap((k) =>
  [0, 1, 2].flatMap((tone) => {
    const base = `hm-face hm-${k}${tone ? ` hm-t${tone}` : ''}`;
    return [base, `${base} hm-seam`, `${base} hm-open`];
  }),
);
const classOf = (kind: number, tone: number, mod: number) => (kind * 3 + tone) * 3 + mod;
/** The kind of an appearance class. */
export const kindOfClass = (cls: number): FaceKind => KINDS[Math.floor(cls / 9)] as FaceKind;
/** How an appearance class is drawn (see FACE_MOD). */
export const modOfClass = (cls: number): number => cls % 3;

interface FrameFace {
  d: string;
  /** Index into FACE_CLASSES. */
  cls: number;
  /** Opacity of the face while the house dissolves (1 = whole). */
  opacity: number;
}

interface FrameDimension {
  /** Line and end ticks as one path. */
  d: string;
  label: string;
  lx: number;
  ly: number;
  /** Projected length of the line in drawing units (short lines are hidden). */
  length: number;
}

export interface Frame {
  /** Paths in paint order (farthest first); neighbours of one class that cannot overlap are joined. */
  faces: FrameFace[];
  ground: string;
  dimensions: FrameDimension[];
  /** Screen y of the ground plane under the middle of the house. */
  groundY: number;
}

export interface FrameOptions {
  /** 1 / eye distance from the model centre (0 = orthographic). */
  invDistance: number;
  /** Half the smaller side of the drawing area, in drawing units. */
  halfSize: number;
  cx: number;
  cy: number;
  /** Fraction of `halfSize` the bounding sphere may fill (leaves a margin for strokes). */
  fill?: number;
  /** Raise the house in stages: 0 = nothing yet, 1 = finished (the default). */
  build?: number;
  /** Take the house down, top first: 0 = whole, 1 = only the plinth is left. */
  dissolve?: number;
  /** Draw surface hairlines (siding, shingles, battens); false while turning on a phone. */
  lines?: boolean;
  /** Drawing units per CSS pixel, for the rule that hides hairlines closer than 1.5 px. */
  unitsPerPx?: number;
  /** Override the fitted scale (drawing units per metre), used when the house lands on the window. */
  scale?: number;
  /**
   * Path coordinates are whole numbers of 1/quantum drawing units (default 1): integers are far
   * cheaper to format and to parse than decimals. The group that holds the faces is scaled by
   * 1 / quantum, and stroke widths in the face CSS are multiplied by quantum.
   */
  quantum?: number;
}

/** The eye never comes closer to the model centre than this many bounding radii. */
const MIN_EYE_RADII = 1.5;

/** Pixels per model unit that keeps the whole bounding sphere inside the drawing at any rotation. */
export function fitScale(model: BspModel, opts: FrameOptions): number {
  if (opts.scale !== undefined) return opts.scale;
  const fill = opts.fill ?? 1;
  const nearest =
    1 / (1 - model.radius * Math.min(opts.invDistance, 1 / (MIN_EYE_RADII * model.radius)));
  return (opts.halfSize * fill) / (model.radius * nearest);
}

/**
 * The scale and centre that stand the house in its front elevation (orthographic) with its ground
 * line at `groundY` and its footprint spanning x0 to x1, in drawing units. The hero house lands
 * here at the end of the morph, so the plinth it leaves matches the building's footprint.
 */
export function landing(
  target: { x0: number; x1: number; groundY: number },
  model: BspModel = HOUSE,
): { scale: number; cx: number; cy: number } {
  const scale = (target.x1 - target.x0) / (model.footprint.x1 - model.footprint.x0);
  const footCentre = (model.footprint.x0 + model.footprint.x1) / 2;
  return {
    scale,
    cx: (target.x0 + target.x1) / 2 - (footCentre - model.centre[0]) * scale,
    cy: target.groundY - model.centre[1] * scale,
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Progress (0 to 1) of one dissolve class for an overall dissolve value. */
function dissolveClassProgress(dissolve: number, cls: number): number {
  const w = MOTION.model3d.dissolveWindows[cls];
  if (!w) return 0;
  return Math.max(0, Math.min(1, (dissolve - w[0]) / (w[1] - w[0])));
}

const matrixOf = (o: Pose | Mat3): Mat3 => ('rx' in o ? poseMatrix(o.rx, o.ry, o.rz) : o);

/** The eye's position in model space (far away along the view axis when orthographic). */
function eyeOf(m: Mat3, model: BspModel, inv: number): [number, number, number] {
  const e = inv > 0 ? 1 / inv : 1e6;
  return [
    model.centre[0] + (m[6] ?? 0) * e,
    model.centre[1] + (m[7] ?? 0) * e,
    model.centre[2] + (m[8] ?? 0) * e,
  ];
}

/**
 * Walk the BSP from the eye, calling `visit` for each node's coplanar items, farthest first. An item
 * is passed only if it faces the eye (back faces are culled by the side of the plane the eye is on).
 */
function walk(
  model: BspModel,
  eye: readonly [number, number, number],
  visit: (item: number, node: number) => void,
) {
  const { nodes, nodePlane, itemSign } = model;
  const go = (n: number) => {
    if (n < 0) return;
    const p = n * 4;
    const side =
      (nodePlane[p] as number) * eye[0] +
      (nodePlane[p + 1] as number) * eye[1] +
      (nodePlane[p + 2] as number) * eye[2] -
      (nodePlane[p + 3] as number);
    const sign = side > 0 ? 1 : -1;
    go(nodes[p + (side > 0 ? 3 : 2)] as number);
    const first = nodes[p] as number;
    const count = nodes[p + 1] as number;
    for (let k = 0; k < count; k++) {
      if ((itemSign[first + k] as number) * sign > 0) visit(first + k, n);
    }
    go(nodes[p + (side > 0 ? 2 : 3)] as number);
  };
  go(0);
}

interface Run {
  cls: number;
  opacity: number;
  d: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** How many runs back a new path may look for one of its class to join. */
const LOOK_BACK = 24;
/** Stroke allowance when testing whether two paths could overlap. */
const MARGIN = 2.5;

/**
 * Per-frame scratch: projected vertices and their formatted text, filled on first use so only
 * vertices of visible pieces are formatted.
 */
const scratch = {
  stamp: new Int32Array(0),
  sx: new Float64Array(0),
  sy: new Float64Array(0),
  text: [] as string[],
  frame: 0,
};

/**
 * Rotate, order, cull and project the house for one orientation. The order comes from the model's
 * BSP walked from the eye, so it is correct at every angle; each piece is followed at once by its own
 * detail (clipped to it), so detail can never show through a nearer face. Paths are joined into as
 * few runs as the order allows: a path may join an earlier run of its class only if it cannot overlap
 * anything painted since (compared by bounding box).
 *
 * This runs every animation frame, so it works on flat number arrays and formats a vertex only when
 * a visible piece uses it.
 */
export function buildFrame(
  orientation: Pose | Mat3,
  opts: FrameOptions,
  model: BspModel = HOUSE,
): Frame {
  const m = matrixOf(orientation);
  const scale = fitScale(model, opts);
  const inv = Math.min(opts.invDistance, 1 / (MIN_EYE_RADII * model.radius));
  const eyeZ = inv > 0 ? 1 / inv : 1;
  const [cxm, cym, czm] = model.centre;
  const m0 = m[0] ?? 0,
    m1 = m[1] ?? 0,
    m2 = m[2] ?? 0,
    m3 = m[3] ?? 0,
    m4 = m[4] ?? 0,
    m5 = m[5] ?? 0,
    m6 = m[6] ?? 0,
    m7 = m[7] ?? 0,
    m8 = m[8] ?? 0;
  void eyeZ;

  // How far each solid has been raised (a smoothstep over its build window), and how far it has
  // dissolved (opacity and a small settle downward)
  const groups = model.groups;
  const build = opts.build ?? 1;
  const dissolve = opts.dissolve ?? 0;
  const drawLines = opts.lines ?? true;
  const Q = opts.quantum ?? 1;
  const pxScale = scale / (opts.unitsPerPx ?? 1);
  const groupK = new Float64Array(groups);
  const groupOpacity = new Float64Array(groups);
  const groupDrop = new Float64Array(groups);
  for (let g = 0; g < groups; g++) {
    const w = model.groupBuild[g] as readonly [number, number];
    const t = build >= 1 ? 1 : Math.max(0, Math.min(1, (build - w[0]) / (w[1] - w[0])));
    groupK[g] = smooth(t);
    const cls = model.groupDissolve[g] as number;
    const dp =
      dissolve > 0 && cls < DISSOLVE_CLASSES - 1 ? smooth(dissolveClassProgress(dissolve, cls)) : 0;
    groupOpacity[g] = Math.round((1 - dp) * 100) / 100;
    groupDrop[g] = dp * MOTION.model3d.dissolveSettleMetres;
  }

  const nv = model.v.length / 3;
  if (scratch.stamp.length < nv) {
    scratch.stamp = new Int32Array(nv);
    scratch.sx = new Float64Array(nv);
    scratch.sy = new Float64Array(nv);
    scratch.text = new Array<string>(nv).fill('');
  }
  const frameId = ++scratch.frame;
  const { stamp, sx, sy, text } = scratch;
  const { v, vg, slots, items, details, nodePlane } = model;

  /** Project a vertex on first use this frame. */
  const touch = (i: number) => {
    if (stamp[i] === frameId) return;
    stamp[i] = frameId;
    const g = vg[i] as number;
    const base = model.groupBase[g] as number;
    const x = (v[i * 3] as number) - cxm;
    const y =
      base +
      ((v[i * 3 + 1] as number) - base) * (groupK[g] as number) -
      (groupDrop[g] as number) -
      cym;
    const z = (v[i * 3 + 2] as number) - czm;
    const px = m0 * x + m1 * y + m2 * z;
    const py = m3 * x + m4 * y + m5 * z;
    const pz = m6 * x + m7 * y + m8 * z;
    const f = 1 / (1 - pz * inv);
    const X = Math.round((opts.cx + px * scale * f) * Q);
    const Y = Math.round((opts.cy - py * scale * f) * Q);
    sx[i] = X;
    sy[i] = Y;
    text[i] = `${X} ${Y}`;
  };

  const runs: Run[] = [];
  const add = (
    cls: number,
    opacity: number,
    d: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    let k = runs.length - 1;
    const margin = MARGIN * Q;
    for (let steps = 0; k >= 0 && steps < LOOK_BACK; steps++, k--) {
      const r = runs[k] as Run;
      if (r.cls === cls && r.opacity === opacity) {
        r.d += d;
        if (x0 < r.x0) r.x0 = x0;
        if (y0 < r.y0) r.y0 = y0;
        if (x1 > r.x1) r.x1 = x1;
        if (y1 > r.y1) r.y1 = y1;
        return;
      }
      if (r.x0 - margin <= x1 && r.x1 + margin >= x0 && r.y0 - margin <= y1 && r.y1 + margin >= y0)
        break;
    }
    runs.push({ cls, opacity, d, x0, y0, x1, y1 });
  };

  /** A polygon of `n` slots from `start`: its path, bounding box, and path of real edges. */
  const polygon = (
    start: number,
    n: number,
    mask: number,
    kind: number,
    tone: number,
    opacity: number,
  ) => {
    let d = '';
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (let k = 0; k < n; k++) {
      const i = slots[start + k] as number;
      touch(i);
      d += `${k === 0 ? 'M' : 'L'}${text[i]}`;
      const X = sx[i] as number;
      const Y = sy[i] as number;
      if (X < x0) x0 = X;
      if (X > x1) x1 = X;
      if (Y < y0) y0 = Y;
      if (Y > y1) y1 = Y;
    }
    if (mask === (1 << n) - 1) {
      add(classOf(kind, tone, FACE_MOD.solid), opacity, `${d}Z`, x0, y0, x1, y1);
      return;
    }
    add(classOf(kind, tone, FACE_MOD.seam), opacity, `${d}Z`, x0, y0, x1, y1);
    let e = '';
    let open = false;
    for (let k = 0; k < n; k++) {
      if (mask & (1 << k)) {
        const a = slots[start + k] as number;
        const b = slots[start + ((k + 1) % n)] as number;
        if (!open) e += `M${text[a]}`;
        e += `L${text[b]}`;
        open = true;
      } else open = false;
    }
    if (e) add(classOf(kind, tone, FACE_MOD.open), opacity, e, x0, y0, x1, y1);
  };

  const eye = eyeOf(m, model, inv);
  walk(model, eye, (it, node) => {
    const o = it * ITEM_STRIDE;
    const g = items[o + 2] as number;
    if ((groupK[g] as number) < 0.002) return;
    const opacity = groupOpacity[g] as number;
    if (opacity < 0.01) return;
    polygon(
      items[o + 4] as number,
      items[o + 5] as number,
      items[o + 6] as number,
      items[o] as number,
      items[o + 1] as number,
      opacity,
    );
    // Detail lying on this piece, painted straight after it
    const first = items[o + 7] as number;
    const count = items[o + 8] as number;
    if (count === 0) return;
    // How squarely the piece faces the viewer, for the rule that hides crowded hairlines
    const cos = Math.abs(
      (nodePlane[node * 4] as number) * m6 +
        (nodePlane[node * 4 + 1] as number) * m7 +
        (nodePlane[node * 4 + 2] as number) * m8,
    );
    for (let k = 0; k < count; k++) {
      const q = (first + k) * DETAIL_STRIDE;
      const kind = details[q] as number;
      const n = details[q + 3] as number;
      if (n === 2) {
        // A hairline: dropped on phones while turning, and when its pattern is crowded
        const gap = details[q + 5] as number;
        if (kind === 6) {
          if (!drawLines) continue;
          if (gap > 0 && (gap / 1000) * pxScale * cos < MOTION.model3d.minLinePx) continue;
        }
        const a = slots[details[q + 2] as number] as number;
        const b = slots[(details[q + 2] as number) + 1] as number;
        touch(a);
        touch(b);
        add(
          classOf(kind, 0, FACE_MOD.solid),
          opacity,
          `M${text[a]}L${text[b]}`,
          Math.min(sx[a] as number, sx[b] as number),
          Math.min(sy[a] as number, sy[b] as number),
          Math.max(sx[a] as number, sx[b] as number),
          Math.max(sy[a] as number, sy[b] as number),
        );
      } else {
        polygon(
          details[q + 2] as number,
          n,
          details[q + 4] as number,
          kind,
          details[q + 1] as number,
          opacity,
        );
      }
    }
  });

  // Ground outline and dimension lines (a handful of points; plain helpers are fine here)
  const cam: Camera = { invDistance: inv, scale, cx: opts.cx, cy: opts.cy };
  const rotate = (p: Vec3): Vec3 => apply(m, sub(p, model.centre));
  const proj = (p: Vec3) => project(rotate(p), cam);
  const num = (n: number) => n.toFixed(1);
  const pathOf = (pts: { x: number; y: number }[], close = true) =>
    `M${pts.map((p) => `${num(p.x)} ${num(p.y)}`).join('L')}${close ? 'Z' : ''}`;
  const plus = (p: Vec3, t: Vec3, k: number): Vec3 => [
    p[0] + t[0] * k,
    p[1] + t[1] * k,
    p[2] + t[2] * k,
  ];

  const dimensions = model.dimensions.map((dim) => {
    const a = proj(dim.from);
    const b = proj(dim.to);
    const ta = proj(plus(dim.from, dim.tick, 1));
    const ta2 = proj(plus(dim.from, dim.tick, -1));
    const tb = proj(plus(dim.to, dim.tick, 1));
    const tb2 = proj(plus(dim.to, dim.tick, -1));
    const mid: Vec3 = [
      (dim.from[0] + dim.to[0]) / 2 + dim.labelShift[0],
      (dim.from[1] + dim.to[1]) / 2 + dim.labelShift[1],
      (dim.from[2] + dim.to[2]) / 2 + dim.labelShift[2],
    ];
    const label = proj(mid);
    return {
      d: `${pathOf([a, b], false)}${pathOf([ta, ta2], false)}${pathOf([tb, tb2], false)}`,
      label: dim.label,
      lx: label.x,
      ly: label.y,
      length: Math.hypot(a.x - b.x, a.y - b.y),
    };
  });

  return {
    faces: runs.map((r) => ({ d: r.d, cls: r.cls, opacity: r.opacity })),
    ground: model.ground.map((outline) => pathOf(outline.map(proj))).join(''),
    dimensions,
    groundY: proj([model.centre[0], 0, model.centre[2]]).y,
  };
}

export interface IdPolygon {
  /** Source face index (the face of the source geometry this piece was cut from). */
  id: number;
  pts: { x: number; y: number }[];
}

/**
 * The house's body pieces only (no detail), farthest first, projected: for the reference test, which
 * paints each in a unique colour and compares with a z-buffer render of the source geometry.
 */
export function buildIdPolygons(
  orientation: Pose | Mat3,
  opts: FrameOptions,
  model: BspModel = HOUSE,
): IdPolygon[] {
  const m = matrixOf(orientation);
  const scale = fitScale(model, opts);
  const inv = Math.min(opts.invDistance, 1 / (MIN_EYE_RADII * model.radius));
  const out: IdPolygon[] = [];
  const eye = eyeOf(m, model, inv);
  const { v, slots, items } = model;
  walk(model, eye, (it) => {
    const o = it * ITEM_STRIDE;
    const start = items[o + 4] as number;
    const n = items[o + 5] as number;
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k < n; k++) {
      const i = (slots[start + k] as number) * 3;
      const p = apply(m, [
        (v[i] as number) - model.centre[0],
        (v[i + 1] as number) - model.centre[1],
        (v[i + 2] as number) - model.centre[2],
      ] as Vec3);
      const f = 1 / (1 - p[2] * inv);
      pts.push({ x: opts.cx + p[0] * scale * f, y: opts.cy - p[1] * scale * f });
    }
    out.push({ id: items[o + 3] as number, pts });
  });
  return out;
}

export interface GizmoAxis {
  label: 'x' | 'y' | 'z';
  x: number;
  y: number;
  depth: number;
}

/** The x, y and z axes under the same rotation, as end points around (cx, cy). */
export function gizmoAxes(
  orientation: Pose | Mat3,
  length: number,
  cx: number,
  cy: number,
): GizmoAxis[] {
  const m = matrixOf(orientation);
  const axes: [GizmoAxis['label'], Vec3][] = [
    ['x', [1, 0, 0]],
    ['y', [0, 1, 0]],
    ['z', [0, 0, 1]],
  ];
  return axes
    .map(([label, v]) => {
      const r = apply(m, v);
      return { label, x: cx + r[0] * length, y: cy - r[1] * length, depth: r[2] };
    })
    .sort((a, b) => a.depth - b.depth);
}

/** Default three-quarter view used at rest, in the no-JS fallback and by Reset view. */
export const DEFAULT_POSE: Pose = {
  rx: MOTION.model3d.restRx,
  ry: MOTION.model3d.restRy,
  rz: MOTION.model3d.restRz,
};

/** Drawing area of the model SVG. */
export const VIEW = { width: 1000, height: 800, cx: 500, cy: 400 } as const;

/** Mild perspective used at rest. */
export const REST_INV_DISTANCE = MOTION.model3d.restInvDistance;

export function restOptions(invDistance = REST_INV_DISTANCE): FrameOptions {
  return {
    invDistance,
    halfSize: Math.min(VIEW.width, VIEW.height) / 2,
    cx: VIEW.cx,
    cy: VIEW.cy,
    fill: 0.98,
  };
}
