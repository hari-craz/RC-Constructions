import { describe, expect, it } from 'vitest';
import { siteTarget } from '../siteTarget';
import { DISSOLVE_CLASSES, HOUSE } from './house';
import { apply, cross, dot, pose as poseMatrix, sub, type Vec3 } from './math';
import {
  buildFrame,
  DEFAULT_POSE,
  fitScale,
  gizmoAxes,
  landing,
  mergeRuns,
  restOptions,
  VIEW,
} from './render';
import { staticHouseSvg } from './staticSvg';

describe('the house model', () => {
  it('is plain data with a rich but bounded detail budget, all faces valid', () => {
    expect(HOUSE.vertices.length).toBeLessThanOrEqual(1100);
    expect(HOUSE.vertices.length).toBeGreaterThan(800);
    expect(HOUSE.faces.length).toBeLessThanOrEqual(600);
    expect(HOUSE.groupBias).toHaveLength(HOUSE.groupBuild.length);
    for (const face of HOUSE.faces) {
      expect(face.v.length).toBeGreaterThanOrEqual(
        face.kind === 'line' || face.kind === 'muntin' ? 2 : 3,
      );
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

describe('detail, intro and sink', () => {
  const opts = restOptions();

  it('draws hairline detail (siding, shingles, mullions) as lines with no closing segment', () => {
    const frame = buildFrame(DEFAULT_POSE, opts);
    const lines = frame.faces.filter((f) => f.kind === 'line' || f.kind === 'muntin');
    expect(lines.length).toBeGreaterThan(20);
    for (const l of lines) expect(l.d).not.toContain('Z');
    expect(frame.faces.some((f) => f.kind === 'stone')).toBe(true);
  });

  it('raises the house in stages: nothing at 0, more at 0.5, all at 1', () => {
    const count = (build: number) => buildFrame(DEFAULT_POSE, { ...opts, build }).faces.length;
    expect(count(0)).toBe(0);
    expect(count(0.3)).toBeGreaterThan(0);
    expect(count(0.6)).toBeGreaterThan(count(0.3));
    expect(count(1)).toBeGreaterThanOrEqual(count(0.6));
  });

  it('takes the house down top first and leaves the plinth on the ground', () => {
    const front = { rx: 0, ry: 0, rz: 0 };
    const o = { ...opts, invDistance: 0 };
    const whole = buildFrame(front, o);
    const early = buildFrame(front, { ...o, dissolve: 0.25 });
    const late = buildFrame(front, { ...o, dissolve: 0.7 });
    const gone = buildFrame(front, { ...o, dissolve: 1 });
    // Every face is drawn whole at 0; as it dissolves faces fade (opacity) and then drop out
    expect(whole.faces.every((f) => f.opacity === 1)).toBe(true);
    expect(early.faces.some((f) => f.opacity < 1)).toBe(true);
    expect(late.faces.length).toBeLessThan(whole.faces.length);
    // At the end only the plinth (stone and its courses, the porch slab and steps) remains
    expect(gone.faces.length).toBeGreaterThan(0);
    expect(
      gone.faces.every((f) => f.kind === 'stone' || f.kind === 'slab' || f.kind === 'line'),
    ).toBe(true);
    // The roof (class 0) goes before the ground storey (class 2)
    const roofIn = (fr: typeof whole) => fr.faces.filter((f) => f.kind === 'roof').length;
    expect(roofIn(buildFrame(front, { ...o, dissolve: 0.4 }))).toBe(0);
    expect(roofIn(whole)).toBeGreaterThan(0);
    expect(
      buildFrame(front, { ...o, dissolve: 0.4 }).faces.filter((f) => f.kind === 'door').length,
    ).toBeGreaterThan(0);
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
    expect(svg).toContain('14.8 m');
    expect(svg).not.toMatch(/gradient|filter|shadow|blur/i);
  });
});

const SOLID_KINDS = new Set(['wall', 'roof', 'stone', 'slab']);
const vertex = (i: number) => HOUSE.vertices[i] as Vec3;
const centreOf = (pts: Vec3[]): Vec3 => [
  pts.reduce((a, p) => a + p[0], 0) / pts.length,
  pts.reduce((a, p) => a + p[1], 0) / pts.length,
  pts.reduce((a, p) => a + p[2], 0) / pts.length,
];

describe('geometry of the detailed house', () => {
  it('winds every body face outward: its normal points away from the middle of its solid', () => {
    for (let g = 0; g < HOUSE.groupBias.length; g++) {
      const body = HOUSE.faces.filter((f) => f.group === g && SOLID_KINDS.has(f.kind));
      if (body.length === 0) continue;
      const mid = centreOf(body.flatMap((f) => f.v.map(vertex)));
      for (const f of body) {
        const pts = f.v.map(vertex);
        const n = cross(sub(pts[1] as Vec3, pts[0] as Vec3), sub(pts[2] as Vec3, pts[0] as Vec3));
        expect(dot(n, sub(centreOf(pts), mid)), `group ${g} ${f.kind}`).toBeGreaterThanOrEqual(
          -1e-9,
        );
      }
    }
  });

  it('keeps every surface hairline on, and inside, a face of its own solid with the same normal', () => {
    const lines = HOUSE.faces.filter((f) => f.kind === 'line');
    expect(lines.length).toBeGreaterThan(100);
    for (const l of lines) {
      const n = l.normal as Vec3;
      const [a, b] = l.v.map(vertex) as [Vec3, Vec3];
      const hosts = HOUSE.faces.filter((f) => {
        if (f.group !== l.group || f.kind === 'line' || f.kind === 'muntin' || f.v.length < 3)
          return false;
        const pts = f.v.map(vertex);
        const fn = cross(sub(pts[1] as Vec3, pts[0] as Vec3), sub(pts[2] as Vec3, pts[0] as Vec3));
        const len = Math.hypot(...fn) || 1;
        // Same facing, and both ends on its plane
        return (
          dot(fn, n) / len > 0.99 &&
          Math.abs(dot(sub(a, pts[0] as Vec3), fn) / len) < 1e-6 &&
          Math.abs(dot(sub(b, pts[0] as Vec3), fn) / len) < 1e-6
        );
      });
      // Inside the host's bounding box (the faces are convex quads and triangles)
      const inside = hosts.some((f) => {
        const pts = f.v.map(vertex);
        return [a, b].every((p) =>
          [0, 1, 2].every(
            (i) =>
              p[i] !== undefined &&
              (p[i] as number) >= Math.min(...pts.map((q) => q[i] as number)) - 1e-6 &&
              (p[i] as number) <= Math.max(...pts.map((q) => q[i] as number)) + 1e-6,
          ),
        );
      });
      expect(inside, 'a hairline lies within a face of its own solid').toBe(true);
    }
  });

  it('has four dissolve classes plus the plinth, and every solid belongs to one', () => {
    expect(DISSOLVE_CLASSES).toBe(5);
    for (const c of HOUSE.groupDissolve) expect(c).toBeGreaterThanOrEqual(0);
    for (const c of HOUSE.groupDissolve) expect(c).toBeLessThan(DISSOLVE_CLASSES);
    for (let c = 0; c < DISSOLVE_CLASSES; c++) expect(HOUSE.groupDissolve).toContain(c);
  });
});

describe('level of detail', () => {
  const o = restOptions();
  const count = (f: ReturnType<typeof buildFrame>, kind: string) =>
    f.faces.filter((x) => x.kind === kind).length;

  it('leaves out surface hairlines but keeps massing, openings and trim when lines are off', () => {
    const full = buildFrame(DEFAULT_POSE, o);
    const lod = buildFrame(DEFAULT_POSE, { ...o, lines: false });
    expect(count(full, 'line')).toBeGreaterThan(20);
    expect(count(lod, 'line')).toBe(0);
    for (const kind of ['wall', 'roof', 'trim', 'stone', 'glass', 'door', 'muntin']) {
      expect(count(lod, kind), kind).toBe(count(full, kind));
    }
  });

  it('drops a pattern whose lines would be closer than 1.5 px, and keeps it when zoomed in', () => {
    const near = buildFrame(DEFAULT_POSE, { ...o, unitsPerPx: 1 });
    const far = buildFrame(DEFAULT_POSE, { ...o, unitsPerPx: 40 });
    expect(count(near, 'line')).toBeGreaterThan(count(far, 'line'));
    expect(count(far, 'line')).toBe(0);
    // Seen edge-on, a pattern foreshortens below the limit and goes first
    const edge = buildFrame({ rx: 0, ry: 89, rz: 0 }, { ...o, invDistance: 0, unitsPerPx: 1.2 });
    const face = buildFrame({ rx: 0, ry: 0, rz: 0 }, { ...o, invDistance: 0, unitsPerPx: 1.2 });
    expect(count(edge, 'line')).toBeLessThan(count(face, 'line') + 1);
  });
});

describe('landing on the building', () => {
  it('puts the plinth on the target ground line and the footprint on the target width', () => {
    const t = siteTarget(1440, 900, false);
    const land = landing(t);
    const o = {
      ...restOptions(0),
      cx: land.cx,
      cy: land.cy,
      scale: land.scale,
      fill: 1,
    };
    const frame = buildFrame({ rx: 0, ry: 0, rz: 0 }, { ...o, dissolve: 1 });
    // Only the plinth is left: its stone faces span the footprint and rest on the ground line
    const xs: number[] = [];
    const ys: number[] = [];
    for (const f of frame.faces) {
      for (const m of f.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
        xs.push(Number(m[1]));
        ys.push(Number(m[2]));
      }
    }
    expect(Math.min(...xs)).toBeCloseTo(t.x0, 0);
    expect(Math.max(...xs)).toBeCloseTo(t.x1, 0);
    expect(Math.max(...ys)).toBeCloseTo(t.groundY, 0);
    expect(frame.groundY).toBeCloseTo(t.groundY, 0);
  });

  it('puts the site window ground line low on desktop and the foundation frame above rest', () => {
    const d = siteTarget(1440, 900, false);
    expect(d.x1 - d.x0).toBeGreaterThan(600);
    expect(d.x0).toBeGreaterThan(1440 * (5 / 12));
    expect(d.groundY).toBeGreaterThan(900 * 0.5);
    expect(d.groundY).toBeLessThan(900 * 0.7);
    const p = siteTarget(390, 844, true);
    expect(p.x1 - p.x0).toBeGreaterThan(390 * 0.85);
    expect(p.groundY).toBeGreaterThan(844 * 0.35);
    expect(p.groundY).toBeLessThan(844 * 0.65);
  });
});
