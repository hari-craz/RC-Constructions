import { useEffect, useRef, useState } from 'react';
import { useScroll } from '../../hooks/useScroll';
import {
  type CursorState,
  type CursorTone,
  resolveCursorState,
  resolveCursorTone,
} from '../../lib/cursor';
import { gsap } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './SurveyCursor.css';

export function SurveyCursor() {
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [isFinePointer, setIsFinePointer] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches;
  });
  const [state, setState] = useState<CursorState>('default');
  const [tone, setTone] = useState<CursorTone>('light');
  const { reducedMotion } = useScroll();

  // 1. Only mount on fine-pointer devices with hover capability (never on touch)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsFinePointer(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Hide the native cursor only while the custom survey marker is mounted
  useEffect(() => {
    if (!isFinePointer) return;
    document.documentElement.classList.add('has-survey-cursor');
    return () => document.documentElement.classList.remove('has-survey-cursor');
  }, [isFinePointer]);

  // 2. Track pointer with gsap.quickTo (transforms only, passive listener, zero rAF overhead)
  useEffect(() => {
    if (!isFinePointer || !markerRef.current) return;

    const el = markerRef.current;
    const quickX = gsap.quickTo(el, 'x', {
      duration: reducedMotion ? 0 : MOTION.cursor.quickToDuration,
      ease: MOTION.cursor.quickToEase,
    });
    const quickY = gsap.quickTo(el, 'y', {
      duration: reducedMotion ? 0 : MOTION.cursor.quickToDuration,
      ease: MOTION.cursor.quickToEase,
    });

    let isVisible = false;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isVisible) {
        isVisible = true;
        el.style.opacity = '1';
      }

      quickX(e.clientX);
      quickY(e.clientY);

      // Determine state and surface tone from target element
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const nextState = resolveCursorState(target);
      const nextTone = resolveCursorTone(target);

      setState(nextState);
      setTone(nextTone);
    };

    const handlePointerLeave = () => {
      isVisible = false;
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [isFinePointer, reducedMotion]);

  if (!isFinePointer) {
    return null;
  }

  const isHidden = state === 'hidden';

  return (
    <div
      ref={markerRef}
      className={`survey-cursor cursor-state-${state} cursor-tone-${tone} ${
        isHidden ? 'is-hidden' : ''
      }`}
      aria-hidden="true"
      data-testid="survey-cursor"
      data-cursor-state={state}
      data-cursor-tone={tone}
    >
      <div className="survey-cursor-inner">
        {/* Center 2px precision dot */}
        <span className="cursor-dot" />

        {/* Hairline crosshairs */}
        <span className="cursor-hairline-h" />
        <span className="cursor-hairline-v" />

        {/* 28px square bracket frame corners */}
        <span className="cursor-bracket cursor-bracket-tl" />
        <span className="cursor-bracket cursor-bracket-tr" />
        <span className="cursor-bracket cursor-bracket-bl" />
        <span className="cursor-bracket cursor-bracket-br" />

        {/* Project row contextual wordmark */}
        <span className="cursor-label">Open</span>
      </div>
    </div>
  );
}
