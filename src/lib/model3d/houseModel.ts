import type { BspData } from './bspTypes';
import type { FaceKind } from './house';
import data from './house.bsp.json';

/** The house, ready to draw: typed arrays over the shipped BSP (see bspTypes.ts), no building at load. */
export interface BspModel {
  kinds: readonly FaceKind[];
  /** Vertex coordinates in metres (x y z), and the solid each vertex belongs to. */
  v: Float64Array;
  vg: Int16Array;
  slots: Int32Array;
  nodes: Int32Array;
  items: Int32Array;
  details: Int32Array;
  /** Per node: unit normal and offset of its plane (n . p = d), taken from its first item. */
  nodePlane: Float64Array;
  /** Per item: +1 if it faces the way its node's plane does, -1 if the opposite way. */
  itemSign: Int8Array;
  groups: number;
  groupBuild: readonly (readonly [number, number])[];
  groupBase: readonly number[];
  groupDissolve: readonly number[];
  centre: readonly [number, number, number];
  radius: number;
  height: number;
  footprint: { x0: number; x1: number };
  minLineSpacing: number;
  dimensions: BspData['meta']['dimensions'];
  ground: BspData['meta']['ground'];
  stats: BspData['meta']['stats'];
}

/** Item fields: [kind, tone, group, id, first slot, vertex count, real-edge mask, first detail, detail count]. */
export const ITEM_STRIDE = 9;
/** Detail fields: [kind, tone, first slot, vertex count, real-edge mask, gap in mm]. */
export const DETAIL_STRIDE = 6;

function loadBsp(raw: BspData): BspModel {
  const v = Float64Array.from(raw.v, (x) => x / 1000);
  const items = Int32Array.from(raw.items);
  const slots = Int32Array.from(raw.slots);
  const nodes = Int32Array.from(raw.nodes);
  const nodeCount = nodes.length / 4;
  const nodePlane = new Float64Array(nodeCount * 4);
  const itemSign = new Int8Array(items.length / ITEM_STRIDE);

  const newell = (start: number, count: number) => {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let k = 0; k < count; k++) {
      const a = (slots[start + k] as number) * 3;
      const b = (slots[start + ((k + 1) % count)] as number) * 3;
      const ax = v[a] as number;
      const ay = v[a + 1] as number;
      const az = v[a + 2] as number;
      const bx = v[b] as number;
      const by = v[b + 1] as number;
      const bz = v[b + 2] as number;
      nx += ay * bz - az * by;
      ny += az * bx - ax * bz;
      nz += ax * by - ay * bx;
    }
    return [nx, ny, nz] as const;
  };

  for (let n = 0; n < nodeCount; n++) {
    const first = nodes[n * 4] as number;
    const count = nodes[n * 4 + 1] as number;
    const base = first * ITEM_STRIDE;
    const start = items[base + 4] as number;
    const verts = items[base + 5] as number;
    const [x, y, z] = newell(start, verts);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const p = (slots[start] as number) * 3;
    nodePlane[n * 4] = nx;
    nodePlane[n * 4 + 1] = ny;
    nodePlane[n * 4 + 2] = nz;
    nodePlane[n * 4 + 3] =
      nx * (v[p] as number) + ny * (v[p + 1] as number) + nz * (v[p + 2] as number);
    for (let k = 0; k < count; k++) {
      const it = first + k;
      const [ix, iy, iz] = newell(
        items[it * ITEM_STRIDE + 4] as number,
        items[it * ITEM_STRIDE + 5] as number,
      );
      itemSign[it] = ix * nx + iy * ny + iz * nz >= 0 ? 1 : -1;
    }
  }

  const m = raw.meta;
  return {
    kinds: raw.kinds,
    v,
    vg: Int16Array.from(raw.vg),
    slots,
    nodes,
    items,
    details: Int32Array.from(raw.details),
    nodePlane,
    itemSign,
    groups: m.groups,
    groupBuild: m.build,
    groupBase: m.base,
    groupDissolve: m.dissolve,
    centre: m.centre,
    radius: m.radius,
    height: m.height,
    footprint: m.footprint,
    minLineSpacing: m.minLineSpacing,
    dimensions: m.dimensions,
    ground: m.ground,
    stats: m.stats,
  };
}

/** The hero house. */
export const HOUSE: BspModel = loadBsp(data as unknown as BspData);
export const DISSOLVE_CLASSES = 5;
