import { useRef } from 'react';
import { Button } from '../../components/Button';
import { HeroPlot, type HeroPlotHandle } from '../../components/HeroPlot';
import { Sheet } from '../../components/SheetStack';
import { SITE } from '../../content/site';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './Hero.css';

export function Hero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<HeroPlotHandle | null>(null);
  const { reducedMotion } = useScroll();

  // The load sequence (plot drawing and headline rise) is pure CSS and plays from first paint.
  // Only the scroll-linked layer below needs the motion chunk.
  useGSAP(
    () => {
      const plot = plotRef.current;
      if (reducedMotion || !plot) return;

      const aboutTrigger = document.getElementById('foundation');
      if (!aboutTrigger) return;

      const scrub = {
        trigger: aboutTrigger,
        start: MOTION.hero.scrollLinked.start,
        end: MOTION.hero.scrollLinked.end,
        scrub: true,
      };

      if (plot.footprintPath) {
        const limewash =
          getComputedStyle(document.documentElement).getPropertyValue('--color-limewash').trim() ||
          'var(--color-limewash)';
        gsap.to(plot.footprintPath, { fill: limewash, scrollTrigger: scrub });
      }

      if (plot.gridGroup) {
        gsap.to(plot.gridGroup.querySelectorAll('.hero-grid-cross'), {
          scale: MOTION.hero.scrollLinked.gridScaleMax,
          transformOrigin: 'center center',
          scrollTrigger: scrub,
        });
      }
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <Sheet id="hero" tone="concrete">
      <div ref={containerRef} className="hero-sheet-inner">
        <HeroPlot ref={plotRef} />

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
