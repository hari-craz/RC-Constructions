import { cross, dot, sub, type Vec3 } from './math';

/*
 * An original two-storey house as plain data, in metres. Front is +z. A main block holds an
 * integrated two-door garage on the left and, above the entrance, a projecting bay under a
 * front-facing cross gable. A front porch (stone-based tapered posts, a beam, its own small gable
 * and three steps) leads to the door; a set-back wing with an end gable closes the right. A stone
 * plinth runs round the footprint.
 *
 * Detail is flat decals lying on walls (window frames, sills, glass, door panels, garage panels,
 * corner boards) and hairline "lines" (siding, board-and-batten, shingle rows, mullions, stone
 * courses). Every solid carries a build window (0 to 1) so the house can be raised in stages, and a
 * dissolve class so it can be taken down top first (roofs, upper storey, ground storey, porch) while
 * the plinth stays.
 */
export type FaceKind =
  'wall' | 'roof' | 'trim' | 'stone' | 'glass' | 'door' | 'line' | 'muntin' | 'slab';

/** Paint order inside one solid: bodies, siding lines, then flat decals, then mullions on top. */
const RANK: Record<FaceKind, number> = {
  wall: 0,
  roof: 0,
  slab: 0,
  line: 1,
  stone: 2,
  trim: 3,
  glass: 4,
  door: 4,
  muntin: 5,
};

/** Dissolve classes, in the order the house is taken down. */
const DISSOLVE = { roof: 0, upper: 1, lower: 2, porch: 3, plinth: 4 } as const;
export const DISSOLVE_CLASSES = 5;

interface Face {
  /** Indices into `vertices`, wound anticlockwise seen from outside (two for a line). */
  v: readonly number[];
  kind: FaceKind;
  /** The solid this face belongs to; solids are sorted back to front, faces keep their order. */
  group: number;
  /** Outward normal of a line (lines have no winding of their own). */
  normal?: Vec3;
  /** Spacing of the pattern a line belongs to, in metres (lines are dropped when too close). */
  gap?: number;
  /** Flat tone 0 (lit), 1 or 2 (shaded) from the way the face points; only for solid fills. */
  tone: 0 | 1 | 2;
}

interface Dimension {
  from: Vec3;
  to: Vec3;
  /** Direction and length of the end ticks. */
  tick: Vec3;
  label: string;
  /** Model-space label offset so it clears the line. */
  labelShift: Vec3;
}

export interface HouseModel {
  vertices: readonly Vec3[];
  /** The solid each vertex belongs to (vertices are not shared between solids). */
  vertexGroup: readonly number[];
  faces: readonly Face[];
  /** Per solid: a depth bias that pulls it toward the viewer when depths tie (negative = nearer). */
  groupBias: readonly number[];
  /** Per solid: when it is raised during the intro, as fractions of the whole (0 to 1). */
  groupBuild: readonly { start: number; end: number }[];
  /** Per solid: the height it grows up from. */
  groupBase: readonly number[];
  /** Per solid: which dissolve class it belongs to (see DISSOLVE). */
  groupDissolve: readonly number[];
  /** Centre and radius of the bounding sphere (for fitting at every rotation). */
  centre: Vec3;
  radius: number;
  /** Height of the tallest point and the width of the footprint at the front (for the morph). */
  height: number;
  footprint: { x0: number; x1: number };
  /** The closest spacing between two hairlines of a pattern, in metres. */
  minLineSpacing: number;
  dimensions: readonly Dimension[];
  /** Ground outlines (plot, drive, path), hairlines drawn first. */
  ground: readonly (readonly Vec3[])[];
}

type Poly = { pts: Vec3[]; kind: FaceKind };
type Solid = { group: number; inside: Vec3 };

const p3 = (x: number, y: number, z: number): Vec3 => [x, y, z];
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function box(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  kind: FaceKind,
  /** Leave the top off when a roof sits on it (the roof closes it, and a coplanar lid would fight it). */
  top = true,
): Poly[] {
  const faces: Poly[] = [
    { pts: [p3(x0, y0, z1), p3(x1, y0, z1), p3(x1, y1, z1), p3(x0, y1, z1)], kind },
    { pts: [p3(x1, y0, z0), p3(x0, y0, z0), p3(x0, y1, z0), p3(x1, y1, z0)], kind },
    { pts: [p3(x1, y0, z1), p3(x1, y0, z0), p3(x1, y1, z0), p3(x1, y1, z1)], kind },
    { pts: [p3(x0, y0, z0), p3(x0, y0, z1), p3(x0, y1, z1), p3(x0, y1, z0)], kind },
    { pts: [p3(x0, y0, z0), p3(x1, y0, z0), p3(x1, y0, z1), p3(x0, y0, z1)], kind },
  ];
  if (top) {
    faces.push({ pts: [p3(x0, y1, z1), p3(x1, y1, z1), p3(x1, y1, z0), p3(x0, y1, z0)], kind });
  }
  return faces;
}

interface GableParts {
  polys: Poly[];
  /** The two sloping planes (eave corner, eave corner, ridge corner, ridge corner). */
  slopes: Vec3[][];
  /** The two triangular gable ends. */
  ends: Vec3[][];
}

/** Gable roof over a rectangle with a small overhang; the ridge runs along `ridge`. */
function gable(
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  yb: number,
  rise: number,
  ridge: 'x' | 'z',
  overhang: number,
): GableParts {
  const ax0 = x0 - overhang;
  const ax1 = x1 + overhang;
  const az0 = z0 - overhang;
  const az1 = z1 + overhang;
  const yr = yb + rise;
  const under: Poly = {
    pts: [p3(ax0, yb, az0), p3(ax1, yb, az0), p3(ax1, yb, az1), p3(ax0, yb, az1)],
    kind: 'roof',
  };
  let slopes: Vec3[][];
  let ends: Vec3[][];
  if (ridge === 'x') {
    const zm = (z0 + z1) / 2;
    slopes = [
      [p3(ax0, yb, az1), p3(ax1, yb, az1), p3(ax1, yr, zm), p3(ax0, yr, zm)],
      [p3(ax1, yb, az0), p3(ax0, yb, az0), p3(ax0, yr, zm), p3(ax1, yr, zm)],
    ];
    ends = [
      [p3(ax1, yb, az1), p3(ax1, yb, az0), p3(ax1, yr, zm)],
      [p3(ax0, yb, az0), p3(ax0, yb, az1), p3(ax0, yr, zm)],
    ];
  } else {
    const xm = (x0 + x1) / 2;
    slopes = [
      [p3(ax1, yb, az1), p3(ax1, yb, az0), p3(xm, yr, az0), p3(xm, yr, az1)],
      [p3(ax0, yb, az0), p3(ax0, yb, az1), p3(xm, yr, az1), p3(xm, yr, az0)],
    ];
    ends = [
      [p3(ax0, yb, az1), p3(ax1, yb, az1), p3(xm, yr, az1)],
      [p3(ax1, yb, az0), p3(ax0, yb, az0), p3(xm, yr, az0)],
    ];
  }
  return {
    polys: [
      ...slopes.map((pts) => ({ pts, kind: 'roof' as FaceKind })),
      ...ends.map((pts) => ({ pts, kind: 'wall' as FaceKind })),
      under,
    ],
    slopes,
    ends,
  };
}

/** A flat rectangle on a wall: plane 'z' (front or back) or 'x' (sides). */
function wallQuad(
  plane: 'z' | 'x',
  at: number,
  a0: number,
  a1: number,
  y0: number,
  y1: number,
): Vec3[] {
  return plane === 'z'
    ? [p3(a0, y0, at), p3(a1, y0, at), p3(a1, y1, at), p3(a0, y1, at)]
    : [p3(at, y0, a0), p3(at, y0, a1), p3(at, y1, a1), p3(at, y1, a0)];
}

/** Direction the light comes from, in model space (front, left, above). */
const LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.45, 0.75, 0.5];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

function build(): HouseModel {
  const vertices: Vec3[] = [];
  const vertexGroup: number[] = [];
  const faces: (Face & { order: number })[] = [];
  const groupBias: number[] = [];
  const groupBuild: { start: number; end: number }[] = [];
  const groupBase: number[] = [];
  const groupDissolve: number[] = [];
  let minSpacing = Infinity;

  const addVertex = (p: Vec3, group: number): number => {
    for (let i = vertices.length - 1; i >= 0; i--) {
      if (vertexGroup[i] !== group) break;
      const q = vertices[i] as Vec3;
      if (q[0] === p[0] && q[1] === p[1] && q[2] === p[2]) return i;
    }
    vertices.push(p);
    vertexGroup.push(group);
    return vertices.length - 1;
  };

  const normalOf = (pts: Vec3[]): Vec3 =>
    cross(sub(pts[1] as Vec3, pts[0] as Vec3), sub(pts[2] as Vec3, pts[0] as Vec3));

  const unit = (n: Vec3): Vec3 => {
    const len = Math.hypot(...n) || 1;
    return [n[0] / len, n[1] / len, n[2] / len];
  };

  const mean = (pts: Vec3[]): Vec3 => [
    pts.reduce((a, p) => a + p[0], 0) / pts.length,
    pts.reduce((a, p) => a + p[1], 0) / pts.length,
    pts.reduce((a, p) => a + p[2], 0) / pts.length,
  ];

  /** Flat tone from how directly a face points at the light (three steps, no gradient). */
  const toneOf = (normal: Vec3): 0 | 1 | 2 => {
    const d = dot(unit(normal), LIGHT);
    return d > 0.45 ? 0 : d > -0.05 ? 1 : 2;
  };

  /** Add a convex solid, winding every polygon so its normal points away from the middle. */
  const solid = (polys: Poly[], start: number, end: number, dissolve: number, bias = 0): Solid => {
    const mid = mean(polys.flatMap((p) => p.pts));
    const group = groupBias.length;
    groupBias.push(bias);
    groupBuild.push({ start, end });
    groupDissolve.push(dissolve);
    groupBase.push(Math.min(...polys.flatMap((p) => p.pts.map((q) => q[1]))));
    for (const poly of polys) {
      const flip = dot(normalOf(poly.pts), sub(mean(poly.pts), mid)) < 0;
      const pts = flip ? [...poly.pts].reverse() : poly.pts;
      faces.push({
        v: pts.map((q) => addVertex(q, group)),
        kind: poly.kind,
        group,
        tone: toneOf(normalOf(pts)),
        order: faces.length,
      });
    }
    return { group, inside: mid };
  };

  /** A flat quad lying on a wall with outward normal `normal`. */
  const decal = (group: number, kind: FaceKind, pts: Vec3[], normal: Vec3) => {
    const pp = dot(normalOf(pts), normal) < 0 ? [...pts].reverse() : pts;
    faces.push({
      v: pp.map((q) => addVertex(q, group)),
      kind,
      group,
      tone: toneOf(normal),
      order: faces.length,
    });
  };

  /** A hairline segment lying on a surface with outward normal `normal`. */
  const line = (group: number, kind: FaceKind, a: Vec3, b: Vec3, normal: Vec3, gap?: number) => {
    faces.push({
      v: [addVertex(a, group), addVertex(b, group)],
      kind,
      group,
      normal,
      ...(gap === undefined ? {} : { gap }),
      tone: 0,
      order: faces.length,
    });
  };

  /** Outward unit normal of a polygon of a solid whose middle is `mid`. */
  const outward = (pts: Vec3[], mid: Vec3): Vec3 => {
    const n = normalOf(pts);
    const sign = dot(n, sub(mean(pts), mid)) < 0 ? -1 : 1;
    const u = unit(n);
    return [u[0] * sign, u[1] * sign, u[2] * sign];
  };

  /** Horizontal courses across a quad (corners: bottom-left, bottom-right, top-right, top-left). */
  const courses = (s: Solid, quad: Vec3[], count: number) => {
    const n = outward(quad, s.inside);
    const height = Math.hypot(...sub(quad[3] as Vec3, quad[0] as Vec3));
    minSpacing = Math.min(minSpacing, height / count);
    for (let i = 1; i < count; i++) {
      const t = i / count;
      line(
        s.group,
        'line',
        lerp3(quad[0] as Vec3, quad[3] as Vec3, t),
        lerp3(quad[1] as Vec3, quad[2] as Vec3, t),
        n,
        height / count,
      );
    }
  };

  /** Vertical board lines across a quad. */
  const boards = (s: Solid, quad: Vec3[], count: number) => {
    const n = outward(quad, s.inside);
    const width = Math.hypot(...sub(quad[1] as Vec3, quad[0] as Vec3));
    minSpacing = Math.min(minSpacing, width / count);
    for (let i = 1; i < count; i++) {
      const t = i / count;
      line(
        s.group,
        'line',
        lerp3(quad[0] as Vec3, quad[1] as Vec3, t),
        lerp3(quad[3] as Vec3, quad[2] as Vec3, t),
        n,
        width / count,
      );
    }
  };

  /** Shingle rows with staggered butt joints inside a triangular gable end (a fish-scale suggestion). */
  const shingles = (sol: Solid, tri: Vec3[], rows: number) => {
    const [a, b, c] = tri as [Vec3, Vec3, Vec3];
    const n = outward(tri, sol.inside);
    const rise = c[1] - a[1];
    minSpacing = Math.min(minSpacing, (rise * 0.9) / rows);
    for (let i = 1; i <= rows; i++) {
      const t = i / (rows + 1);
      const left = lerp3(a, c, t);
      const right = lerp3(b, c, t);
      line(sol.group, 'line', left, right, n, rise / (rows + 1));
      // Butt joints: short vertical ticks, offset every second row
      const rowH = rise / (rows + 1);
      const span = Math.abs(right[0] - left[0]) + Math.abs(right[2] - left[2]);
      const count = Math.max(1, Math.floor(span / 0.5));
      for (let k = 0; k < count; k++) {
        const u = (k + 0.5 + (i % 2 === 0 ? 0.5 : 0)) / (count + 1);
        if (u <= 0.04 || u >= 0.96) continue;
        const base = lerp3(left, right, u);
        line(sol.group, 'line', base, p3(base[0], base[1] - rowH * 0.8, base[2]), n, 0.5);
      }
    }
  };

  /** Vertical battens inside a triangular gable end (they stop below the sloping edges). */
  const battens = (sol: Solid, tri: Vec3[], count: number) => {
    const [a, b, c] = tri as [Vec3, Vec3, Vec3];
    const n = outward(tri, sol.inside);
    const rise = c[1] - a[1];
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const base = lerp3(a, b, t);
      const h = rise * (1 - Math.abs(2 * t - 1)) * 0.88;
      line(
        sol.group,
        'line',
        base,
        p3(base[0], base[1] + h, base[2]),
        n,
        Math.abs(b[0] - a[0] || b[2] - a[2]) / count,
      );
    }
  };

  /** Frame, sill, head trim, glass and mullions for a window lying on a wall. */
  const windowOn = (
    group: number,
    plane: 'z' | 'x',
    at: number,
    a0: number,
    a1: number,
    y0: number,
    y1: number,
    normal: Vec3,
    panes: 'cross' | 'tall' | 'plain' = 'cross',
  ) => {
    const e = 0.12;
    // Frame with a sill projecting below and a head board above
    decal(group, 'trim', wallQuad(plane, at, a0 - e, a1 + e, y0 - e - 0.1, y1 + e + 0.1), normal);
    decal(group, 'glass', wallQuad(plane, at, a0, a1, y0, y1), normal);
    const am = (a0 + a1) / 2;
    const ym = (y0 + y1) / 2;
    const pt = (a: number, y: number): Vec3 => (plane === 'z' ? p3(a, y, at) : p3(at, y, a));
    if (panes !== 'plain') line(group, 'muntin', pt(am, y0), pt(am, y1), normal);
    if (panes === 'cross') line(group, 'muntin', pt(a0, ym), pt(a1, ym), normal);
  };

  // ---- Dimensions of the volumes (metres) ----
  const X0 = -6.4;
  const X1 = 4.4; // main block, left and right
  const XW = 8.4; // wing, right
  const ZB = -4.2;
  const ZF = 3.6; // main front
  const ZW = 2; // wing front (set back)
  const H0 = 0.9; // top of the stone plinth
  const H1 = 3.2;
  const H2 = 6.2; // eave height of the main walls
  const FRONT: Vec3 = [0, 0, 1];
  const BACK: Vec3 = [0, 0, -1];
  const RIGHT: Vec3 = [1, 0, 0];
  const LEFT: Vec3 = [-1, 0, 0];
  const { roof, upper, lower, porch, plinth } = DISSOLVE;

  // ---- Plinth, porch slab and steps (first up, and they stay when the house is taken down) ----
  const plinthMain = solid(
    box(X0 - 0.1, X1 + 0.1, 0, H0, ZB - 0.1, ZF + 0.1, 'stone'),
    0,
    0.12,
    plinth,
  );
  const plinthWing = solid(
    box(X1, XW + 0.1, 0, H0, ZB - 0.1, ZW + 0.1, 'stone'),
    0.02,
    0.14,
    plinth,
    -0.001,
  );
  // Two stone courses round the plinth faces
  for (let i = 1; i < 3; i++) {
    const y = (H0 * i) / 3;
    line(
      plinthMain.group,
      'line',
      p3(X0 - 0.1, y, ZF + 0.1),
      p3(X1 + 0.1, y, ZF + 0.1),
      FRONT,
      H0 / 3,
    );
    line(
      plinthMain.group,
      'line',
      p3(X0 - 0.1, y, ZB - 0.1),
      p3(X0 - 0.1, y, ZF + 0.1),
      LEFT,
      H0 / 3,
    );
    line(
      plinthMain.group,
      'line',
      p3(X0 - 0.1, y, ZB - 0.1),
      p3(X1 + 0.1, y, ZB - 0.1),
      BACK,
      H0 / 3,
    );
    line(plinthWing.group, 'line', p3(X1, y, ZW + 0.1), p3(XW + 0.1, y, ZW + 0.1), FRONT, H0 / 3);
    line(
      plinthWing.group,
      'line',
      p3(XW + 0.1, y, ZB - 0.1),
      p3(XW + 0.1, y, ZW + 0.1),
      RIGHT,
      H0 / 3,
    );
  }
  solid(box(0.2, 4.2, 0, 0.45, ZF, 6.5, 'slab'), 0, 0.1, plinth, -0.01);
  solid(box(0.2, 4.2, 0, 0.3, 6.5, 7, 'slab'), 0.02, 0.12, plinth, -0.01);
  solid(box(0.2, 4.2, 0, 0.15, 7, 7.5, 'slab'), 0.04, 0.14, plinth, -0.01);

  // ---- Main block, ground storey: garage, entry, windows, lap siding, corner boards ----
  const mainLo = solid(box(X0, X1, H0, H1, ZB, ZF, 'wall', false), 0.1, 0.4, lower);
  courses(mainLo, wallQuad('z', ZF, X0, X1, H0, H1), 5);
  courses(mainLo, wallQuad('x', X0, ZB, ZF, H0, H1), 5);
  courses(mainLo, wallQuad('z', ZB, X0, X1, H0, H1), 5);
  // Garage: two doors, each five stacked panels with the top one glazed, and a row of small lights
  for (const [a0, a1] of [
    [-6, -3.65],
    [-3.2, -0.85],
  ] as const) {
    decal(mainLo.group, 'trim', wallQuad('z', ZF, a0 - 0.1, a1 + 0.1, H0, 2.95), FRONT);
    for (let i = 0; i < 5; i++) {
      const y0 = 0.95 + i * 0.4;
      decal(
        mainLo.group,
        i === 4 ? 'glass' : 'door',
        wallQuad('z', ZF, a0, a1, y0, y0 + 0.34),
        FRONT,
      );
    }
    for (let i = 1; i < 4; i++) {
      const x = a0 + ((a1 - a0) * i) / 4;
      line(mainLo.group, 'muntin', p3(x, 2.35, ZF), p3(x, 2.65, ZF), FRONT);
    }
  }
  // Entry: door, two sidelights, a transom and panel lines
  decal(mainLo.group, 'trim', wallQuad('z', ZF, 0.85, 3.55, H0, 3.0), FRONT);
  decal(mainLo.group, 'door', wallQuad('z', ZF, 1.7, 2.7, H0, 2.55), FRONT);
  decal(mainLo.group, 'glass', wallQuad('z', ZF, 0.95, 1.55, H0, 2.55), FRONT);
  decal(mainLo.group, 'glass', wallQuad('z', ZF, 2.85, 3.45, H0, 2.55), FRONT);
  decal(mainLo.group, 'glass', wallQuad('z', ZF, 0.95, 3.45, 2.65, 2.9), FRONT);
  line(mainLo.group, 'muntin', p3(2.2, H0, ZF), p3(2.2, 2.55, ZF), FRONT);
  line(mainLo.group, 'muntin', p3(1.85, 1.3, ZF), p3(2.55, 1.3, ZF), FRONT);
  line(mainLo.group, 'muntin', p3(1.85, 2.0, ZF), p3(2.55, 2.0, ZF), FRONT);
  // Ground-floor windows: a pair on the left end and four along the back
  for (const [a, b] of [
    [-1.6, -0.4],
    [0.8, 2],
  ] as const) {
    windowOn(mainLo.group, 'x', X0, a, b, 1.5, 2.6, LEFT);
  }
  for (const [a, b] of [
    [-5.4, -4.2],
    [-3.6, -2.4],
    [-2, -0.8],
    [0.4, 1.6],
  ] as const) {
    windowOn(mainLo.group, 'z', ZB, a, b, 1.5, 2.6, BACK, 'plain');
  }
  // Corner boards
  decal(mainLo.group, 'trim', wallQuad('z', ZF, X0, X0 + 0.22, H0, H1), FRONT);
  decal(mainLo.group, 'trim', wallQuad('x', X0, ZF - 0.22, ZF, H0, H1), LEFT);
  decal(mainLo.group, 'trim', wallQuad('x', X0, ZB, ZB + 0.22, H0, H1), LEFT);
  decal(mainLo.group, 'trim', wallQuad('z', ZB, X0, X0 + 0.22, H0, H1), BACK);

  // ---- Main block, upper storey ----
  const mainUp = solid(box(X0, X1, H1, H2, ZB, ZF, 'wall', false), 0.3, 0.55, upper);
  courses(mainUp, wallQuad('z', ZF, X0, X1, H1, H2), 6);
  courses(mainUp, wallQuad('x', X0, ZB, ZF, H1, H2), 6);
  courses(mainUp, wallQuad('z', ZB, X0, X1, H1, H2), 6);
  // A band of three windows over the garage, paired windows on the left end, and the back
  for (const [a, b] of [
    [-5.6, -4.4],
    [-3.9, -2.7],
    [-2.2, -1],
  ] as const) {
    windowOn(mainUp.group, 'z', ZF, a, b, 3.9, 5.3, FRONT);
  }
  for (const [a, b] of [
    [-1.6, -0.4],
    [0.8, 2],
  ] as const) {
    windowOn(mainUp.group, 'x', X0, a, b, 3.9, 5.3, LEFT);
  }
  for (const [a, b] of [
    [-5.4, -4.2],
    [-3.6, -2.4],
    [-2, -0.8],
    [0.4, 1.6],
  ] as const) {
    windowOn(mainUp.group, 'z', ZB, a, b, 3.9, 5.3, BACK);
  }
  decal(mainUp.group, 'trim', wallQuad('z', ZF, X0, X0 + 0.22, H1, H2), FRONT);
  decal(mainUp.group, 'trim', wallQuad('x', X0, ZF - 0.22, ZF, H1, H2), LEFT);
  decal(mainUp.group, 'trim', wallQuad('x', X0, ZB, ZB + 0.22, H1, H2), LEFT);
  decal(mainUp.group, 'trim', wallQuad('z', ZB, X0, X0 + 0.22, H1, H2), BACK);

  // ---- Projecting upper bay over the entrance (its cross gable follows) ----
  const bay = solid(box(-0.6, 4, H1, H2, ZF, 4.4, 'wall', false), 0.4, 0.56, upper);
  // Three lights under one head
  windowOn(bay.group, 'z', 4.4, -0.2, 0.7, 3.9, 5.3, FRONT);
  windowOn(bay.group, 'z', 4.4, 1.15, 2.25, 3.9, 5.3, FRONT);
  windowOn(bay.group, 'z', 4.4, 2.7, 3.6, 3.9, 5.3, FRONT);
  courses(bay, wallQuad('z', 4.4, -0.6, 4, H1, H2), 6);

  // ---- Wing on the right, set back, with vertical board siding and an end gable ----
  const wingLo = solid(box(X1, XW, H0, H1, ZB, ZW, 'wall', false), 0.18, 0.42, lower);
  boards(wingLo, wallQuad('z', ZW, X1, XW, H0, H1), 9);
  boards(wingLo, wallQuad('x', XW, ZB, ZW, H0, H1), 11);
  windowOn(wingLo.group, 'z', ZW, 5.4, 7.3, 1.5, 2.6, FRONT);
  for (const [a, b] of [
    [-3.4, -2.2],
    [-1.4, -0.2],
  ] as const) {
    windowOn(wingLo.group, 'x', XW, a, b, 1.5, 2.6, RIGHT);
  }
  const wingUp = solid(box(X1, XW, H1, H2, ZB, ZW, 'wall', false), 0.34, 0.54, upper);
  boards(wingUp, wallQuad('z', ZW, X1, XW, H1, H2), 9);
  boards(wingUp, wallQuad('x', XW, ZB, ZW, H1, H2), 11);
  windowOn(wingUp.group, 'z', ZW, 5.4, 7.3, 3.9, 5.3, FRONT);
  for (const [a, b] of [
    [-3.4, -2.2],
    [-1.4, -0.2],
  ] as const) {
    windowOn(wingUp.group, 'x', XW, a, b, 3.9, 5.3, RIGHT);
  }
  windowOn(wingUp.group, 'z', ZB, 5.2, 6.6, 3.9, 5.3, BACK);
  decal(wingLo.group, 'trim', wallQuad('z', ZW, XW - 0.22, XW, H0, H1), FRONT);
  decal(wingLo.group, 'trim', wallQuad('x', XW, ZW - 0.22, ZW, H0, H1), RIGHT);
  decal(wingUp.group, 'trim', wallQuad('z', ZW, XW - 0.22, XW, H1, H2), FRONT);
  decal(wingUp.group, 'trim', wallQuad('x', XW, ZW - 0.22, ZW, H1, H2), RIGHT);

  // ---- Roofs ----
  const mainRoofParts = gable(X0, X1, ZB, ZF, H2, 2.4, 'x', 0.45);
  const mainRoof = solid(mainRoofParts.polys, 0.56, 0.78, roof, -0.001);
  for (const slope of mainRoofParts.slopes) courses(mainRoof, slope, 7);
  // Fascia boards along the front and back eaves
  decal(
    mainRoof.group,
    'trim',
    wallQuad('z', ZF + 0.45, X0 - 0.45, X1 + 0.45, H2 - 0.2, H2),
    FRONT,
  );
  decal(mainRoof.group, 'trim', wallQuad('z', ZB - 0.45, X0 - 0.45, X1 + 0.45, H2 - 0.2, H2), BACK);
  // Left gable end: board-and-batten with a tall louvre window
  battens(mainRoof, mainRoofParts.ends[1] as Vec3[], 10);
  windowOn(mainRoof.group, 'x', X0 - 0.45, -0.6, 0.6, H2 + 0.5, H2 + 1.4, LEFT, 'tall');

  const crossParts = gable(-0.6, 4, ZF, 4.4, H2, 2.3, 'z', 0.4);
  const cross3 = solid(crossParts.polys, 0.6, 0.82, roof, -0.004);
  for (const slope of crossParts.slopes) courses(cross3, slope, 5);
  // Front gable face: shingle rows with staggered butts, and a small vent
  shingles(cross3, crossParts.ends[0] as Vec3[], 6);
  decal(cross3.group, 'trim', wallQuad('z', 4.4 + 0.4, 1.2, 2.2, H2 + 0.7, H2 + 1.4), FRONT);
  decal(cross3.group, 'glass', wallQuad('z', 4.4 + 0.4, 1.28, 2.12, H2 + 0.78, H2 + 1.32), FRONT);

  const wingParts = gable(X1, XW, ZB, ZW, H2, 2.4, 'z', 0.35);
  const wingRoof = solid(wingParts.polys, 0.58, 0.82, roof, -0.002);
  for (const slope of wingParts.slopes) courses(wingRoof, slope, 6);
  shingles(wingRoof, wingParts.ends[0] as Vec3[], 6);
  windowOn(wingRoof.group, 'z', ZW + 0.35, 5.9, 6.9, H2 + 0.6, H2 + 1.5, FRONT, 'tall');

  // Chimney through the main ridge, with a cap
  const ridgeY = H2 + 2.4;
  const chimney = solid(
    box(-5.4, -4.5, ridgeY - 0.45, ridgeY + 1.5, -0.45, 0.45, 'stone'),
    0.8,
    0.94,
    roof,
    -0.01,
  );
  courses(chimney, wallQuad('z', 0.45, -5.4, -4.5, ridgeY - 0.45, ridgeY + 1.5), 6);
  solid(box(-5.55, -4.35, ridgeY + 1.5, ridgeY + 1.7, -0.6, 0.6, 'trim'), 0.88, 0.97, roof, -0.02);

  // ---- Porch: stone-based tapered posts, a beam and its own gable ----
  for (const x of [0.65, 3.55]) {
    const base = solid(
      box(x - 0.45, x + 0.45, 0.45, 1.65, 5.6, 6.2, 'stone'),
      0.46,
      0.6,
      porch,
      -0.02,
    );
    courses(base, wallQuad('z', 6.2, x - 0.45, x + 0.45, 0.45, 1.65), 4);
    solid(box(x - 0.24, x + 0.24, 1.65, 3.3, 5.75, 6.05, 'trim'), 0.54, 0.66, porch, -0.02);
  }
  solid(box(0.3, 3.9, 3.3, 3.55, 5.65, 6.15, 'trim'), 0.62, 0.72, porch, -0.03);
  const porchParts = gable(0.2, 4, ZF, 6.2, 3.55, 1.35, 'z', 0.3);
  const porchRoof = solid(porchParts.polys, 0.7, 0.9, porch, -0.04);
  for (const slope of porchParts.slopes) courses(porchRoof, slope, 4);
  shingles(porchRoof, porchParts.ends[0] as Vec3[], 3);

  // ---- Ground: plot outline, driveway slab with control joints, and the walkway ----
  const ground: Vec3[][] = [
    [p3(-8.4, 0, -5), p3(10.2, 0, -5), p3(10.2, 0, 8.8), p3(-8.4, 0, 8.8)],
    [p3(-6.2, 0, ZF), p3(-0.6, 0, ZF), p3(-0.6, 0, 8.8), p3(-6.2, 0, 8.8)],
    [p3(1.4, 0, 7.5), p3(3, 0, 7.5), p3(3, 0, 8.8), p3(1.4, 0, 8.8)],
    [p3(-6.2, 0, 5.4), p3(-0.6, 0, 5.4)],
    [p3(-6.2, 0, 7.2), p3(-0.6, 0, 7.2)],
  ];

  // Overall width along the front of the plot, overall height at the back-right corner
  const dimensions: Dimension[] = [
    {
      from: p3(X0, 0, 8.8),
      to: p3(XW, 0, 8.8),
      tick: p3(0, 0, -0.5),
      label: '14.8 m',
      labelShift: p3(0, -1.2, 0.9),
    },
    {
      from: p3(9.4, 0, -4.8),
      to: p3(9.4, ridgeY, -4.8),
      tick: p3(0.5, 0, 0),
      label: '8.6 m',
      labelShift: p3(1, 0, 0),
    },
  ];

  // Order faces inside each solid: bodies, lines, stone, trim, glass and doors, mullions
  const sorted = [...faces]
    .sort((a, b) => a.group - b.group || RANK[a.kind] - RANK[b.kind] || a.order - b.order)
    .map((f): Face => {
      const face: Face = { v: f.v, kind: f.kind, group: f.group, tone: f.tone };
      if (f.normal) face.normal = f.normal;
      if (f.gap !== undefined) face.gap = f.gap;
      return face;
    });

  // Bounding sphere of the house itself, so the fit holds at every rotation
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of vertices) {
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i] ?? 0, p[i] ?? 0);
      hi[i] = Math.max(hi[i] ?? 0, p[i] ?? 0);
    }
  }
  const centre: Vec3 = [
    ((lo[0] ?? 0) + (hi[0] ?? 0)) / 2,
    ((lo[1] ?? 0) + (hi[1] ?? 0)) / 2,
    ((lo[2] ?? 0) + (hi[2] ?? 0)) / 2,
  ];
  const radius = Math.max(
    ...vertices.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2])),
  );

  return {
    vertices,
    vertexGroup,
    faces: sorted,
    groupBias,
    groupBuild,
    groupBase,
    groupDissolve,
    centre,
    radius,
    height: hi[1] ?? 0,
    footprint: { x0: X0 - 0.1, x1: XW + 0.1 },
    minLineSpacing: Number.isFinite(minSpacing) ? minSpacing : 0.4,
    dimensions,
    ground,
  };
}

export const HOUSE: HouseModel = build();
