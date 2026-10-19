import { describe, expect, it } from 'vitest';
import {
  apply,
  clampTilt,
  IDENTITY,
  mul,
  pose,
  project,
  rotX,
  rotY,
  rotZ,
  wrapAngle,
  type Vec3,
} from './math';

const close = (a: Vec3, b: Vec3) => {
  expect(a[0]).toBeCloseTo(b[0], 9);
  expect(a[1]).toBeCloseTo(b[1], 9);
  expect(a[2]).toBeCloseTo(b[2], 9);
};

describe('rotation maths', () => {
  it('zero angles are the identity', () => {
    close(apply(pose(0, 0, 0), [1, 2, 3]), [1, 2, 3]);
    expect(pose(0, 0, 0).map((v) => Math.round(v))).toEqual([...IDENTITY]);
  });

  it('a quarter turn about y swings the front toward the right', () => {
    close(apply(rotY(90), [0, 0, 1]), [1, 0, 0]);
    close(apply(rotY(90), [1, 0, 0]), [0, 0, -1]);
    close(apply(rotY(90), [0, 1, 0]), [0, 1, 0]);
  });

  it('a quarter tilt about x brings the top toward the viewer', () => {
    close(apply(rotX(90), [0, 1, 0]), [0, 0, 1]);
    close(apply(rotX(90), [0, 0, 1]), [0, -1, 0]);
    close(apply(rotX(90), [1, 0, 0]), [1, 0, 0]);
  });

  it('a quarter roll about z turns anticlockwise on screen', () => {
    close(apply(rotZ(90), [1, 0, 0]), [0, 1, 0]);
    close(apply(rotZ(90), [0, 1, 0]), [-1, 0, 0]);
    close(apply(rotZ(90), [0, 0, 1]), [0, 0, 1]);
  });

  it('composes turn first, then tilt, then roll', () => {
    const v: Vec3 = [1, 0, 0];
    close(apply(pose(90, 90, 90), v), apply(rotZ(90), apply(rotX(90), apply(rotY(90), v))));
    // Order matters: tilt-then-turn differs from turn-then-tilt
    const a = apply(mul(rotX(90), rotY(90)), v);
    const b = apply(mul(rotY(90), rotX(90)), v);
    expect(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])).toBeGreaterThan(
      1,
    );
  });

  it('preserves length (a rotation never scales)', () => {
    const p = apply(pose(33, -71, 12), [3, 4, 12]);
    expect(Math.hypot(...p)).toBeCloseTo(13, 9);
  });

  it('clamps the tilt to about 80 degrees and wraps angles', () => {
    expect(clampTilt(120)).toBe(80);
    expect(clampTilt(-120)).toBe(-80);
    expect(clampTilt(25)).toBe(25);
    expect(wrapAngle(190)).toBe(-170);
    expect(wrapAngle(-190)).toBe(170);
    expect(wrapAngle(360)).toBe(0);
    expect(wrapAngle(180)).toBe(180);
  });
});

describe('projection', () => {
  const ortho = { invDistance: 0, scale: 10, cx: 100, cy: 50 };

  it('maps the centre to the camera centre and flips y for the screen', () => {
    expect(project([0, 0, 0], ortho)).toEqual({ x: 100, y: 50, depth: 0 });
    const p = project([2, 3, 5], ortho);
    expect(p.x).toBe(120);
    expect(p.y).toBe(20);
  });

  it('makes nearer points larger under perspective and leaves the centre alone', () => {
    const persp = { ...ortho, invDistance: 1 / 50 };
    const near = project([1, 0, 10], persp);
    const far = project([1, 0, -10], persp);
    expect(near.x - 100).toBeGreaterThan(far.x - 100);
    expect(project([0, 0, 0], persp).x).toBe(100);
    expect(near.depth).toBeGreaterThan(far.depth);
  });
});
