/*
 * The RC Constructions mark: a house outline with four rounded blocks inside it, two of them
 * carrying the letters R and C. It is redrawn as plain geometry from the company's own logo
 * (supplied 2026-10-25) so it can follow the page colours (Logo.tsx, one colour) and be drawn in the
 * company's blue and grey for the favicon and the social card (scripts/generate-favicons.mjs and
 * scripts/generate-og-image.mjs). Everything is in a 64 by 64 box.
 */
export const MARK = {
  viewBox: '0 0 64 64',
  /** The roof: a thick chevron (stroke, mitred corner). */
  roof: { d: 'M4.5 27.5L32 6L59.5 27.5', strokeWidth: 5 },
  chimney: { x: 43.5, y: 9, width: 4.5, height: 10 },
  /** The two wall posts and the base bar. */
  walls: [
    { x: 9, y: 30, width: 4.5, height: 29.5 },
    { x: 50.5, y: 30, width: 4.5, height: 29.5 },
    { x: 9, y: 55, width: 46, height: 4.5 },
  ],
  /** The four blocks (12 by 12): R and C are solid, the other two are outlines. */
  tileSize: 12,
  tiles: [
    { x: 18.5, y: 27, letter: 'R' },
    { x: 33.5, y: 27, letter: null },
    { x: 18.5, y: 42, letter: null },
    { x: 33.5, y: 42, letter: 'C' },
  ],
  letterStroke: 1.5,
} as const;

/** The company's own colours, read from its logo: grey for the house and two blocks, blue for R and C. */
export const BRAND = { outline: '#A7A9AC', fill: '#0B72AD', letter: '#FFFFFF' } as const;

/** The stroke path of a letter inside a block whose top-left corner is (x, y). */
export function letterPath(letter: 'R' | 'C', x: number, y: number): string {
  if (letter === 'R') {
    return `M${x + 3.6} ${y + 9.4}V${y + 2.6}H${x + 6.6}a2.1 2.1 0 0 1 0 4.2H${x + 3.6}M${x + 6.3} ${y + 6.9}L${x + 8.6} ${y + 9.4}`;
  }
  return `M${x + 8.5} ${y + 3.6}A3.5 3.5 0 1 0 ${x + 8.5} ${y + 8.4}`;
}

/**
 * The mark as an SVG string with the company's own colours, for the favicon and the social card
 * (build scripts only). `outline` is the house and the grey blocks; `fill` is the R and C blocks.
 */
export function markSvg(colours: { outline: string; fill: string; letter: string }): string {
  const { roof, chimney, walls, tiles, tileSize, letterStroke } = MARK;
  const rect = (r: { x: number; y: number; width: number; height: number }) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${colours.outline}"/>`;
  const blocks = tiles
    .map((t) => {
      const solid = t.letter !== null;
      const box = `<rect x="${t.x}" y="${t.y}" width="${tileSize}" height="${tileSize}" rx="2.6" fill="${solid ? colours.fill : colours.outline}"/>`;
      const glyph = t.letter
        ? `<path d="${letterPath(t.letter, t.x, t.y)}" fill="none" stroke="${colours.letter}" stroke-width="${letterStroke}" stroke-linecap="round" stroke-linejoin="round"/>`
        : '';
      return box + glyph;
    })
    .join('');
  return (
    `<path d="${roof.d}" fill="none" stroke="${colours.outline}" stroke-width="${roof.strokeWidth}"/>` +
    rect(chimney) +
    walls.map(rect).join('') +
    blocks
  );
}
