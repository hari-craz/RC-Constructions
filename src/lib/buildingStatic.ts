import {
  BEAM_DEPTH,
  BUILDING_TOP,
  CANOPY,
  COLUMN_LEFTS,
  COLUMN_WIDTH,
  CORE_SLIT,
  ENTRANCE,
  FRAME,
  GROUND_Y,
  NAME_PLATE,
  PANE_INSET,
  SLAB_THICKNESS,
  SLAB_TOPS,
  STOREY_COUNT,
  VIEWBOXES,
  WINDOWS,
  storeyBounds,
  wallBounds,
} from '../components/Building/geometry';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rect = (cls: string, x: number, y: number, w: number, h: number) =>
  `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

/**
 * The finished building (all stages complete, every window lit) as a standalone SVG string. It is
 * the no-JS fallback inlined at build time under the static house; styled by `.sb-*` in
 * StaticBuilding.css. It uses the same geometry as the scrolled drawing (`Building.tsx`).
 */
export function staticBuildingSvg(companyName: string): string {
  const vb = VIEWBOXES.desktop;
  const parts: string[] = [];
  // Soil below the ground line, drawn well past the view so it always runs edge to edge
  parts.push(rect('sb-soil', vb.x - 200, GROUND_Y, vb.width + 400, vb.height));
  // Walls and beams, storey by storey
  for (let s = 0; s < STOREY_COUNT; s++) {
    const w = wallBounds(s);
    const { ceiling } = storeyBounds(s);
    parts.push(rect('sb-wall', FRAME.left, w.top, FRAME.right - FRAME.left, w.height));
    parts.push(rect('sb-mass', FRAME.left, ceiling, FRAME.right - FRAME.left, BEAM_DEPTH));
  }
  // Stair core on the right, with its slit
  parts.push(
    rect(
      'sb-mass',
      FRAME.coreLeft,
      SLAB_TOPS[4] as number,
      FRAME.right - FRAME.coreLeft,
      GROUND_Y - (SLAB_TOPS[4] as number),
    ),
  );
  parts.push(rect('sb-open', CORE_SLIT.x, CORE_SLIT.y, CORE_SLIT.width, CORE_SLIT.height));
  // Slabs, and the parapet above the roof slab
  for (const top of SLAB_TOPS) {
    parts.push(rect('sb-mass', FRAME.left, top, FRAME.right - FRAME.left, SLAB_THICKNESS));
  }
  parts.push(
    rect(
      'sb-wall',
      FRAME.left,
      BUILDING_TOP,
      FRAME.right - FRAME.left,
      (SLAB_TOPS[4] as number) - BUILDING_TOP,
    ),
  );
  // Columns
  for (const left of COLUMN_LEFTS) {
    parts.push(rect('sb-mass', left, BUILDING_TOP, COLUMN_WIDTH, GROUND_Y - BUILDING_TOP));
  }
  // Windows: a dark opening with a lit pane and a cross of mullions
  for (const win of WINDOWS) {
    parts.push(rect('sb-open', win.x, win.y, win.width, win.height));
    parts.push(
      rect(
        'sb-lit',
        win.x + PANE_INSET,
        win.y + PANE_INSET,
        win.width - 2 * PANE_INSET,
        win.height - 2 * PANE_INSET,
      ),
    );
    const mx = win.x + win.width / 2;
    const my = win.y + win.height / 2;
    parts.push(
      `<path class="sb-line" d="M${mx} ${win.y + PANE_INSET}V${win.y + win.height - PANE_INSET}M${win.x + PANE_INSET} ${my}H${win.x + win.width - PANE_INSET}"/>`,
    );
  }
  // Entrance and canopy
  parts.push(rect('sb-open', ENTRANCE.x, ENTRANCE.y, ENTRANCE.width, ENTRANCE.height));
  parts.push(rect('sb-mass', CANOPY.x, CANOPY.y, CANOPY.width, CANOPY.height));
  // Name plate
  parts.push(rect('sb-plate', NAME_PLATE.x, NAME_PLATE.y, NAME_PLATE.width, NAME_PLATE.height));
  parts.push(
    `<text class="sb-plate-text" x="${NAME_PLATE.x + NAME_PLATE.width / 2}" y="${NAME_PLATE.y + NAME_PLATE.height / 2 + 5}" text-anchor="middle">${esc(companyName)}</text>`,
  );
  // Ground line over everything
  parts.push(`<path class="sb-ground" d="M${vb.x - 200} ${GROUND_Y}H${vb.x + vb.width + 200}"/>`);
  return `<svg class="sb-svg" viewBox="${vb.x} ${vb.y} ${vb.width} ${vb.height}" role="img" aria-label="The finished building, four storeys, with its windows lit" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}
