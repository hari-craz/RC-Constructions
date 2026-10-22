import { describe, expect, it } from 'vitest';
import { siteTarget } from '../siteTarget';
import { HOUSE } from './houseModel';
import { apply, pose as poseMatrix, type Vec3 } from './math';
import {
  buildFrame,
  DEFAULT_POSE,
  fitScale,
  gizmoAxes,
  kindOfClass,
  landing,
  modOfClass,
  restOptions,
  VIEW,
  type Frame,
} from './render';
import { staticHouseSvg } from './staticSvg';

const kinds = (f: Frame) => f.faces.map((x) => kindOfClass(x.cls));
const count = (f: Frame, kind: string) => kinds(f).filter((k) => k === kind).length;
/** Pieces drawn: subpaths (each starts with M), whatever the run structure. */
const subpaths = (f: Frame) => f.faces.reduce((n, x) => n + (x.d.match(/M/g)?.length ?? 0), 0);

describe('the house model', () => {
  it('is shipped as plain data: a BSP with bounded size', () => {
    expect(HOUSE.stats.sourceFaces).toBeLessThanOrEqual(600);
    expect(HOUSE.stats.items).toBeLessThanOrEqual(260);
    expect(HOUSE.v.length / 3).toBeLessThanOrEqual(2200);
    expect(HOUSE.groupBuild).toHaveLength(HOUSE.groups);
    expect(HOUSE.nodes.length / 4).toBe(HOUSE.stats.nodes);
  });

  it('shows far fewer pieces from one side than it holds (back faces are culled)', () => {
    const frame = buildFrame({ rx: 0, ry: 0, rz: 0 }, restOptions(0));
    expect(subpaths(frame)).toBeGreaterThan(50);
    expect(subpaths(frame)).toBeLessThan(HOUSE.stats.items + HOUSE.stats.details);
  });
});

describe('detail, intro and dissolve', () => {
  const opts = restOptions();

  it('draws hairline detail (siding, shingles, mullions) as open lines', () => {
    const frame = buildFrame(DEFAULT_POSE, opts);
    expect(count(frame, 'line') + count(frame, 'muntin')).toBeGreaterThan(5);
    for (const f of frame.faces) {
      const kind = kindOfClass(f.cls);
      if (kind === 'line' || kind === 'muntin') expect(f.d).not.toContain('Z');
    }
    expect(kinds(frame)).toContain('stone');
  });

  it('raises the house in stages: nothing at 0, more at 0.5, all at 1', () => {
    const n = (build: number) => subpaths(buildFrame(DEFAULT_POSE, { ...opts, build }));
    expect(n(0)).toBe(0);
    expect(n(0.3)).toBeGreaterThan(0);
    expect(n(0.6)).toBeGreaterThan(n(0.3));
    expect(n(1)).toBeGreaterThanOrEqual(n(0.6));
  });

  it('takes the house down top first and leaves the plinth on the ground', () => {
    const front = { rx: 0, ry: 0, rz: 0 };
    const o = { ...opts, invDistance: 0 };
    const whole = buildFrame(front, o);
    const early = buildFrame(front, { ...o, dissolve: 0.25 });
    const late = buildFrame(front, { ...o, dissolve: 0.7 });
    const gone = buildFrame(front, { ...o, dissolve: 1 });
    expect(whole.faces.every((f) => f.opacity === 1)).toBe(true);
    expect(early.faces.some((f) => f.opacity < 1)).toBe(true);
    expect(subpaths(late)).toBeLessThan(subpaths(whole));
    // At the end only the plinth (stone and its courses, the porch slab and steps) remains
    expect(gone.faces.length).toBeGreaterThan(0);
    expect(kinds(gone).every((k) => k === 'stone' || k === 'slab' || k === 'line')).toBe(true);
    // The main roofs (class 0) go before the ground storey (class 2); the porch roof is last but one
    const at40 = buildFrame(front, { ...o, dissolve: 0.4 });
    expect(subpaths(at40)).toBeLessThan(subpaths(whole));
    expect(count(whole, 'roof')).toBeGreaterThan(0);
    expect(count(at40, 'door')).toBeGreaterThan(0);
    expect(count(buildFrame(front, { ...o, dissolve: 0.95 }), 'roof')).toBe(0);
  });
});

describe('frame building', () => {
  const opts = restOptions();

  it('culls back faces: a half turn shows a different set', () => {
    const front = buildFrame({ rx: 0, ry: 0, rz: 0 }, opts);
    const back = buildFrame({ rx: 0, ry: 180, rz: 0 }, opts);
    expect(front.faces.map((f) => f.d)).not.toEqual(back.faces.map((f) => f.d));
    for (const f of [front, back])
      expect(subpaths(f)).toBeLessThan(HOUSE.stats.items + HOUSE.stats.details);
  });

  it('paints a window after the wall it lies on', () => {
    const frame = buildFrame({ rx: 25, ry: -35, rz: 0 }, opts);
    const k = kinds(frame);
    expect(k.indexOf('glass')).toBeGreaterThan(k.indexOf('wall'));
    expect(frame.ground.startsWith('M')).toBe(true);
    expect(frame.dimensions).toHaveLength(2);
  });

  it('draws every piece of a face with seams as a seam fill, with its real edges as a path of their own', () => {
    // Over the whole turntable the model has pieces cut by the partition; each is drawn as a seam
    // fill (stroke in its own colour) and never as an edge-stroked fill
    let seams = 0;
    let opens = 0;
    for (let ry = 0; ry < 360; ry += 15) {
      const frame = buildFrame({ rx: 20, ry, rz: 0 }, opts);
      seams += frame.faces.filter((f) => modOfClass(f.cls) === 1).length;
      opens += frame.faces.filter((f) => modOfClass(f.cls) === 2).length;
    }
    expect(seams).toBeGreaterThan(0);
    expect(opens).toBeGreaterThan(0);
  });

  it('joins paths into few runs: far fewer than the pieces drawn', () => {
    const frame = buildFrame(DEFAULT_POSE, opts);
    expect(frame.faces.length).toBeLessThan(subpaths(frame) / 2);
    expect(frame.faces.length).toBeLessThan(200);
  });

  it('keeps every house vertex inside the drawing at any rotation (the fit holds)', () => {
    const halfW = VIEW.width / 2;
    const halfH = VIEW.height / 2;
    const o = { ...opts, fill: 0.98 };
    const scale = fitScale(HOUSE, o);
    const nearest = 1 / (1 - HOUSE.radius * o.invDistance);
    // The bounding sphere never reaches beyond the drawing's shorter half side
    expect(HOUSE.radius * scale * nearest).toBeLessThanOrEqual(Math.min(halfW, halfH) * 0.9801);
    let worst = 0;
    for (let rx = -80; rx <= 80; rx += 20) {
      for (let ry = 0; ry < 360; ry += 30) {
        for (let rz = 0; rz < 360; rz += 60) {
          const m = poseMatrix(rx, ry, rz);
          for (let i = 0; i < HOUSE.v.length; i += 3) {
            const p = apply(m, [
              (HOUSE.v[i] as number) - HOUSE.centre[0],
              (HOUSE.v[i + 1] as number) - HOUSE.centre[1],
              (HOUSE.v[i + 2] as number) - HOUSE.centre[2],
            ] as Vec3);
            const f = 1 / (1 - p[2] * o.invDistance);
            worst = Math.max(worst, Math.hypot(p[0] * scale * f, p[1] * scale * f));
          }
        }
      }
    }
    expect(worst).toBeLessThanOrEqual(Math.min(halfW, halfH) * 0.9801);
  });

  it('keeps the eye at least 1.5 bounding radii from the model whatever perspective is asked for', () => {
    // An absurdly strong perspective is limited, so no vertex can come near the camera
    const strong = buildFrame(DEFAULT_POSE, { ...opts, invDistance: 1 });
    const limited = buildFrame(DEFAULT_POSE, { ...opts, invDistance: 1 / (1.5 * HOUSE.radius) });
    expect(strong.faces.map((f) => f.d)).toEqual(limited.faces.map((f) => f.d));
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

describe('level of detail', () => {
  const o = restOptions();

  it('leaves out surface hairlines but keeps massing, openings and trim when lines are off', () => {
    const full = buildFrame(DEFAULT_POSE, o);
    const lod = buildFrame(DEFAULT_POSE, { ...o, lines: false });
    expect(count(full, 'line')).toBeGreaterThan(5);
    expect(count(lod, 'line')).toBe(0);
    for (const kind of ['wall', 'roof', 'trim', 'stone', 'glass', 'door', 'muntin']) {
      expect(count(lod, kind) > 0, kind).toBe(count(full, kind) > 0);
    }
    expect(subpaths(lod)).toBeLessThan(subpaths(full));
  });

  it('drops a pattern whose lines would be closer than 1.5 px, and keeps it when zoomed in', () => {
    const near = buildFrame(DEFAULT_POSE, { ...o, unitsPerPx: 1 });
    const far = buildFrame(DEFAULT_POSE, { ...o, unitsPerPx: 40 });
    expect(count(near, 'line')).toBeGreaterThan(count(far, 'line'));
    expect(count(far, 'line')).toBe(0);
  });
});

describe('landing on the building', () => {
  it('puts the plinth on the target ground line and the footprint on the target width', () => {
    const t = siteTarget(1440, 900, false);
    const land = landing(t);
    const o = { ...restOptions(0), cx: land.cx, cy: land.cy, scale: land.scale, fill: 1 };
    const frame = buildFrame({ rx: 0, ry: 0, rz: 0 }, { ...o, dissolve: 1, quantum: 4 });
    // Only the plinth is left: its faces span the footprint and rest on the ground line
    const xs: number[] = [];
    const ys: number[] = [];
    for (const f of frame.faces) {
      for (const m of f.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
        xs.push(Number(m[1]) / 4);
        ys.push(Number(m[2]) / 4);
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
