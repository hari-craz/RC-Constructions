import { useEffect, useRef } from 'react';
import { useScroll } from '../../hooks/useScroll';
import { hasSeenIntro, markIntroSeen } from '../../lib/sessionStorage';
import './LoadingLine.css';

export interface LoadingLineProps {
  onComplete?: () => void;
}

/**
 * Hairline dimension line drawn along the viewport bottom while the page loads. It is pure CSS
 * (no animation library), so it never waits on the motion chunk; it retracts within 1.2 s.
 */
export function LoadingLine({ onComplete }: LoadingLineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();

  const isSkipped = reducedMotion || hasSeenIntro();

  useEffect(() => {
    if (isSkipped) {
      onComplete?.();
    } else {
      markIntroSeen();
    }
  }, [isSkipped, onComplete]);

  if (isSkipped) {
    return null;
  }

  const handleDone = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;
    markIntroSeen();
    onComplete?.();
    if (containerRef.current) containerRef.current.style.display = 'none';
  };

  return (
    <div
      ref={containerRef}
      className="loading-dimension-line"
      aria-hidden="true"
      data-testid="loading-dimension-line"
      onAnimationEnd={handleDone}
    >
      <div className="loading-line-track">
        <div className="loading-line-start-tick" />
        <div className="loading-line-bar" />
        <div className="loading-line-end-tick" />
      </div>
    </div>
  );
}
