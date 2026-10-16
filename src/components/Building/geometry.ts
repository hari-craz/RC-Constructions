/**
 * Building elevation geometry (viewBox units). One source of truth for the SVG and its tests.
 * Ground line at y = 620; four storeys on a four-bay frame with a stair core on the right.
 * The frame is 800 units wide, so the building fills about 78% of the window on desktop
 * (viewBox 1020 wide) and about 80% of the band on phones (viewBox 1000 wide).
 */
export const VIEWBOXES = {
  desktop: { x: 60, y: -20, width: 1020, height: 820 },
  mobile: { x: 50, y: 60, width: 1000, height: 700 },
} as const;
export const GROUND_Y = 620;
export const SLAB_THICKNESS = 12;
export const BEAM_DEPTH = 14;

/** Top y of the ground slab, level 1, level 2, level 3 and the roof slab. */
export const SLAB_TOPS = [608, 480, 352, 224, 96] as const;

export const FRAME = { left: 160, right: 960, coreLeft: 860 } as const;
export const COLUMN_WIDTH = 16;
export const COLUMN_LEFTS = [160, 335, 510, 685] as const;
export const BAYS = [
  { left: 176, right: 335 },
  { left: 351, right: 510 },
  { left: 526, right: 685 },
  { left: 701, right: 860 },
] as const;

const WINDOW_SIZE = { width: 96, height: 62 } as const;
export const PANE_INSET = 5;
export const STOREY_COUNT = 4;
/** The bay that carries the entrance on the ground storey. */
const ENTRANCE_BAY = 2;

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

interface WindowRect {
  id: string;
  storey: number;
  bay: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Every bay carries a window on the upper storeys; the ground storey swaps one bay for the entrance. */
export const WINDOWS: readonly WindowRect[] = Array.from({ length: STOREY_COUNT }, (_, storey) =>
  BAYS.flatMap((bay, bayIndex) => {
    if (storey === 0 && bayIndex === ENTRANCE_BAY) return [];
    const wall = wallBounds(storey);
    return [
      {
        id: `s${storey}b${bayIndex}`,
        storey,
        bay: bayIndex,
        x: (bay.left + bay.right) / 2 - WINDOW_SIZE.width / 2,
        y: wall.top + 18,
        width: WINDOW_SIZE.width,
        height: WINDOW_SIZE.height,
      },
    ];
  }),
).flat();

export const ENTRANCE = { x: 557, y: 524, width: 96, height: 84 } as const;
export const CANOPY = { x: 543, y: 510, width: 124, height: 8 } as const;
export const CORE_SLIT = { x: 890, y: 122, width: 40, height: 350 } as const;
export const NAME_PLATE = { x: 864, y: 540, width: 92, height: 28 } as const;
export const BUILDING_TOP = 70;

/** Stepped excavation: sloped sides with a bench halfway down. */
export const PIT_POINTS = [
  [120, 620],
  [128, 695],
  [142, 695],
  [148, 770],
  [972, 770],
  [978, 695],
  [992, 695],
  [1000, 620],
] as const;
export const PIT_BOTTOM = 770;
export const FOOTINGS = [
  { x: 150, width: 76 },
  { x: 305, width: 76 },
  { x: 480, width: 76 },
  { x: 655, width: 76 },
  { x: 840, width: 130 },
] as const;
export const FOOTING = { top: 742, height: 28 } as const;
export const TIE_BEAM = { y: 662, height: 16 } as const;

/** Site set-out: batter-board pegs either side of the pit and a level staff with marks. */
export const PEGS = [
  { x: 100, height: 74 },
  { x: 1020, height: 74 },
] as const;
/** The profile string runs between the pegs at this height above the ground line. */
export const STRING_HEIGHT = 58;
export const DATUM_STAFF = { x: 68, height: 325, tickGap: 25 } as const;
/** Starter bars rise from each pedestal stub into the first storey. */
export const STARTER_HEIGHT = 240;
