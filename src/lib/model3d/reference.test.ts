import { describe, expect, it } from 'vitest';
import { buildHouseSource } from './house.ts';
import { HOUSE } from './houseModel';
import { pose as poseMatrix, type Vec3 } from './math';
import { compareIds, paintIds, zbufferIds, type RefPolygon } from './reference';
import { buildIdPolygons, fitScale, REST_INV_DISTANCE } from './render';

/*
 * The BSP draw order against an independent z-buffer reference (src/lib/model3d/reference.ts): the
 * same polygons are drawn each in its own id, once in the real renderer's order (painter's algorithm)
 * and once with a per-pixel depth test; fewer than 0.3 percent of the model's pixels may differ
 * (outside a 1 px band round face edges). The full-size comparison on the real SVG is in
 * e2e/phase-14e.spec.ts; this runs the whole turntable grid at a smaller size.
 */
const source = buildHouseSource();
const bodies: RefPolygon[] = source.faces
  .map((f, id) => ({ f, id }))
  .filter(({ f }) => f.role !== 'detail')
  .map(({ f, id }) => ({ id, pts: f.v.map((i) => source.vertices[i] as Vec3) }));

function worstMismatch(w: number, h: number, poses: [number, number, number][]) {
  const base = {
    invDistance: REST_INV_DISTANCE,
    halfSize: Math.min(w, h) / 2,
    cx: w / 2,
    cy: h / 2,
    fill: 0.96,
  };
  const scale = fitScale(HOUSE, base);
  let worst = 0;
  let at: number[] = [];
  for (const [rx, ry, rz] of poses) {
    const matrix = poseMatrix(rx, ry, rz);
    const ref = zbufferIds(bodies, {
      width: w,
      height: h,
      matrix,
      centre: source.centre,
      cx: w / 2,
      cy: h / 2,
      scale,
      invDistance: REST_INV_DISTANCE,
    });
    const img = paintIds(buildIdPolygons(matrix, { ...base, scale }), w, h);
    const c = compareIds(ref, img);
    const frac = c.bad / Math.max(1, c.model);
    if (frac > worst) {
      worst = frac;
      at = [rx, ry, rz];
    }
  }
  return { worst, at };
}

function grid(step: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  let n = 0;
  for (let ry = 0; ry < 360; ry += 15)
    for (let rx = -80; rx <= 80; rx += 20)
      for (let rz = -45; rz <= 45; rz += 15) if (n++ % step === 0) out.push([rx, ry, rz]);
  return out;
}

describe('draw order against the z-buffer reference', () => {
  it('differs in fewer than 0.3 percent of pixels over the whole turntable grid (phone size, half scale)', () => {
    const { worst, at } = worstMismatch(195, 422, grid(1));
    expect(worst, `worst at ${at.join(',')}`).toBeLessThan(0.003);
  }, 180000);

  it('and at random orientations, with the tilt past the limit too', () => {
    let s = 12345;
    const next = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    const poses: [number, number, number][] = Array.from({ length: 50 }, () => [
      next() * 180 - 90,
      next() * 360,
      next() * 360 - 180,
    ]);
    const { worst, at } = worstMismatch(260, 400, poses);
    expect(worst, `worst at ${at.join(',')}`).toBeLessThan(0.003);
  }, 180000);
});
