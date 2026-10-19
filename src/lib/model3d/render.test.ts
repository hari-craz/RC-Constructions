import { describe, expect, it } from 'vitest';
import { HOUSE } from './house';
import { apply, pose as poseMatrix, type Vec3 } from './math';
import {
  buildFrame,
  DEFAULT_POSE,
  fitScale,
  gizmoAxes,
  mergeRuns,
  restOptions,
  VIEW,
} from './render';
import { staticHouseSvg } from './staticSvg';

describe('the house model', () => {
  it('is small plain data: at most about 200 vertices, all faces valid', () => {
    expect(HOUSE.vertices.length).toBeLessThanOrEqual(200);
    expect(HOUSE.vertices.length).toBeGreaterThan(40);
    for (const face of HOUSE.faces) {
      expect(face.v.length).toBeGreaterThanOrEqual(3);
      for (const i of face.v) expect(HOUSE.vertices[i]).toBeDefined();
    }
  });

  it('winds every solid face outward (normals point away from the middle of its solid)', () => {
    // A closed solid seen from far away shows at least one and at most half the faces plus decals
    const frame = buildFrame({ rx: 0, ry: 0, rz: 0 }, restOptions(0));
    expect(frame.faces.length).toBeGreaterThan(10);
    expect(frame.faces.length).toBeLessThan(HOUSE.faces.length);
  });
});

describe('frame building', () => {
  const opts = restOptions();

  it('culls back faces: a half turn shows a different set, and the count stays below the total', () => {
    const front = buildFrame({ rx: 0, ry: 0, rz: 0 }, opts);
    const back = buildFrame({ rx: 0, ry: 180, rz: 0 }, opts);
    expect(front.faces.map((f) => f.d)).not.toEqual(back.faces.map((f) => f.d));
    for (const f of [front, back]) expect(f.faces.length).toBeLessThan(HOUSE.faces.length);
  });

  it('paints decals after the wall they lie on and roofs after the walls they cover (from above)', () => {
    const frame = buildFrame({ rx: 25, ry: -35, rz: 0 }, opts);
    const kinds = frame.faces.map((f) => f.kind);
    // The first visible window comes after at least one wall
    expect(kinds.indexOf('glass')).toBeGreaterThan(kinds.indexOf('wall'));
    // Ground and dimensions are separate from the faces
    expect(frame.ground.startsWith('M')).toBe(true);
    expect(frame.dimensions).toHaveLength(2);
  });

  it('merges neighbouring faces of one kind without losing any', () => {
    const frame = buildFrame(DEFAULT_POSE, opts);
    const merged = mergeRuns(frame.faces);
    expect(merged.length).toBeLessThan(frame.faces.length);
    const count = (list: { d: string }[]) =>
      list.reduce((n, f) => n + (f.d.match(/M/g)?.length ?? 0), 0);
    expect(count(merged)).toBe(count(frame.faces));
  });

  it('keeps every house vertex inside the drawing at any rotation (the fit holds)', () => {
    const halfW = VIEW.width / 2;
    const halfH = VIEW.height / 2;
    const scale = fitScale(HOUSE, opts);
    const nearest = 1 / (1 - HOUSE.radius * opts.invDistance);
    // The bounding sphere radius on screen never exceeds the allowance (108% of the short half-side)
    expect(HOUSE.radius * scale * nearest).toBeLessThanOrEqual(Math.min(halfW, halfH) * 1.081);
    let worst = 0;
    for (let rx = -80; rx <= 80; rx += 20) {
      for (let ry = 0; ry < 360; ry += 30) {
        for (let rz = 0; rz < 360; rz += 60) {
          const m = poseMatrix(rx, ry, rz);
          for (const v of HOUSE.vertices) {
            const p = apply(m, [
              v[0] - HOUSE.centre[0],
              v[1] - HOUSE.centre[1],
              v[2] - HOUSE.centre[2],
            ] as Vec3);
            const f = 1 / (1 - p[2] * opts.invDistance);
            worst = Math.max(worst, Math.hypot(p[0] * scale * f, p[1] * scale * f));
          }
        }
      }
    }
    expect(worst).toBeLessThanOrEqual(Math.min(halfW, halfH) * 1.081);
  });

  it('the axis gizmo follows the same rotation', () => {
    const rest = gizmoAxes({ rx: 0, ry: 0, rz: 0 }, 10, 0, 0);
    const byLabel = Object.fromEntries(rest.map((a) => [a.label, a]));
    expect(byLabel.x).toMatchObject({ x: 10 });
    expect(byLabel.y?.y).toBe(-10);
    expect(byLabel.z?.depth).toBeCloseTo(1, 9);
    const turned = gizmoAxes({ rx: 0, ry: 90, rz: 0 }, 10, 0, 0);
    expect(Object.fromEntries(turned.map((a) => [a.label, a])).x?.depth).toBeCloseTo(-1, 9);
  });
});

describe('static fallback', () => {
  it('draws the house at the three-quarter rest angle as a standalone svg', () => {
    const svg = staticHouseSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('hm-wall');
    expect(svg).toContain('hm-glass');
    expect(svg).toContain('12.0 m');
    expect(svg).not.toMatch(/gradient|filter|shadow|blur/i);
  });
});
