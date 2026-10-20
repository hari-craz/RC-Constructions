import { FRAME, GROUND_Y, VIEWBOXES } from '../components/Building/geometry';
import { MOTION } from './motion';

/**
 * Where the building's ground line and footprint are on screen when the foundation begins (the
 * site camera at its first frame), in viewport pixels. The hero house lands exactly here, so the
 * plinth it leaves behind sits where the foundation is drawn.
 *
 * Desktop: the site window is grid columns 6 to 12 (7/12 of the width), full height. Below
 * 1024 px: the fixed layer fills the screen. The drawing is centred across; on desktop it is bottom
 * aligned ("xMidYMax meet") and below 1024 px centred in the screen ("xMidYMid meet"), exactly as
 * Building.tsx sets it.
 */
export interface SiteTarget {
  groundY: number;
  x0: number;
  x1: number;
}

export function siteTarget(vw: number, vh: number, narrow: boolean): SiteTarget {
  const view = narrow ? VIEWBOXES.mobile : VIEWBOXES.desktop;
  const win = narrow
    ? { left: 0, width: vw, height: vh }
    : { left: (vw * 5) / 12, width: (vw * 7) / 12, height: vh };
  const sc = Math.min(win.width / view.width, win.height / view.height);
  const offX = win.left + (win.width - view.width * sc) / 2;
  const sx = (x: number) => offX + (x - view.x) * sc;
  const offY = narrow ? (win.height - view.height * sc) / 2 : win.height - view.height * sc;
  const sy = (y: number) => offY + (y - view.y) * sc;

  // The site camera at k = 1 (see applyCamera in Building.tsx)
  const B = MOTION.building;
  const lift = narrow ? B.siteCameraLiftPhone : B.siteCameraLiftDesktop;
  const k = B.siteCameraScale;
  const originX = view.x + view.width / 2;
  const camX = (x: number) => originX + (x - originX) * k;
  const camY = (y: number) => GROUND_Y + (y - GROUND_Y) * k - lift;

  return {
    groundY: sy(camY(GROUND_Y)),
    x0: sx(camX(FRAME.left)),
    x1: sx(camX(FRAME.right)),
  };
}
