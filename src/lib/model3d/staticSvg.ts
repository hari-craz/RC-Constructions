import {
  buildFrame,
  DEFAULT_POSE,
  REST_INV_DISTANCE,
  restOptions,
  VIEW,
  type Frame,
  type Pose,
} from './render';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Inner markup (ground, faces, dimensions) for a frame; classes are styled in HeroModel.css. */
function frameMarkup(frame: Frame): string {
  const faces = frame.faces.map((f) => `<path class="hm-face hm-${f.kind}" d="${f.d}"/>`).join('');
  const dims = frame.dimensions
    .map(
      (d) =>
        `<path class="hm-dim" d="${d.d}"/><g class="hm-dim-label" transform="translate(${d.lx.toFixed(1)} ${d.ly.toFixed(1)})"><rect x="-40" y="-13" width="80" height="26" rx="2"/><text y="5" text-anchor="middle">${esc(d.label)}</text></g>`,
    )
    .join('');
  return `<path class="hm-ground" d="${frame.ground}"/>${faces}${dims}`;
}

/**
 * The house at rest as a standalone SVG string: the no-JS fallback inlined at build time, and the
 * same markup the interactive model starts from.
 */
export function staticHouseSvg(pose: Pose = DEFAULT_POSE, invDistance = REST_INV_DISTANCE): string {
  const frame = buildFrame(pose, restOptions(invDistance));
  return `<svg class="hm-svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-label="A two-storey house drawn as a 3D line model" xmlns="http://www.w3.org/2000/svg">${frameMarkup(frame)}</svg>`;
}
