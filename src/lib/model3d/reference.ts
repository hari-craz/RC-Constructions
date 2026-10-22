import { apply, type Mat3, type Vec3 } from './math';

/*
 * An independent reference renderer, used only by tests. It draws a set of convex polygons with a
 * per-pixel depth buffer (a z-buffer), writing a face id per pixel. It shares nothing with the real
 * renderer's draw order, so it can tell whether the painter's order is right at an orientation.
 */
export interface RefView {
  width: number;
  height: number;
  /** Rotation from model to view space (about the model centre). */
  matrix: Mat3;
  centre: Vec3;
  cx: number;
  cy: number;
  /** Drawing units per metre. */
  scale: number;
  /** 1 / eye distance from the model centre (0 = orthographic). */
  invDistance: number;
}

export interface RefPolygon {
  id: number;
  pts: readonly Vec3[];
}

interface Projected {
  x: number;
  y: number;
  /** Depth that grows toward the viewer and is linear in screen space. */
  d: number;
}

function project(view: RefView, v: Vec3): Projected {
  const r = apply(view.matrix, [
    v[0] - view.centre[0],
    v[1] - view.centre[1],
    v[2] - view.centre[2],
  ] as Vec3);
  const f = 1 / (1 - r[2] * view.invDistance);
  return {
    x: view.cx + r[0] * view.scale * f,
    y: view.cy - r[1] * view.scale * f,
    // Orthographic: z itself. Perspective: 1 / (eye distance - z), which is linear on screen.
    d: view.invDistance > 0 ? f * view.invDistance : r[2],
  };
}

export interface IdImage {
  ids: Int32Array;
  /** 1 where the two nearest surfaces are too close in depth to tell apart. */
  ambiguous: Uint8Array;
  width: number;
  height: number;
}

const edge = (ax: number, ay: number, bx: number, by: number, px: number, py: number) =>
  (bx - ax) * (py - ay) - (by - ay) * (px - ax);

/** Rasterise the polygons with a z-buffer. Back faces are culled, as in the real renderer. */
export function zbufferIds(polys: readonly RefPolygon[], view: RefView, depthEps = 1e-6): IdImage {
  const { width, height } = view;
  const ids = new Int32Array(width * height).fill(-1);
  const depth = new Float64Array(width * height).fill(-Infinity);
  const ambiguous = new Uint8Array(width * height);
  const scaleEps = view.invDistance > 0 ? depthEps * view.invDistance : depthEps;
  for (const poly of polys) {
    const p = poly.pts.map((v) => project(view, v));
    for (let k = 1; k + 1 < p.length; k++) {
      const a = p[0] as Projected;
      const b = p[k] as Projected;
      const c = p[k + 1] as Projected;
      const area = edge(a.x, a.y, b.x, b.y, c.x, c.y);
      if (Math.abs(area) < 1e-9) continue;
      // Screen y points down, so a front face (anticlockwise in the model's y-up view) has area < 0
      if (area > 0 && k === 1) {
        // Cull on the polygon's own orientation, taken from its first triangle
        break;
      }
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const py = y + 0.5;
          const w0 = edge(b.x, b.y, c.x, c.y, px, py) / area;
          const w1 = edge(c.x, c.y, a.x, a.y, px, py) / area;
          const w2 = edge(a.x, a.y, b.x, b.y, px, py) / area;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const d = w0 * a.d + w1 * b.d + w2 * c.d;
          const i = y * width + x;
          const cur = depth[i] as number;
          if (d > cur + scaleEps) {
            depth[i] = d;
            ids[i] = poly.id;
          } else if (d > cur - scaleEps && ids[i] !== poly.id) {
            ambiguous[i] = 1;
          }
        }
      }
    }
  }
  return { ids, ambiguous, width, height };
}

/** Paint projected convex polygons in the given order (later over earlier), writing face ids. */
export function paintIds(
  items: readonly { id: number; pts: readonly { x: number; y: number }[] }[],
  width: number,
  height: number,
): Int32Array {
  const ids = new Int32Array(width * height).fill(-1);
  for (const item of items) {
    const p = item.pts;
    if (p.length < 3) continue;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    let signed = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i] as { x: number; y: number };
      const b = p[(i + 1) % p.length] as { x: number; y: number };
      signed += a.x * b.y - b.x * a.y;
      minX = Math.min(minX, a.x);
      maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y);
      maxY = Math.max(maxY, a.y);
    }
    const sign = signed < 0 ? -1 : 1;
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(height - 1, Math.ceil(maxY)); y++) {
      for (let x = Math.max(0, Math.floor(minX)); x <= Math.min(width - 1, Math.ceil(maxX)); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let inside = true;
        for (let i = 0; i < p.length && inside; i++) {
          const a = p[i] as { x: number; y: number };
          const b = p[(i + 1) % p.length] as { x: number; y: number };
          if (edge(a.x, a.y, b.x, b.y, px, py) * sign < 0) inside = false;
        }
        if (inside) ids[y * width + x] = item.id;
      }
    }
  }
  return ids;
}

export interface Comparison {
  /** Pixels the reference covers with the model. */
  model: number;
  /** Pixels that differ, outside a 1 px band round face edges and ambiguous depth ties. */
  bad: number;
  /** The first few differing pixels, for a diff image. */
  mask: Uint8Array;
}

/** Compare a rendered id image with the reference, ignoring a 1 px band round face edges. */
export function compareIds(ref: IdImage, test: Int32Array, band = 1): Comparison {
  const { width, height } = ref;
  const mask = new Uint8Array(width * height);
  let model = 0;
  let bad = 0;
  const differsNear = (img: Int32Array, x: number, y: number) => {
    const v = img[y * width + x];
    for (let dy = -band; dy <= band; dy++) {
      for (let dx = -band; dx <= band; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (img[ny * width + nx] !== v) return true;
      }
    }
    return false;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const r = ref.ids[i] as number;
      const t = test[i] as number;
      if (r >= 0) model += 1;
      if (r === t) continue;
      if (ref.ambiguous[i]) continue;
      if (differsNear(ref.ids, x, y) || differsNear(test, x, y)) continue;
      bad += 1;
      mask[i] = 1;
    }
  }
  return { model, bad, mask };
}
