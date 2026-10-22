import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildBsp } from './bsp.ts';
import { buildHouseSource } from './house.ts';
import { DETAIL_STRIDE, HOUSE, ITEM_STRIDE } from './houseModel';
import { cross, dot, sub, type Vec3 } from './math.ts';

const source = buildHouseSource();
const vert = (i: number) => source.vertices[i] as Vec3;
const unit = (n: Vec3): Vec3 => {
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
};
const normalOf = (pts: Vec3[]) => {
  let n: Vec3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const c = cross(pts[i] as Vec3, pts[(i + 1) % pts.length] as Vec3);
    n = [n[0] + c[0], n[1] + c[1], n[2] + c[2]];
  }
  return n;
};
const mean = (pts: Vec3[]): Vec3 => [
  pts.reduce((a, p) => a + p[0], 0) / pts.length,
  pts.reduce((a, p) => a + p[1], 0) / pts.length,
  pts.reduce((a, p) => a + p[2], 0) / pts.length,
];

describe('the shipped BSP', () => {
  it('matches a fresh build from the source geometry (so the two never drift)', () => {
    const shipped = fs.readFileSync('src/lib/model3d/house.bsp.json', 'utf8');
    expect(shipped).toBe(`${JSON.stringify(buildBsp())}\n`);
  });

  it('numbers the face kinds the way the renderer expects', () => {
    expect(HOUSE.kinds).toEqual([
      'wall',
      'roof',
      'trim',
      'stone',
      'glass',
      'door',
      'line',
      'muntin',
      'slab',
    ]);
  });

  it('holds only items coplanar with their node, and detail lying in its item', () => {
    const offPlane = (n: number, slot: number) => {
      const i = slot * 3;
      return Math.abs(
        (HOUSE.nodePlane[n * 4] as number) * (HOUSE.v[i] as number) +
          (HOUSE.nodePlane[n * 4 + 1] as number) * (HOUSE.v[i + 1] as number) +
          (HOUSE.nodePlane[n * 4 + 2] as number) * (HOUSE.v[i + 2] as number) -
          (HOUSE.nodePlane[n * 4 + 3] as number),
      );
    };
    for (let n = 0; n < HOUSE.nodes.length / 4; n++) {
      const first = HOUSE.nodes[n * 4] as number;
      const count = HOUSE.nodes[n * 4 + 1] as number;
      expect(count).toBeGreaterThan(0);
      for (let k = 0; k < count; k++) {
        const o = (first + k) * ITEM_STRIDE;
        const start = HOUSE.items[o + 4] as number;
        for (let j = 0; j < (HOUSE.items[o + 5] as number); j++) {
          expect(offPlane(n, HOUSE.slots[start + j] as number)).toBeLessThan(2e-3);
        }
        const dFirst = HOUSE.items[o + 7] as number;
        for (let q = 0; q < (HOUSE.items[o + 8] as number); q++) {
          const dq = (dFirst + q) * DETAIL_STRIDE;
          const s = HOUSE.details[dq + 2] as number;
          for (let j = 0; j < (HOUSE.details[dq + 3] as number); j++) {
            expect(offPlane(n, HOUSE.slots[s + j] as number)).toBeLessThan(2e-3);
          }
        }
      }
    }
  });

  it('keeps the partition small: few splits, and not many more pieces than faces', () => {
    const { stats } = HOUSE;
    const solidAndBoards = source.faces.filter((f) => f.role !== 'detail').length;
    // Trimming adds a few pieces where a face is cut by another solid; the partition adds only a few
    expect(stats.pieces).toBeLessThanOrEqual(solidAndBoards * 1.7);
    expect(stats.items - stats.pieces).toBeLessThanOrEqual(12);
  });
});

describe('the source geometry', () => {
  const faces = source.faces.filter((f) => f.v.length >= 3);

  it('has only flat, convex faces', () => {
    for (const f of faces) {
      const pts = f.v.map(vert);
      const n = unit(normalOf(pts));
      const c = mean(pts);
      for (const p of pts) expect(Math.abs(dot(n, sub(p, c)))).toBeLessThan(1e-6);
      // Every turn has the same sense
      let sign = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = sub(pts[(i + 1) % pts.length] as Vec3, pts[i] as Vec3);
        const b = sub(pts[(i + 2) % pts.length] as Vec3, pts[(i + 1) % pts.length] as Vec3);
        const s = Math.sign(dot(cross(a, b), n));
        if (s !== 0) {
          if (sign === 0) sign = s;
          expect(s, `a ${f.kind} face is convex`).toBe(sign);
        }
      }
    }
  });

  it('winds every solid face outward: its normal points away from the middle of its solid', () => {
    for (let g = 0; g < source.groupBias.length; g++) {
      const solid = faces.filter((f) => f.group === g && f.role === 'solid');
      if (solid.length === 0) continue;
      const mid = mean(solid.flatMap((f) => f.v.map(vert)));
      for (const f of solid) {
        const pts = f.v.map(vert);
        expect(dot(normalOf(pts), sub(mean(pts), mid)), `group ${g} ${f.kind}`).toBeGreaterThan(
          -1e-9,
        );
      }
    }
  });

  it('winds every decal the way the face it lies on faces', () => {
    const solids = faces.filter((h) => h.role === 'solid');
    for (const f of faces.filter((x) => x.role === 'detail')) {
      const n = unit(normalOf(f.v.map(vert)));
      const host = solids.find((h) => {
        const pts = h.v.map(vert);
        const hn = unit(normalOf(pts));
        return (
          h.group === f.group &&
          dot(hn, n) > 0.999 &&
          f.v.every((i) => Math.abs(dot(hn, sub(vert(i), pts[0] as Vec3))) < 1e-5)
        );
      });
      expect(
        host,
        `a ${f.kind} decal lies on a face of its solid, facing the same way`,
      ).toBeDefined();
    }
  });
});
