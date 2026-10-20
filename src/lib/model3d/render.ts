import { MOTION } from '../motion';
import { DISSOLVE_CLASSES, HOUSE, type FaceKind, type HouseModel } from './house';
import { apply, pose as poseMatrix, project, sub, type Camera, type Vec3 } from './math';

export interface Pose {
  rx: number;
  ry: number;
  rz: number;
}

export interface FrameFace {
  d: string;
  kind: FaceKind;
  /** Flat tone 0 (lit), 1 or 2 (shaded) by the way the face points. */
  tone: 0 | 1 | 2;
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
  /** Visible faces, farthest first. */
  faces: FrameFace[];
  ground: string;
  dimensions: FrameDimension[];
  /** Screen y of the ground plane under the middle of the house (the clip line while it sinks). */
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
}

/** Pixels per model unit that keeps the whole bounding sphere inside the drawing at any rotation. */
export function fitScale(model: HouseModel, opts: FrameOptions): number {
  if (opts.scale !== undefined) return opts.scale;
  const fill = opts.fill ?? 1.08;
  const nearest = 1 / (1 - model.radius * opts.invDistance);
  return (opts.halfSize * fill) / (model.radius * nearest);
}

/**
 * The scale and centre that stand the house in its front elevation (orthographic) with its ground
 * line at `groundY` and its footprint spanning x0 to x1, in drawing units. The hero house lands
 * here at the end of the morph, so the plinth it leaves matches the building's footprint.
 */
export function landing(
  target: { x0: number; x1: number; groundY: number },
  model: HouseModel = HOUSE,
): { scale: number; cx: number; cy: number } {
  const scale = (target.x1 - target.x0) / (model.footprint.x1 - model.footprint.x0);
  const footCentre = (model.footprint.x0 + model.footprint.x1) / 2;
  return {
    scale,
    cx: (target.x0 + target.x1) / 2 - (footCentre - model.centre[0]) * scale,
    cy: target.groundY - model.centre[1] * scale,
  };
}

const num = (n: number) => n.toFixed(1);

const pathOf = (pts: { x: number; y: number }[], close = true) =>
  `M${pts.map((p) => `${num(p.x)} ${num(p.y)}`).join('L')}${close ? 'Z' : ''}`;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Progress (0 to 1) of one dissolve class for an overall dissolve value. */
function dissolveClassProgress(dissolve: number, cls: number): number {
  const w = MOTION.model3d.dissolveWindows[cls];
  if (!w) return 0;
  return Math.max(0, Math.min(1, (dissolve - w[0]) / (w[1] - w[0])));
}

/**
 * Rotate, project, cull and sort the house for one pose. Solids are sorted back to front by their
 * mean depth (with a small bias for parts that sit on others); faces inside a solid keep their
 * order, so windows and doors are painted after the wall they lie on.
 *
 * This runs every animation frame, so it works on flat number arrays, builds each path string once
 * and formats a vertex only when a visible face uses it.
 */
export function buildFrame(pose: Pose, opts: FrameOptions, model: HouseModel = HOUSE): Frame {
  const m = poseMatrix(pose.rx, pose.ry, pose.rz);
  const scale = fitScale(model, opts);
  const inv = opts.invDistance;
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

  // How far each solid has been raised (a smoothstep over its build window), and how far it has
  // dissolved (opacity and a small settle downward)
  const groups = model.groupBias.length;
  const build = opts.build ?? 1;
  const dissolve = opts.dissolve ?? 0;
  const drawLines = opts.lines ?? true;
  const pxScale = scale / (opts.unitsPerPx ?? 1);
  const groupK = new Float64Array(groups);
  const groupOpacity = new Float64Array(groups);
  const groupDrop = new Float64Array(groups);
  for (let g = 0; g < groups; g++) {
    const w = model.groupBuild[g] as { start: number; end: number };
    const t = build >= 1 ? 1 : Math.max(0, Math.min(1, (build - w.start) / (w.end - w.start)));
    groupK[g] = smooth(t);
    const cls = model.groupDissolve[g] as number;
    const dp =
      dissolve > 0 && cls < DISSOLVE_CLASSES - 1 ? smooth(dissolveClassProgress(dissolve, cls)) : 0;
    groupOpacity[g] = Math.round((1 - dp) * 100) / 100;
    groupDrop[g] = dp * MOTION.model3d.dissolveSettleMetres;
  }

  // Rotated vertices (x, y, z triples) and their screen positions
  const n = model.vertices.length;
  const rx = new Float64Array(n * 3);
  const sxN = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const v = model.vertices[i] as Vec3;
    const g = model.vertexGroup[i] as number;
    const base = model.groupBase[g] as number;
    const x = v[0] - cxm;
    const y = base + (v[1] - base) * (groupK[g] as number) - (groupDrop[g] as number) - cym;
    const z = v[2] - czm;
    const px = m0 * x + m1 * y + m2 * z;
    const py = m3 * x + m4 * y + m5 * z;
    const pz = m6 * x + m7 * y + m8 * z;
    rx[i * 3] = px;
    rx[i * 3 + 1] = py;
    rx[i * 3 + 2] = pz;
    const f = 1 / (1 - pz * inv);
    sxN[i * 2] = Math.round((opts.cx + px * scale * f) * 10) / 10;
    sxN[i * 2 + 1] = Math.round((opts.cy - py * scale * f) * 10) / 10;
  }
  // Screen coordinates are formatted on first use (a vertex is shared by several faces)
  const sx: (string | undefined)[] = new Array<string | undefined>(n);
  const text = (i: number): string => {
    let t = sx[i];
    if (t === undefined) {
      t = `${sxN[i * 2]} ${sxN[i * 2 + 1]}`;
      sx[i] = t;
    }
    return t;
  };

  // Mean depth per solid
  const zSum = new Float64Array(groups);
  const zCount = new Float64Array(groups);
  for (const face of model.faces) {
    for (const i of face.v) {
      zSum[face.group] = (zSum[face.group] ?? 0) + (rx[i * 3 + 2] ?? 0);
      zCount[face.group] = (zCount[face.group] ?? 0) + 1;
    }
  }
  const groupKey = new Float64Array(groups);
  for (let g = 0; g < groups; g++) {
    groupKey[g] = (zSum[g] ?? 0) / Math.max(1, zCount[g] ?? 1) - (model.groupBias[g] ?? 0) * 10;
  }

  const visible: {
    key: number;
    order: number;
    d: string;
    kind: FaceKind;
    tone: 0 | 1 | 2;
    opacity: number;
  }[] = [];
  const faceList = model.faces;
  for (let order = 0; order < faceList.length; order++) {
    const face = faceList[order] as (typeof faceList)[number];
    if ((groupK[face.group] as number) < 0.002) continue;
    const opacity = groupOpacity[face.group] as number;
    if (opacity < 0.01) continue;
    if (!drawLines && face.kind === 'line') continue;
    const a = (face.v[0] as number) * 3;
    const ax = rx[a] ?? 0,
      ay = rx[a + 1] ?? 0,
      az = rx[a + 2] ?? 0;
    let nx: number, ny: number, nz: number;
    if (face.normal) {
      // A hairline carries the outward normal of the surface it lies on
      const q = face.normal;
      nx = m0 * q[0] + m1 * q[1] + m2 * q[2];
      ny = m3 * q[0] + m4 * q[1] + m5 * q[2];
      nz = m6 * q[0] + m7 * q[1] + m8 * q[2];
    } else {
      const b = (face.v[1] as number) * 3;
      const c = (face.v[2] as number) * 3;
      const ux = (rx[b] ?? 0) - ax,
        uy = (rx[b + 1] ?? 0) - ay,
        uz = (rx[b + 2] ?? 0) - az;
      const vx = (rx[c] ?? 0) - ax,
        vy = (rx[c + 1] ?? 0) - ay,
        vz = (rx[c + 2] ?? 0) - az;
      nx = uy * vz - uz * vy;
      ny = uz * vx - ux * vz;
      nz = ux * vy - uy * vx;
    }
    const facing = inv > 0 ? nx * -ax + ny * -ay + nz * (eyeZ - az) > 0 : nz > 0;
    if (!facing) continue;
    // A pattern whose lines would sit closer than 1.5 px on screen (foreshortened by the angle
    // at which the face is seen) is left out rather than drawn as a smear
    if (face.gap !== undefined && face.kind === 'line') {
      const cos = Math.abs(nz) / (Math.hypot(nx, ny, nz) || 1);
      if (face.gap * pxScale * cos < MOTION.model3d.minLinePx) continue;
    }
    let d = '';
    for (let k = 0; k < face.v.length; k++) {
      d += `${k === 0 ? 'M' : 'L'}${text(face.v[k] as number)}`;
    }
    visible.push({
      key: groupKey[face.group] ?? 0,
      order,
      d: face.normal ? d : `${d}Z`,
      kind: face.kind,
      tone: face.tone,
      opacity,
    });
  }
  visible.sort((p, q) => p.key - q.key || p.order - q.order);

  // Ground outline and dimension lines (a handful of points; plain helpers are fine here)
  const cam: Camera = { invDistance: inv, scale, cx: opts.cx, cy: opts.cy };
  const rotate = (v: Vec3): Vec3 => apply(m, sub(v, model.centre));
  const proj = (v: Vec3) => project(rotate(v), cam);
  const plus = (v: Vec3, t: Vec3, k: number): Vec3 => [
    v[0] + t[0] * k,
    v[1] + t[1] * k,
    v[2] + t[2] * k,
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
    faces: visible.map((v) => ({ d: v.d, kind: v.kind, tone: v.tone, opacity: v.opacity })),
    ground: model.ground.map((outline) => pathOf(outline.map(proj))).join(''),
    dimensions,
    groundY: proj([model.centre[0], 0, model.centre[2]]).y,
  };
}

/**
 * Join neighbouring faces of the same kind into one path (same fill and stroke, so the picture is
 * the same) to keep the DOM work per frame small.
 */
export function mergeRuns(faces: readonly FrameFace[]): FrameFace[] {
  const out: FrameFace[] = [];
  for (const f of faces) {
    const last = out[out.length - 1];
    if (last && last.kind === f.kind && last.tone === f.tone && last.opacity === f.opacity) {
      last.d += f.d;
    } else out.push({ d: f.d, kind: f.kind, tone: f.tone, opacity: f.opacity });
  }
  return out;
}

export interface GizmoAxis {
  label: 'x' | 'y' | 'z';
  x: number;
  y: number;
  depth: number;
}

/** The x, y and z axes under the same rotation, as end points around (cx, cy). */
export function gizmoAxes(pose: Pose, length: number, cx: number, cy: number): GizmoAxis[] {
  const m = poseMatrix(pose.rx, pose.ry, pose.rz);
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
  };
}
