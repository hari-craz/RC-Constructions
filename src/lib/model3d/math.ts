/*
 * Small 3D maths for the hero house: rotation matrices, composition and a mild perspective
 * projection. Right-handed axes: x to the right, y up, z toward the viewer. Angles are degrees.
 */
export type Vec3 = readonly [number, number, number];
/** Row-major 3x3 matrix. */
export type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Turn about the vertical axis; a positive angle swings the front toward the right. */
export function rotY(deg: number): Mat3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

/** Tilt about the horizontal axis; a positive angle brings the top toward the viewer. */
export function rotX(deg: number): Mat3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

/** Roll about the view axis; a positive angle turns anticlockwise on screen. */
export function rotZ(deg: number): Mat3 {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

/** a · b (apply b first, then a). */
export function mul(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] =
        (a[r * 3] ?? 0) * (b[c] ?? 0) +
        (a[r * 3 + 1] ?? 0) * (b[3 + c] ?? 0) +
        (a[r * 3 + 2] ?? 0) * (b[6 + c] ?? 0);
    }
  }
  return out as unknown as Mat3;
}

/**
 * The pose matrix: turn about y first, then tilt about x, then roll about z (the view axis), so
 * a roll always spins the picture and a turn always spins the house about its own vertical.
 */
export function pose(rx: number, ry: number, rz: number): Mat3 {
  return mul(rotZ(rz), mul(rotX(rx), rotY(ry)));
}

export function apply(m: Mat3, v: Vec3): Vec3 {
  return [
    (m[0] ?? 0) * v[0] + (m[1] ?? 0) * v[1] + (m[2] ?? 0) * v[2],
    (m[3] ?? 0) * v[0] + (m[4] ?? 0) * v[1] + (m[5] ?? 0) * v[2],
    (m[6] ?? 0) * v[0] + (m[7] ?? 0) * v[1] + (m[8] ?? 0) * v[2],
  ];
}

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Keep a tilt away from the poles so the house never flips over. */
export function clampTilt(deg: number, limit = 80): number {
  return Math.max(-limit, Math.min(limit, deg));
}

/** Wrap an angle into (-180, 180]. */
export function wrapAngle(deg: number): number {
  const w = ((((deg + 180) % 360) + 360) % 360) - 180;
  return w === -180 ? 180 : w;
}

export interface Camera {
  /** 1 / distance of the eye from the model centre; 0 is orthographic. */
  invDistance: number;
  /** Pixels per model unit at the model centre. */
  scale: number;
  cx: number;
  cy: number;
}

export interface Projected {
  x: number;
  y: number;
  /** Rotated z: larger is nearer the viewer. */
  depth: number;
}

/** Project an already-rotated point. */
export function project(p: Vec3, cam: Camera): Projected {
  const f = 1 / (1 - p[2] * cam.invDistance);
  return { x: cam.cx + p[0] * cam.scale * f, y: cam.cy - p[1] * cam.scale * f, depth: p[2] };
}
