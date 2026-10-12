import { useEffect, useRef } from 'react';
import { useScroll } from '../../hooks/useScroll';
import { gsap } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import { hasSeenIntro, markIntroSeen } from '../../lib/sessionStorage';
import './LoadingLine.css';

export interface LoadingLineProps {
  onComplete?: () => void;
}

export function LoadingLine({ onComplete }: LoadingLineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const endTickRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();

  const isSkipped = reducedMotion || hasSeenIntro();

  useEffect(() => {
    if (isSkipped) {
      onComplete?.();
    }
  }, [isSkipped, onComplete]);

  useEffect(() => {
    if (isSkipped || !containerRef.current || !barRef.current) return;

    let isCleanedUp = false;
    markIntroSeen();

    // Timeline for dimension line draw & retract (max 1.2s duration)
    const tl = gsap.timeline({
      onComplete: () => {
        markIntroSeen();
        if (!isCleanedUp) {
          onComplete?.();
          if (containerRef.current) {
            containerRef.current.style.display = 'none';
          }
        }
      },
    });

    // 0.0s – 0.8s: Hairline draws across viewport bottom in amber
    tl.to(barRef.current, {
      scaleX: 1,
      duration: Math.min(MOTION.loading.maxDuration * 0.7, 0.8),
      ease: MOTION.loading.ease,
    });

    if (endTickRef.current) {
      tl.to(
        endTickRef.current,
        {
          opacity: 1,
          duration: 0.1,
        },
        0.8,
      );
    }

    // 0.8s – 1.2s: Retract / fade out and hand off to hero intro
    tl.to(
      containerRef.current,
      {
        opacity: 0,
        duration: MOTION.loading.retractDuration,
        ease: 'power2.inOut',
      },
      Math.min(MOTION.loading.maxDuration - MOTION.loading.retractDuration, 0.8),
    );

    // Font ready gate with hard timeout (max 1.0s)
    if (typeof document !== 'undefined' && 'fonts' in document) {
      const fontReadyPromise = document.fonts.ready;
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));

      Promise.race([fontReadyPromise, timeoutPromise]).then(() => {
        // If fonts ready sooner, allow timeline to naturally conclude
      });
    }

    return () => {
      isCleanedUp = true;
      tl.kill();
    };
  }, [isSkipped, onComplete]);

  if (isSkipped) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="loading-dimension-line"
      aria-hidden="true"
      data-testid="loading-dimension-line"
    >
      <div className="loading-line-track">
        <div className="loading-line-start-tick" />
        <div ref={barRef} className="loading-line-bar" />
        <div ref={endTickRef} className="loading-line-end-tick" />
      </div>
    </div>
  );
}
