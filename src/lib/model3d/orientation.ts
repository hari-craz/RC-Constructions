import type { Mat3, Vec3 } from './math';

/*
 * The house's orientation as a unit quaternion (w, x, y, z). Drag, buttons, keys and auto-rotate
 * apply small rotations about the world or screen axes and the matrix is made once per frame, so
 * nothing depends on the order Euler angles are composed in: no gimbal lock, no flips. Reset and
 * the morph's ease to the front elevation use spherical interpolation. The tilt limit applies to
 * the elevation of the house's vertical axis, not to a raw angle.
 */
export type Quat = readonly [number, number, number, number];

export const Q_IDENTITY: Quat = [1, 0, 0, 0];

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function qMul(a: Quat, b: Quat): Quat {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
}

export function qNormalize(q: Quat): Quat {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

/** Rotation by `degrees` about a unit axis. */
export function qAxisAngle(axis: Vec3, degrees: number): Quat {
  const h = rad(degrees) / 2;
  const s = Math.sin(h);
  return [Math.cos(h), axis[0] * s, axis[1] * s, axis[2] * s];
}

const AXIS_X: Vec3 = [1, 0, 0];
const AXIS_Y: Vec3 = [0, 1, 0];
const AXIS_Z: Vec3 = [0, 0, 1];

/** The rotation matrix (row-major) of a unit quaternion. */
export function qToMat3(q: Quat): Mat3 {
  const [w, x, y, z] = q;
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - w * z),
    2 * (x * z + w * y),
    2 * (x * y + w * z),
    1 - 2 * (x * x + z * z),
    2 * (y * z - w * x),
    2 * (x * z - w * y),
    2 * (y * z + w * x),
    1 - 2 * (x * x + y * y),
  ];
}

/** Spherical interpolation along the shorter arc. */
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) {
    d = -d;
    bb = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (d > 0.9995) {
    return qNormalize([
      a[0] + (bb[0] - a[0]) * t,
      a[1] + (bb[1] - a[1]) * t,
      a[2] + (bb[2] - a[2]) * t,
      a[3] + (bb[3] - a[3]) * t,
    ]);
  }
  const theta = Math.acos(Math.min(1, d));
  const s = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / s;
  const wb = Math.sin(t * theta) / s;
  return [
    a[0] * wa + bb[0] * wb,
    a[1] * wa + bb[1] * wb,
    a[2] * wa + bb[2] * wb,
    a[3] * wa + bb[3] * wb,
  ];
}

/** The orientation turn about y, then tilt about x, then roll about z (degrees), as in `pose`. */
export function qFromEuler(rx: number, ry: number, rz: number): Quat {
  return qNormalize(
    qMul(qAxisAngle(AXIS_Z, rz), qMul(qAxisAngle(AXIS_X, rx), qAxisAngle(AXIS_Y, ry))),
  );
}

/** Turn, tilt and roll in degrees that `qFromEuler` would give this orientation (tilt within 90). */
export function eulerOf(q: Quat): { rx: number; ry: number; rz: number } {
  const m = qToMat3(q);
  const s = Math.max(-1, Math.min(1, m[7] as number));
  return {
    rx: deg(Math.asin(s)),
    ry: deg(Math.atan2(-(m[6] as number), m[8] as number)),
    rz: deg(Math.atan2(-(m[1] as number), m[4] as number)),
  };
}

/** How far the top of the house leans toward (positive) or away from the viewer, in degrees. */
export function elevationDeg(q: Quat): number {
  return deg(Math.asin(Math.max(-1, Math.min(1, qToMat3(q)[7] as number))));
}

/** Turn about the house's own vertical axis. */
export const turnQ = (q: Quat, degrees: number): Quat =>
  qNormalize(qMul(q, qAxisAngle(AXIS_Y, degrees)));

/** Roll about the view axis. */
export const rollQ = (q: Quat, degrees: number): Quat =>
  qNormalize(qMul(qAxisAngle(AXIS_Z, degrees), q));

/**
 * Tilt about the screen's horizontal axis, stopping where the elevation reaches `limit` degrees
 * (the house never goes over the pole, whatever the roll). The turn is made in small steps, so a
 * large one cannot jump over the pole and come out the other side.
 */
export function tiltQ(q: Quat, degrees: number, limit: number): Quat {
  const steps = Math.max(1, Math.ceil(Math.abs(degrees) / 4));
  const each = degrees / steps;
  let cur = q;
  for (let i = 0; i < steps; i++) {
    const next = qNormalize(qMul(qAxisAngle(AXIS_X, each), cur));
    const e = Math.abs(elevationDeg(next));
    // Moving back toward the middle is always allowed
    if (e <= limit || e < Math.abs(elevationDeg(cur))) {
      cur = next;
      continue;
    }
    // Past the limit: go as far as the limit allows, then stop
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (Math.abs(elevationDeg(qNormalize(qMul(qAxisAngle(AXIS_X, each * mid), cur)))) <= limit) {
        lo = mid;
      } else hi = mid;
    }
    return qNormalize(qMul(qAxisAngle(AXIS_X, each * lo), cur));
  }
  return cur;
}
