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

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const lines = containerRef.current.querySelectorAll('.hero-headline-line');
      const plot = plotRef.current;

      if (reducedMotion) {
        // Immediate static layout for reduced motion
        gsap.set(lines, { yPercent: 0, opacity: 1 });
        if (plot?.svgElement) {
          const allStrokes = plot.svgElement.querySelectorAll<SVGPathElement>('path');
          allStrokes.forEach((p) => {
            gsap.set(p, { strokeDashoffset: 0 });
          });
          gsap.set(
            [plot.stakes, plot.gridGroup, ...plot.dimensionLines, ...plot.dimensionLabels].filter(
              Boolean,
            ),
            { opacity: 1, scale: 1 },
          );
        }
        return;
      }

      // Initial state preparation for load sequence
      gsap.set(lines, { yPercent: 100 });

      if (plot) {
        if (plot.boundaryPath) {
          gsap.set(plot.boundaryPath, { strokeDasharray: 1, strokeDashoffset: 1 });
        }
        if (plot.stakes) {
          gsap.set(plot.stakes, { opacity: 0, scale: 0.7, transformOrigin: 'center center' });
        }
        if (plot.setbackPath) {
          // Setback has dashed pattern, animate offset
          gsap.set(plot.setbackPath, { strokeDasharray: '6 6', opacity: 0 });
        }
        if (plot.footprintPath) {
          gsap.set(plot.footprintPath, { strokeDasharray: 1, strokeDashoffset: 1 });
        }
        if (plot.gridGroup) {
          const crosses = plot.gridGroup.querySelectorAll('.hero-grid-cross');
          gsap.set(crosses, { opacity: 0, scale: 0, transformOrigin: 'center center' });
        }
        if (plot.dimensionLines.length > 0) {
          gsap.set(plot.dimensionLines, { strokeDasharray: 1, strokeDashoffset: 1 });
        }
        if (plot.dimensionLabels.length > 0) {
          gsap.set(plot.dimensionLabels, {
            opacity: 0,
            scale: 0.8,
            transformOrigin: 'center center',
          });
        }
      }

      // 1. Orchestrated Load Timeline (played once)
      const tl = gsap.timeline({
        defaults: { ease: MOTION.hero.ease },
      });

      // 0.0s – 1.0s: Plot boundary draws & corner stakes appear
      if (plot?.boundaryPath) {
        tl.to(
          plot.boundaryPath,
          {
            strokeDashoffset: 0,
            duration: MOTION.hero.boundaryDuration,
          },
          MOTION.hero.boundaryStart,
        );
      }
      if (plot?.stakes) {
        tl.to(
          plot.stakes,
          {
            opacity: 1,
            scale: 1,
            duration: MOTION.hero.stakesDuration,
          },
          MOTION.hero.stakesStart,
        );
      }

      // from 0.5s: Headline reveals out of clipped mask
      tl.to(
        lines,
        {
          yPercent: 0,
          duration: MOTION.hero.headlineDuration,
          stagger: MOTION.hero.headlineStagger,
        },
        MOTION.hero.headlineStart,
      );

      // 0.6s – 1.4s: Setback lines draw
      if (plot?.setbackPath) {
        tl.to(
          plot.setbackPath,
          {
            opacity: 1,
            duration: MOTION.hero.setbackDuration,
          },
          MOTION.hero.setbackStart,
        );
      }

      // 1.0s – 1.8s: Building footprint draws
      if (plot?.footprintPath) {
        tl.to(
          plot.footprintPath,
          {
            strokeDashoffset: 0,
            duration: MOTION.hero.footprintDuration,
          },
          MOTION.hero.footprintStart,
        );
      }

      // 1.4s – 2.0s: Column grid crosses appear in quick stagger
      if (plot?.gridGroup) {
        const crosses = plot.gridGroup.querySelectorAll('.hero-grid-cross');
        tl.to(
          crosses,
          {
            opacity: 1,
            scale: 1,
            duration: MOTION.hero.gridDuration,
            stagger: MOTION.hero.gridStagger,
          },
          MOTION.hero.gridStart,
        );
      }

      // 1.8s – 2.6s: Dimension lines and values appear in amber
      if (plot?.dimensionLines && plot.dimensionLines.length > 0) {
        tl.to(
          plot.dimensionLines,
          {
            strokeDashoffset: 0,
            duration: MOTION.hero.dimensionsDuration,
          },
          MOTION.hero.dimensionsStart,
        );
      }
      if (plot?.dimensionLabels && plot.dimensionLabels.length > 0) {
        tl.to(
          plot.dimensionLabels,
          {
            opacity: 1,
            scale: 1,
            duration: MOTION.hero.dimensionLabelsDuration,
            stagger: MOTION.hero.dimensionLabelsStagger,
          },
          MOTION.hero.dimensionsStart + MOTION.hero.dimensionLabelsDelay,
        );
      }

      // Scroll Interrupt: if user scrolls before sequence completes, jump to end
      const handleScrollInterrupt = () => {
        if (tl.isActive()) {
          tl.progress(1);
        }
      };
      window.addEventListener('scroll', handleScrollInterrupt, { passive: true, once: true });

      // 2. Scroll-Linked Scrub Layer: Footprint fills with limewash and grid crosses grow
      const aboutTrigger = document.getElementById('about');
      if (aboutTrigger) {
        if (plot?.footprintPath) {
          const limewash =
            getComputedStyle(document.documentElement)
              .getPropertyValue('--color-limewash')
              .trim() || 'var(--color-limewash)';

          gsap.to(plot.footprintPath, {
            fill: limewash,
            scrollTrigger: {
              trigger: aboutTrigger,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          });
        }

        if (plot?.gridGroup) {
          const crosses = plot.gridGroup.querySelectorAll('.hero-grid-cross');
          gsap.to(crosses, {
            scale: MOTION.hero.scrollLinked.gridScaleMax,
            transformOrigin: 'center center',
            scrollTrigger: {
              trigger: aboutTrigger,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          });
        }
      }

      return () => {
        window.removeEventListener('scroll', handleScrollInterrupt);
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <Sheet
      id="hero"
      label="Section 01 — Site Survey & Excavation"
      tone="concrete"
      headingTag="span"
    >
      <div ref={containerRef} className="hero-sheet-inner">
        <HeroPlot ref={plotRef} />

        <div className="container hero-content">
          <div className="hero-text-block">
            <h1 className="hero-headline" aria-label="RC Constructions">
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
