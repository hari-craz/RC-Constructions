/**
 * Building elevation geometry (viewBox units). One source of truth for the SVG and its tests.
 * Ground line at y = 700; four storeys on a three-bay frame with a stair core on the right.
 */
export const VIEWBOX = { width: 1200, height: 800 } as const;
export const GROUND_Y = 700;
export const SLAB_THICKNESS = 12;
export const BEAM_DEPTH = 14;

/** Top y of the ground slab, level 1, level 2, level 3 and the roof slab. */
export const SLAB_TOPS = [688, 568, 448, 328, 208] as const;

export const FRAME = { left: 340, right: 860, coreLeft: 760 } as const;
export const COLUMN_WIDTH = 16;
export const COLUMN_LEFTS = [340, 480, 620] as const;
export const BAYS = [
  { left: 356, right: 480 },
  { left: 496, right: 620 },
  { left: 636, right: 760 },
] as const;

const WINDOW_SIZE = { width: 72, height: 56 } as const;
export const PANE_INSET = 5;
export const STOREY_COUNT = 4;

/** Storey s runs between slab s (floor) and slab s + 1 (ceiling). */
export function storeyBounds(storey: number) {
  const floor = SLAB_TOPS[storey] as number;
  const ceiling = (SLAB_TOPS[storey + 1] as number) + SLAB_THICKNESS;
  return { floor, ceiling, height: floor - ceiling };
}

export function wallBounds(storey: number) {
  const { floor, ceiling } = storeyBounds(storey);
  const top = ceiling + BEAM_DEPTH;
  return { top, bottom: floor, height: floor - top };
}

export interface WindowRect {
  id: string;
  storey: number;
  bay: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Storeys 1-3 carry a window in every bay; the ground storey has two windows and the entrance. */
export const WINDOWS: readonly WindowRect[] = Array.from({ length: STOREY_COUNT }, (_, storey) =>
  BAYS.flatMap((bay, bayIndex) => {
    if (storey === 0 && bayIndex === 1) return [];
    const wall = wallBounds(storey);
    return [
      {
        id: `s${storey}b${bayIndex}`,
        storey,
        bay: bayIndex,
        x: (bay.left + bay.right) / 2 - WINDOW_SIZE.width / 2,
        y: wall.top + 16,
        width: WINDOW_SIZE.width,
        height: WINDOW_SIZE.height,
      },
    ];
  }),
).flat();

export const ENTRANCE = { x: 520, y: 612, width: 76, height: 76 } as const;
export const CANOPY = { x: 508, y: 600, width: 100, height: 8 } as const;
export const CORE_SLIT = { x: 790, y: 232, width: 40, height: 340 } as const;
export const NAME_PLATE = { x: 765, y: 622, width: 90, height: 28 } as const;
export const BUILDING_TOP = 182;

export const PIT = {
  topLeft: 280,
  topRight: 920,
  bottomLeft: 300,
  bottomRight: 900,
  depth: 72,
} as const;
export const FOOTINGS = [
  { x: 313, width: 70 },
  { x: 453, width: 70 },
  { x: 593, width: 70 },
  { x: 745, width: 130 },
] as const;
export const FOOTING = { top: 744, height: 28 } as const;
