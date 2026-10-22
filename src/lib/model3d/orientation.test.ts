import { describe, expect, it } from 'vitest';
import { pose as poseMatrix } from './math';
import {
  elevationDeg,
  eulerOf,
  Q_IDENTITY,
  qAxisAngle,
  qFromEuler,
  qMul,
  qNormalize,
  qSlerp,
  qToMat3,
  rollQ,
  tiltQ,
  turnQ,
  type Quat,
} from './orientation';

/** A small deterministic random source. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const close = (a: readonly number[], b: readonly number[], eps = 1e-9) =>
  a.forEach((v, i) => expect(Math.abs(v - (b[i] as number))).toBeLessThan(eps));

describe('orientation as a quaternion', () => {
  it('matches the Euler composition (turn, tilt, roll) it replaces', () => {
    const r = rng(1);
    for (let i = 0; i < 200; i++) {
      const rx = r() * 160 - 80;
      const ry = r() * 360 - 180;
      const rz = r() * 360 - 180;
      close(qToMat3(qFromEuler(rx, ry, rz)), poseMatrix(rx, ry, rz));
      const e = eulerOf(qFromEuler(rx, ry, rz));
      expect(e.rx).toBeCloseTo(rx, 6);
      expect(Math.abs(((e.ry - ry + 540) % 360) - 180)).toBeLessThan(1e-6);
      expect(Math.abs(((e.rz - rz + 540) % 360) - 180)).toBeLessThan(1e-6);
    }
  });

  it('returns the same matrix after 360 degrees about each axis, in one step or many small ones', () => {
    const start = qFromEuler(16, -35, 10);
    const m0 = qToMat3(start);
    for (const axis of [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ] as const) {
      close(qToMat3(qMul(qAxisAngle(axis, 360), start)), m0);
      let q: Quat = start;
      for (let i = 0; i < 3600; i++) q = qNormalize(qMul(qAxisAngle(axis, 0.1), q));
      close(qToMat3(q), m0);
    }
    let t: Quat = start;
    for (let i = 0; i < 3600; i++) t = turnQ(t, 0.1);
    close(qToMat3(t), m0);
    let r: Quat = start;
    for (let i = 0; i < 3600; i++) r = rollQ(r, 0.1);
    close(qToMat3(r), m0);
  });

  it('holds the tilt limit after 10,000 random drags, whatever the roll', () => {
    const r = rng(7);
    let q: Quat = qFromEuler(16, -35, 0);
    let worst = 0;
    for (let i = 0; i < 10000; i++) {
      const kind = r();
      if (kind < 0.4) q = turnQ(q, (r() - 0.5) * 60);
      else if (kind < 0.8) q = tiltQ(q, (r() - 0.5) * (r() < 0.2 ? 340 : 90), 80);
      else q = rollQ(q, (r() - 0.5) * 90);
      worst = Math.max(worst, Math.abs(elevationDeg(q)));
    }
    expect(worst).toBeLessThanOrEqual(80 + 1e-9);
  });

  it('cannot be tilted over the pole by one large step', () => {
    for (const roll of [0, 35, -120]) {
      const q = qFromEuler(79.9, 20, roll);
      for (const step of [20, 90, 179, -179]) {
        const after = tiltQ(q, step, 80);
        expect(Math.abs(elevationDeg(after))).toBeLessThanOrEqual(80 + 1e-9);
        // Without roll it stays on the same side: the top is still tipped toward the viewer
        if (roll === 0 && step > 0) expect(elevationDeg(after)).toBeGreaterThan(70);
      }
    }
  });

  it('lets a tilt back toward the middle even from the limit', () => {
    let q: Quat = qFromEuler(80, 20, 0);
    expect(elevationDeg(tiltQ(q, 10, 80))).toBeCloseTo(80, 6);
    q = tiltQ(q, -15, 80);
    expect(elevationDeg(q)).toBeCloseTo(65, 6);
    // With roll the same tilt still moves toward the middle and never past the limit
    const rolled = qFromEuler(80, 20, 35);
    expect(Math.abs(elevationDeg(tiltQ(rolled, -15, 80)))).toBeLessThan(80);
    expect(Math.abs(elevationDeg(tiltQ(rolled, 15, 80)))).toBeLessThanOrEqual(80 + 1e-9);
  });

  it('slerps along the shorter arc, with no flip at the ends', () => {
    const a = qFromEuler(20, 170, 0);
    const b = qFromEuler(20, -170, 0);
    const mid = qSlerp(a, b, 0.5);
    // Half way between 170 and -170 degrees of turn is 180, not 0
    expect(Math.abs(Math.abs(eulerOf(mid).ry) - 180)).toBeLessThan(1e-6);
    close(qToMat3(qSlerp(a, b, 0)), qToMat3(a));
    close(qToMat3(qSlerp(a, b, 1)), qToMat3(b));
    // And the path to the front elevation from any orientation is continuous
    const from = qFromEuler(30, 179.9, 40);
    let prev = qToMat3(from);
    for (let i = 1; i <= 100; i++) {
      const next = qToMat3(qSlerp(from, Q_IDENTITY, i / 100));
      let step = 0;
      for (let k = 0; k < 9; k++) {
        step = Math.max(step, Math.abs((next[k] as number) - (prev[k] as number)));
      }
      expect(step).toBeLessThan(0.1);
      prev = next;
    }
  });
});
