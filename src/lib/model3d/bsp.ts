import type { BspData } from './bspTypes.ts';
import { buildHouseSource, type FaceKind, type HouseSource } from './house.ts';

/*
 * Builds the house's BSP (see bspTypes.ts) from its source geometry. Used by
 * scripts/build-model-bsp.mjs and by the test that checks the shipped JSON has not drifted. Plain
 * TypeScript with no dependencies, so Node can run it directly.
 *
 * Steps:
 *  1. Trim: the part of a solid's face that lies inside another solid is cut away (a porch roof ends
 *     at the wall, a cross gable meets the main roof along the valley). Cuts made here are real edges.
 *  2. Attach: every decal and hairline is attached to the face it lies on, and clipped to each piece
 *     of it, so detail is always drawn with its face and can never show through a nearer one.
 *  3. Partition: the pieces (and free-standing boards) are split by the planes of other pieces until
 *     the tree gives a correct back-to-front order from any eye position. Cuts made here are seams,
 *     not edges.
 */
const EPS = 1e-6;
const MIN_AREA = 1e-9;

type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mulv = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dotv = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crossv = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const lenv = (a: V) => Math.hypot(a[0], a[1], a[2]);
const unitv = (a: V): V => {
  const l = lenv(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

interface Plane {
  n: V;
  d: number;
}

interface Poly {
  pts: V[];
  /** real[i]: the edge pts[i] to pts[i + 1] is a real edge (drawn), not a cut made while preparing. */
  real: boolean[];
}

/** Area-weighted normal of a polygon (twice its area in length). */
function newell(pts: readonly V[]): V {
  let n: V = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    n = addv(n, crossv(pts[i] as V, pts[(i + 1) % pts.length] as V));
  }
  return n;
}

const areaOf = (pts: readonly V[]) => lenv(newell(pts)) / 2;

function planeOf(pts: readonly V[]): Plane {
  const n = unitv(newell(pts));
  return { n, d: dotv(n, pts[0] as V) };
}

const signedDist = (pl: Plane, p: V) => dotv(pl.n, p) - pl.d;

function clean(list: { p: V; real: boolean }[]): Poly | null {
  const out: { p: V; real: boolean }[] = [];
  for (const q of list) {
    const prev = out[out.length - 1];
    if (prev && lenv(sub(prev.p, q.p)) < EPS) prev.real = q.real;
    else out.push({ p: q.p, real: q.real });
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (out.length > 1 && first && last && lenv(sub(first.p, last.p)) < EPS) {
    last.real = out[0]?.real ?? last.real;
    out.shift();
  }
  if (out.length < 3) return null;
  const pts = out.map((q) => q.p);
  if (areaOf(pts) < MIN_AREA) return null;
  return { pts, real: out.map((q) => q.real) };
}

interface Split {
  front: Poly | null;
  back: Poly | null;
  coplanar: boolean;
}

/** Split a convex polygon by a plane. `cutReal` says whether the new edge is a real edge. */
function splitPoly(poly: Poly, pl: Plane, cutReal: boolean): Split {
  const n = poly.pts.length;
  const d = poly.pts.map((p) => {
    const x = signedDist(pl, p);
    return Math.abs(x) <= EPS ? 0 : x;
  });
  const pos = d.some((x) => x > 0);
  const neg = d.some((x) => x < 0);
  if (!pos && !neg) return { front: null, back: null, coplanar: true };
  if (!neg) return { front: poly, back: null, coplanar: false };
  if (!pos) return { front: null, back: poly, coplanar: false };
  const front: { p: V; real: boolean }[] = [];
  const back: { p: V; real: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly.pts[i] as V;
    const b = poly.pts[(i + 1) % n] as V;
    const da = d[i] as number;
    const db = d[(i + 1) % n] as number;
    const f = poly.real[i] as boolean;
    const sa = Math.sign(da);
    const sb = Math.sign(db);
    if (sa >= 0) front.push({ p: a, real: sb >= 0 ? f : sa > 0 ? f : cutReal });
    if (sa <= 0) back.push({ p: a, real: sb <= 0 ? f : sa < 0 ? f : cutReal });
    if (sa * sb < 0) {
      const t = da / (da - db);
      const x = addv(a, mulv(sub(b, a), t));
      front.push({ p: x, real: sa > 0 ? cutReal : f });
      back.push({ p: x, real: sa < 0 ? cutReal : f });
    }
  }
  return { front: clean(front), back: clean(back), coplanar: false };
}

/** Split a segment by a plane: the part in front and the part behind (either may be null). */
function splitSegment(a: V, b: V, pl: Plane): { front: [V, V] | null; back: [V, V] | null } {
  const da0 = signedDist(pl, a);
  const db0 = signedDist(pl, b);
  const da = Math.abs(da0) <= EPS ? 0 : da0;
  const db = Math.abs(db0) <= EPS ? 0 : db0;
  const long = (p: V, q: V) => lenv(sub(p, q)) > 1e-5;
  if (da >= 0 && db >= 0) return { front: long(a, b) ? [a, b] : null, back: null };
  if (da <= 0 && db <= 0) return { front: null, back: long(a, b) ? [a, b] : null };
  const x = addv(a, mulv(sub(b, a), da / (da - db)));
  const first: [V, V] = [a, x];
  const second: [V, V] = [x, b];
  return da > 0
    ? { front: long(...first) ? first : null, back: long(...second) ? second : null }
    : { front: long(...second) ? second : null, back: long(...first) ? first : null };
}

/** Is the point on the polygon's outline (within a hair)? */
function onOutline(poly: Poly, p: V): boolean {
  for (let i = 0; i < poly.pts.length; i++) {
    const a = poly.pts[i] as V;
    const b = poly.pts[(i + 1) % poly.pts.length] as V;
    const ab = sub(b, a);
    const t = Math.max(0, Math.min(1, dotv(sub(p, a), ab) / (dotv(ab, ab) || 1)));
    if (lenv(sub(p, addv(a, mulv(ab, t)))) < 1e-5) return true;
  }
  return false;
}

/**
 * Subtract a convex volume (planes with outward normals) from a polygon; the outside parts remain.
 * A polygon the volume does not reach is returned whole. Where it is cut, an edge of a piece is a
 * real edge only if it lies along the part that was removed (a face meeting another solid); the
 * other cuts are seams between pieces that are both kept.
 */
function subtractVolume(poly: Poly, volume: readonly Plane[], keepInterface: boolean): Poly[] {
  // A polygon wholly outside one of the planes (touching it at most) does not meet the volume at
  // all: keep it whole instead of cutting it by the other planes
  for (const pl of volume) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of poly.pts) {
      const x = signedDist(pl, p);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    if (lo >= -EPS && hi > EPS) return [poly];
  }
  const out: Poly[] = [];
  const own = unitv(newell(poly.pts));
  let rest: Poly | null = poly;
  for (const pl of volume) {
    if (!rest) break;
    const r = splitPoly(rest, pl, false);
    if (r.coplanar) {
      // On the volume's own surface: facing out it stays; facing in it is an interface between two
      // solids, hidden unless the other solid goes first
      if (dotv(own, pl.n) > 0 || keepInterface) return [poly];
      continue;
    }
    if (r.front) out.push(r.front);
    rest = r.back;
  }
  // The part removed is `rest`. If nothing was removed the polygon is outside: keep it whole.
  if (!rest) return [poly];
  const removed = rest;
  return out.map((piece) => ({
    pts: piece.pts,
    real: piece.real.map((flag, i) => {
      if (flag) return true;
      const a = piece.pts[i] as V;
      const b = piece.pts[(i + 1) % piece.pts.length] as V;
      return onOutline(removed, mulv(addv(a, b), 0.5));
    }),
  }));
}

/** Planes (outward normals) that bound a convex polygon's own plane region, for clipping in plane. */
function edgePlanes(poly: Poly): Plane[] {
  const n = unitv(newell(poly.pts));
  return poly.pts.map((a, i) => {
    const b = poly.pts[(i + 1) % poly.pts.length] as V;
    const out = unitv(crossv(sub(b, a), n));
    return { n: out, d: dotv(out, a) };
  });
}

function clipPolyTo(poly: Poly, planes: readonly Plane[]): Poly | null {
  let cur: Poly | null = poly;
  for (const pl of planes) {
    if (!cur) return null;
    const r = splitPoly(cur, pl, false);
    if (r.coplanar) return null;
    cur = r.back;
  }
  return cur;
}

function clipSegmentTo(a0: V, b0: V, planes: readonly Plane[]): [V, V] | null {
  let seg: [V, V] | null = [a0, b0];
  for (const pl of planes) {
    if (!seg) return null;
    seg = splitSegment(seg[0], seg[1], pl).back;
  }
  return seg;
}

// ---- Items and details ----------------------------------------------------------------------

interface DetailPoly {
  type: 'poly';
  kind: FaceKind;
  tone: 0 | 1 | 2;
  order: number;
  poly: Poly;
}
interface DetailLine {
  type: 'line';
  kind: FaceKind;
  order: number;
  a: V;
  b: V;
  gap: number;
}
type Detail = DetailPoly | DetailLine;

interface Item {
  poly: Poly;
  plane: Plane;
  kind: FaceKind;
  tone: 0 | 1 | 2;
  group: number;
  /** Source face index, for the reference test. */
  id: number;
  order: number;
  details: Detail[];
}

function splitItem(item: Item, pl: Plane): { front: Item | null; back: Item | null } {
  const r = splitPoly(item.poly, pl, false);
  const front: Item | null = r.front ? { ...item, poly: r.front, details: [] } : null;
  const back: Item | null = r.back ? { ...item, poly: r.back, details: [] } : null;
  for (const dt of item.details) {
    if (dt.type === 'poly') {
      const s = splitPoly(dt.poly, pl, false);
      if (s.front) front?.details.push({ ...dt, poly: s.front });
      if (s.back) back?.details.push({ ...dt, poly: s.back });
    } else {
      const s = splitSegment(dt.a, dt.b, pl);
      if (s.front) front?.details.push({ ...dt, a: s.front[0], b: s.front[1] });
      if (s.back) back?.details.push({ ...dt, a: s.back[0], b: s.back[1] });
    }
  }
  return { front, back };
}

interface TreeNode {
  items: Item[];
  front: TreeNode | null;
  back: TreeNode | null;
}

function classify(item: Item, pl: Plane): 'front' | 'back' | 'coplanar' | 'span' {
  let pos = false;
  let neg = false;
  for (const p of item.poly.pts) {
    const x = signedDist(pl, p);
    if (x > EPS) pos = true;
    else if (x < -EPS) neg = true;
  }
  if (pos && neg) return 'span';
  if (pos) return 'front';
  if (neg) return 'back';
  return 'coplanar';
}

function buildTree(items: Item[]): TreeNode | null {
  if (items.length === 0) return null;
  // Choose the splitter: among the largest pieces, the plane that cuts the fewest others and
  // balances the two sides
  const byArea = [...items].sort((a, b) => areaOf(b.poly.pts) - areaOf(a.poly.pts));
  const candidates = byArea.slice(0, Math.min(40, byArea.length));
  let best = candidates[0] as Item;
  let bestCost = Infinity;
  for (const c of candidates) {
    let splits = 0;
    let f = 0;
    let b = 0;
    for (const it of items) {
      const k = classify(it, c.plane);
      if (k === 'span') splits += 1;
      else if (k === 'front') f += 1;
      else if (k === 'back') b += 1;
    }
    const cost = splits * 6 + Math.abs(f - b) * 0.25;
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  const pl = best.plane;
  const here: Item[] = [];
  const front: Item[] = [];
  const back: Item[] = [];
  for (const it of items) {
    const k = classify(it, pl);
    if (k === 'coplanar') here.push(it);
    else if (k === 'front') front.push(it);
    else if (k === 'back') back.push(it);
    else {
      const s = splitItem(it, pl);
      if (s.front) front.push(s.front);
      if (s.back) back.push(s.back);
    }
  }
  here.sort((a, b) => a.order - b.order);
  return { items: here, front: buildTree(front), back: buildTree(back) };
}

// ---- Build ------------------------------------------------------------------------------------

/** Build the BSP and everything the renderer needs from the source geometry. */
export function buildBsp(src: HouseSource = buildHouseSource()): BspData {
  const vertex = (i: number) => [...(src.vertices[i] as readonly number[])] as V;
  const kindsList: FaceKind[] = [
    'wall',
    'roof',
    'trim',
    'stone',
    'glass',
    'door',
    'line',
    'muntin',
    'slab',
  ];

  // Volumes of the solids (planes with outward normals, plus the bounding box)
  const volumes: Plane[][] = Array.from({ length: src.groupBias.length }, () => []);
  const boxes: { lo: V; hi: V }[] = volumes.map(() => ({
    lo: [Infinity, Infinity, Infinity],
    hi: [-Infinity, -Infinity, -Infinity],
  }));
  src.faces.forEach((f) => {
    if (f.role !== 'solid') return;
    const pts = f.v.map(vertex);
    (volumes[f.group] as Plane[]).push(planeOf(pts));
    const bb = boxes[f.group] as { lo: V; hi: V };
    for (const p of pts) {
      for (let i = 0; i < 3; i++) {
        bb.lo[i] = Math.min(bb.lo[i] as number, p[i] as number);
        bb.hi[i] = Math.max(bb.hi[i] as number, p[i] as number);
      }
    }
  });
  boxes.forEach((bb, g) => {
    const vol = volumes[g] as Plane[];
    for (let i = 0; i < 3; i++) {
      const e: V = [0, 0, 0];
      e[i] = 1;
      vol.push({ n: e, d: bb.hi[i] as number });
      vol.push({ n: mulv(e, -1), d: -(bb.lo[i] as number) });
    }
  });

  // Solid faces, boards and details
  interface Host {
    id: number;
    group: number;
    poly: Poly;
    plane: Plane;
    kind: FaceKind;
    tone: 0 | 1 | 2;
    order: number;
    role: 'solid' | 'board';
    details: Detail[];
  }
  const hosts: Host[] = [];
  src.faces.forEach((f, id) => {
    if (f.role === 'detail') return;
    const pts = f.v.map(vertex);
    hosts.push({
      id,
      group: f.group,
      poly: { pts, real: pts.map(() => true) },
      plane: planeOf(pts),
      kind: f.kind,
      tone: f.tone,
      order: id,
      role: f.role,
      details: [],
    });
  });

  const inside = (poly: Poly, p: V) => edgePlanes(poly).every((pl) => signedDist(pl, p) <= 1e-5);
  src.faces.forEach((f, id) => {
    if (f.role !== 'detail') return;
    const pts = f.v.map(vertex);
    const isLine = f.v.length === 2;
    const normal = isLine ? (f.normal as V) : unitv(newell(pts));
    const host = hosts.find(
      (h) =>
        h.role === 'solid' &&
        h.group === f.group &&
        dotv(h.plane.n, normal) > 0.999 &&
        pts.every((p) => Math.abs(signedDist(h.plane, p)) < 1e-5) &&
        pts.every((p) => inside(h.poly, p)),
    );
    if (!host) throw new Error(`Detail face ${id} (${f.kind}) lies on no face of its solid`);
    if (isLine) {
      host.details.push({
        type: 'line',
        kind: f.kind,
        order: id,
        a: pts[0] as V,
        b: pts[1] as V,
        gap: f.gap ?? 0,
      });
    } else {
      host.details.push({
        type: 'poly',
        kind: f.kind,
        tone: f.tone,
        order: id,
        poly: { pts, real: pts.map(() => true) },
      });
    }
  });

  // Trim solid faces by the other solids, then attach clipped detail to each piece
  const items: Item[] = [];
  let pieceCount = 0;
  let trimmed = 0;
  let dropped = 0;
  let bodyFaces = 0;
  for (const h of hosts) {
    let pieces: Poly[] = [h.poly];
    if (h.role === 'solid') {
      pieces = [];
      let current: Poly[] = [h.poly];
      for (let g = 0; g < volumes.length; g++) {
        if (g === h.group) continue;
        // An interface with a solid that is taken down first must stay (a plinth top under walls)
        const keep = (src.groupDissolve[g] as number) < (src.groupDissolve[h.group] as number);
        current = current.flatMap((p) => subtractVolume(p, volumes[g] as Plane[], keep));
      }
      pieces = current;
      bodyFaces += 1;
      if (pieces.length === 0) dropped += 1;
      else if (pieces.length > 1 || pieces[0] !== h.poly) trimmed += 1;
    }
    for (const poly of pieces) {
      pieceCount += 1;
      const planes = edgePlanes(poly);
      const details: Detail[] = [];
      for (const dt of h.details) {
        if (dt.type === 'poly') {
          const c = clipPolyTo(dt.poly, planes);
          if (c) details.push({ ...dt, poly: c });
        } else {
          const c = clipSegmentTo(dt.a, dt.b, planes);
          if (c) details.push({ ...dt, a: c[0], b: c[1] });
        }
      }
      details.sort((a, b) => a.order - b.order);
      items.push({
        poly,
        plane: planeOf(poly.pts),
        kind: h.kind,
        tone: h.tone,
        group: h.group,
        id: h.id,
        order: h.order,
        details,
      });
    }
  }

  const tree = buildTree(items);

  // Serialise: nodes in preorder, vertices shared inside a solid and rounded to a millimetre
  const v: number[] = [];
  const vg: number[] = [];
  const slots: number[] = [];
  const nodes: number[] = [];
  const outItems: number[] = [];
  const outDetails: number[] = [];
  const index = new Map<string, number>();
  const vert = (p: V, group: number) => {
    const key = `${group}:${Math.round(p[0] * 1000)}:${Math.round(p[1] * 1000)}:${Math.round(p[2] * 1000)}`;
    let i = index.get(key);
    if (i === undefined) {
      i = v.length / 3;
      v.push(Math.round(p[0] * 1000), Math.round(p[1] * 1000), Math.round(p[2] * 1000));
      vg.push(group);
      index.set(key, i);
    }
    return i;
  };
  const mask = (real: boolean[]) => real.reduce((m, r, i) => (r ? m | (1 << i) : m), 0);
  let itemTotal = 0;
  let detailTotal = 0;
  const emit = (node: TreeNode | null): number => {
    if (!node) return -1;
    const at = nodes.length / 4;
    nodes.push(0, 0, -1, -1);
    nodes[at * 4] = outItems.length / 9;
    nodes[at * 4 + 1] = node.items.length;
    for (const it of node.items) {
      itemTotal += 1;
      const start = slots.length;
      for (const p of it.poly.pts) slots.push(vert(p, it.group));
      const dStart = outDetails.length / 6;
      for (const dt of it.details) {
        detailTotal += 1;
        const s = slots.length;
        if (dt.type === 'poly') {
          for (const p of dt.poly.pts) slots.push(vert(p, it.group));
          outDetails.push(
            kindsList.indexOf(dt.kind),
            dt.tone,
            s,
            dt.poly.pts.length,
            mask(dt.poly.real),
            0,
          );
        } else {
          slots.push(vert(dt.a, it.group), vert(dt.b, it.group));
          outDetails.push(kindsList.indexOf(dt.kind), 0, s, 2, 0, Math.round(dt.gap * 1000));
        }
      }
      outItems.push(
        kindsList.indexOf(it.kind),
        it.tone,
        it.group,
        it.id,
        start,
        it.poly.pts.length,
        mask(it.poly.real),
        dStart,
        it.details.length,
      );
    }
    const front = emit(node.front);
    const back = emit(node.back);
    nodes[at * 4 + 2] = front;
    nodes[at * 4 + 3] = back;
    return at;
  };
  emit(tree);

  const r3 = (p: readonly number[]): [number, number, number] => [
    Math.round((p[0] as number) * 1000) / 1000,
    Math.round((p[1] as number) * 1000) / 1000,
    Math.round((p[2] as number) * 1000) / 1000,
  ];
  return {
    kinds: kindsList,
    v,
    vg,
    slots,
    nodes,
    items: outItems,
    details: outDetails,
    meta: {
      groups: src.groupBias.length,
      build: src.groupBuild.map((b) => [b.start, b.end] as [number, number]),
      base: src.groupBase.map((b) => Math.round(b * 1000) / 1000),
      dissolve: [...src.groupDissolve],
      centre: r3(src.centre),
      radius: Math.round(src.radius * 1000) / 1000,
      height: Math.round(src.height * 1000) / 1000,
      footprint: { x0: src.footprint.x0, x1: src.footprint.x1 },
      minLineSpacing: Math.round(src.minLineSpacing * 1000) / 1000,
      dimensions: src.dimensions.map((d) => ({
        from: r3(d.from),
        to: r3(d.to),
        tick: r3(d.tick),
        label: d.label,
        labelShift: r3(d.labelShift),
      })),
      ground: src.ground.map((o) => o.map(r3)),
      stats: {
        sourceFaces: src.faces.length,
        bodyFaces,
        trimmed,
        dropped,
        pieces: pieceCount,
        items: itemTotal,
        details: detailTotal,
        nodes: nodes.length / 4,
      },
    },
  };
}
