import { useEffect } from 'react';
import { useScroll } from '../../hooks/useScroll';
import { startMorph } from '../../lib/morph';
import './StageLayer.css';

/**
 * The fixed layers behind (and over) the page: the flat backdrop that turns from the hero's concrete
 * to the site's formwork, and the svg that carries the hero house once it leaves the hero. It also
 * starts the morph clock, which follows the scroll and publishes `data-morph-progress`.
 *
 * Both are decorative: no pointer events, hidden from assistive technology. Below 1024 px they sit
 * under the sheets (the building layer is between them); on desktop only the house svg is used, above
 * the site window.
 */
export function StageLayer() {
  const { reducedMotion } = useScroll();
  useEffect(() => startMorph(reducedMotion), [reducedMotion]);

  return (
    <>
      <div className="stage-backdrop" aria-hidden="true" />
      <svg className="hm-svg stage-house" aria-hidden="true" focusable="false" />
    </>
  );
}
