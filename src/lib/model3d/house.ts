import { cross, dot, sub, type Vec3 } from './math';

/*
 * An original, simplified two-storey house as plain data: vertices and faces in metres. Walls are
 * limewash, roofs concrete, glazing and doors formwork-dark. Windows and doors are flat "decals"
 * lying on their wall, drawn straight after the solid they belong to.
 *
 * Layout (front is +z): a main block with a gable roof along x, a garage on the left with a low
 * gable along z, and a front porch (two posts under a small gable) over the door.
 */
export type FaceKind = 'wall' | 'roof' | 'glass' | 'door' | 'trim';

interface Face {
  /** Indices into `vertices`, wound anticlockwise seen from outside. */
  v: readonly number[];
  kind: FaceKind;
  /** The solid this face belongs to; solids are sorted back to front, faces keep their order. */
  group: number;
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
  faces: readonly Face[];
  /** Per group: a depth bias that pulls it toward the viewer when depths tie (negative = nearer). */
  groupBias: readonly number[];
  /** Centre and radius of the bounding sphere (for fitting at every rotation). */
  centre: Vec3;
  radius: number;
  dimensions: readonly Dimension[];
  /** Outline of the ground slab (hairline), drawn first. */
  ground: readonly Vec3[];
}

type Poly = { pts: Vec3[]; kind: FaceKind };

const p3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

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
  if (top)
    faces.push({ pts: [p3(x0, y1, z1), p3(x1, y1, z1), p3(x1, y1, z0), p3(x0, y1, z0)], kind });
  return faces;
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
): Poly[] {
  const ax0 = x0 - overhang;
  const ax1 = x1 + overhang;
  const az0 = z0 - overhang;
  const az1 = z1 + overhang;
  const yr = yb + rise;
  const under: Poly = {
    pts: [p3(ax0, yb, az0), p3(ax1, yb, az0), p3(ax1, yb, az1), p3(ax0, yb, az1)],
    kind: 'roof',
  };
  if (ridge === 'x') {
    const zm = (z0 + z1) / 2;
    return [
      { pts: [p3(ax0, yb, az1), p3(ax1, yb, az1), p3(ax1, yr, zm), p3(ax0, yr, zm)], kind: 'roof' },
      { pts: [p3(ax1, yb, az0), p3(ax0, yb, az0), p3(ax0, yr, zm), p3(ax1, yr, zm)], kind: 'roof' },
      { pts: [p3(ax1, yb, az1), p3(ax1, yb, az0), p3(ax1, yr, zm)], kind: 'wall' },
      { pts: [p3(ax0, yb, az0), p3(ax0, yb, az1), p3(ax0, yr, zm)], kind: 'wall' },
      under,
    ];
  }
  const xm = (x0 + x1) / 2;
  return [
    { pts: [p3(ax1, yb, az1), p3(ax1, yb, az0), p3(xm, yr, az0), p3(xm, yr, az1)], kind: 'roof' },
    { pts: [p3(ax0, yb, az0), p3(ax0, yb, az1), p3(xm, yr, az1), p3(xm, yr, az0)], kind: 'roof' },
    { pts: [p3(ax0, yb, az1), p3(ax1, yb, az1), p3(xm, yr, az1)], kind: 'wall' },
    { pts: [p3(ax1, yb, az0), p3(ax0, yb, az0), p3(xm, yr, az0)], kind: 'wall' },
    under,
  ];
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

function build(): HouseModel {
  const vertices: Vec3[] = [];
  const faces: Face[] = [];
  const groupBias: number[] = [];

  const addVertex = (p: Vec3): number => {
    const found = vertices.findIndex((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]);
    if (found >= 0) return found;
    vertices.push(p);
    return vertices.length - 1;
  };

  const normalOf = (pts: Vec3[]): Vec3 =>
    cross(sub(pts[1] as Vec3, pts[0] as Vec3), sub(pts[2] as Vec3, pts[0] as Vec3));

  const mean = (pts: Vec3[]): Vec3 => [
    pts.reduce((a, p) => a + p[0], 0) / pts.length,
    pts.reduce((a, p) => a + p[1], 0) / pts.length,
    pts.reduce((a, p) => a + p[2], 0) / pts.length,
  ];

  /** Add a convex solid, winding every polygon so its normal points away from the middle. */
  const solid = (polys: Poly[], bias = 0): number => {
    const inside = mean(polys.flatMap((p) => p.pts));
    const group = groupBias.length;
    groupBias.push(bias);
    for (const poly of polys) {
      const out = dot(normalOf(poly.pts), sub(mean(poly.pts), inside)) < 0;
      faces.push({
        v: (out ? [...poly.pts].reverse() : poly.pts).map(addVertex),
        kind: poly.kind,
        group,
      });
    }
    return group;
  };

  /** A flat quad lying on a wall with outward normal `normal`; joins an existing group. */
  const decal = (group: number, kind: FaceKind, pts: Vec3[], normal: Vec3) => {
    faces.push({
      v: (dot(normalOf(pts), normal) < 0 ? [...pts].reverse() : pts).map(addVertex),
      kind,
      group,
    });
  };

  const MAIN = { x0: -2, x1: 5, z0: -3.5, z1: 3.5, h: 6 };
  const GARAGE = { x0: -7, x1: -2, z0: -2.5, z1: 3.5, h: 3.2 };
  const ZF = MAIN.z1;
  const FRONT: Vec3 = [0, 0, 1];
  const BACK: Vec3 = [0, 0, -1];
  const RIGHT: Vec3 = [1, 0, 0];
  const LEFT: Vec3 = [-1, 0, 0];

  // Main block: door under the porch, windows left and right, three upstairs
  const main = solid(box(MAIN.x0, MAIN.x1, 0, MAIN.h, MAIN.z0, MAIN.z1, 'wall', false));
  decal(main, 'door', wallQuad('z', ZF, 1.4, 2.6, 0, 2.5), FRONT);
  decal(main, 'glass', wallQuad('z', ZF, -1.4, 0, 1, 2.4), FRONT);
  decal(main, 'glass', wallQuad('z', ZF, 3.4, 4.6, 1, 2.4), FRONT);
  for (const [a, b] of [
    [-1.4, -0.2],
    [1.4, 2.6],
    [3.8, 4.8],
  ] as const) {
    decal(main, 'glass', wallQuad('z', ZF, a, b, 3.8, 5.2), FRONT);
  }
  for (const [a, b] of [
    [-2.2, -0.8],
    [0.8, 2.2],
  ] as const) {
    decal(main, 'glass', wallQuad('x', MAIN.x1, a, b, 1, 2.4), RIGHT);
    decal(main, 'glass', wallQuad('x', MAIN.x1, a, b, 3.8, 5.2), RIGHT);
  }
  for (const [a, b] of [
    [-1.2, 0],
    [1.4, 2.6],
    [3.6, 4.8],
  ] as const) {
    decal(main, 'glass', wallQuad('z', MAIN.z0, a, b, 1, 2.4), BACK);
    decal(main, 'glass', wallQuad('z', MAIN.z0, a, b, 3.8, 5.2), BACK);
  }
  decal(main, 'glass', wallQuad('x', MAIN.x0, -0.6, 0.6, 3.8, 5.2), LEFT);

  // Main roof (ridge along x) with an attic window in the right gable
  const mainRise = 2.2;
  const overhang = 0.35;
  const mainRoof = solid(
    gable(MAIN.x0, MAIN.x1, MAIN.z0, MAIN.z1, MAIN.h, mainRise, 'x', overhang),
    -0.001,
  );
  decal(
    mainRoof,
    'glass',
    wallQuad('x', MAIN.x1 + overhang, -0.5, 0.5, MAIN.h + 0.4, MAIN.h + 1.2),
    RIGHT,
  );

  // Chimney through the ridge: its base sits on the roof surface
  solid(box(3.2, 4, 7.95, 9.5, -0.4, 0.4, 'wall'), -0.01);

  // Garage: four stacked door panels with wall-coloured gaps, a side window, a low gable roof
  const garage = solid(box(GARAGE.x0, GARAGE.x1, 0, GARAGE.h, GARAGE.z0, GARAGE.z1, 'wall', false));
  for (let i = 0; i < 4; i++) {
    const y0 = 0.1 + i * 0.62;
    decal(garage, 'door', wallQuad('z', GARAGE.z1, -6.5, -2.5, y0, y0 + 0.5), FRONT);
  }
  decal(garage, 'glass', wallQuad('x', GARAGE.x0, -0.9, 0.7, 1.2, 2.3), LEFT);
  solid(gable(GARAGE.x0, GARAGE.x1, GARAGE.z0, GARAGE.z1, GARAGE.h, 1.3, 'z', 0.3), -0.001);

  // Porch: a slab, two posts and a small gable over the door
  solid(box(0.2, 3.8, 0, 0.2, 3.5, 5.6, 'trim'), -0.01);
  for (const x of [0.6, 3.2]) solid(box(x, x + 0.25, 0, 3.1, 5.1, 5.35, 'trim'), -0.02);
  solid(gable(0.3, 3.7, 3.5, 5.5, 3.1, 1.3, 'z', 0.2), -0.03);

  const ground: Vec3[] = [p3(-8.2, 0, -4.6), p3(6.2, 0, -4.6), p3(6.2, 0, 7.2), p3(-8.2, 0, 7.2)];

  // Overall width along the front of the plot, overall height at the right-front corner
  const dimensions: Dimension[] = [
    {
      from: p3(-7, 0, 7.2),
      to: p3(5, 0, 7.2),
      tick: p3(0, 0, -0.5),
      label: '12.0 m',
      labelShift: p3(0, -1.1, 0.9),
    },
    {
      from: p3(6.5, 0, -4.6),
      to: p3(6.5, 8.2, -4.6),
      tick: p3(0.5, 0, 0),
      label: '8.2 m',
      labelShift: p3(0.9, 0, 0),
    },
  ];

  // Bounding sphere of the house itself (the ground outline and dimension lines are hairlines that
  // may reach a little beyond it), so the fit holds at every rotation
  const drawn: Vec3[] = [...vertices];
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of drawn) {
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
    ...drawn.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2])),
  );

  return { vertices, faces, groupBias, centre, radius, dimensions, ground };
}

export const HOUSE: HouseModel = build();
