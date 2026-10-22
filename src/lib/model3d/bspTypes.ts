import type { FaceKind } from './house.ts';

/**
 * The house as a binary space partition (BSP), shipped as compact JSON (`house.bsp.json`) built
 * from the source geometry by `scripts/build-model-bsp.mjs`. The model never changes shape and only
 * the view rotates, so walking the tree from the eye gives a correct back-to-front order at every
 * angle. Everything is plain numbers so the phone does no building work at load.
 *
 *  - Vertices: millimetres, flat x y z; `vg` is the solid each vertex belongs to.
 *  - Nodes: [first item, item count, front node, back node]; the items of a node are coplanar.
 *  - Items (convex pieces of solid faces and free-standing boards):
 *      [kind, tone, group, id, first vertex slot, vertex count, real-edge mask, first detail, detail count]
 *  - Details (decals and hairlines clipped to their item):
 *      [kind, tone, first vertex slot, vertex count, real-edge mask, gap in mm (lines only)]
 *  - `slots` lists vertex indices for items then details.
 */
export interface BspData {
  kinds: FaceKind[];
  v: number[];
  vg: number[];
  slots: number[];
  nodes: number[];
  items: number[];
  details: number[];
  meta: {
    groups: number;
    build: [number, number][];
    base: number[];
    dissolve: number[];
    centre: [number, number, number];
    radius: number;
    height: number;
    footprint: { x0: number; x1: number };
    minLineSpacing: number;
    dimensions: {
      from: [number, number, number];
      to: [number, number, number];
      tick: [number, number, number];
      label: string;
      labelShift: [number, number, number];
    }[];
    ground: [number, number, number][][];
    stats: {
      sourceFaces: number;
      /** Faces of solids and boards in the source. */
      bodyFaces: number;
      /** Of those: cut by another solid, and wholly inside another solid (dropped). */
      trimmed: number;
      dropped: number;
      /** Pieces after trimming; items after the partition (the difference is its splits). */
      pieces: number;
      items: number;
      details: number;
      nodes: number;
    };
  };
}
