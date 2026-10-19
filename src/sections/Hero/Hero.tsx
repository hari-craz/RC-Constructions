import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import '../../components/HeroModel/HeroModel.css';
import { Sheet } from '../../components/SheetStack';
import { SITE } from '../../content/site';
import { useScroll } from '../../hooks/useScroll';
import './Hero.css';

// The 3D house is its own chunk. It is requested only after first paint and an idle moment, so
// the headline (the LCP element) and the first paint never wait on it.
const HeroModel = lazy(() => import('../../components/HeroModel/HeroModel'));

function afterFirstPaintAndIdle(run: () => void): () => void {
  let cancelled = false;
  let idleHandle = 0;
  let timer = 0;
  const frame = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const go = () => {
        if (!cancelled) run();
      };
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(go, { timeout: 1500 });
      } else {
        timer = window.setTimeout(go, 200);
      }
    });
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    if (idleHandle && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleHandle);
    }
    window.clearTimeout(timer);
  };
}

export function Hero() {
  const { reducedMotion } = useScroll();
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => afterFirstPaintAndIdle(() => setModelReady(true)), []);

  return (
    <Sheet id="hero" tone="concrete">
      <div className="hero-sheet-inner">
        <div className="hero-model">
          {modelReady && (
            <Suspense fallback={null}>
              <HeroModel reducedMotion={reducedMotion} />
            </Suspense>
          )}
        </div>

        <div className="hero-content">
          <div className="hero-text-block">
            <h1 id="hero-heading" className="hero-headline" aria-label="RC Constructions">
              <span className="hero-headline-line-mask">
                <span className="hero-headline-line">RC</span>
              </span>{' '}
              <span className="hero-headline-line-mask">
                <span className="hero-headline-line">Constructions</span>
              </span>
            </h1>

            <p className="hero-tagline">{SITE.tagline}</p>

            <div className="hero-cta-group">
              <Button href={SITE.cta.href}>{SITE.cta.label}</Button>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
