import { useCallback, useEffect, useRef, useState } from 'react';
import { VIEW } from '../../lib/model3d/render';
import { MOTION } from '../../lib/motion';
import { ModelController, type Axis } from './controller';
import './HeroModelControls.css';

export interface HeroModelProps {
  reducedMotion: boolean;
}

interface StepButton {
  label: string;
  axis: Axis;
  direction: 1 | -1;
}

const STEP_BUTTONS: readonly StepButton[] = [
  { label: 'Turn left', axis: 'turn', direction: -1 },
  { label: 'Turn right', axis: 'turn', direction: 1 },
  { label: 'Tilt up', axis: 'tilt', direction: 1 },
  { label: 'Tilt down', axis: 'tilt', direction: -1 },
  { label: 'Roll left', axis: 'roll', direction: 1 },
  { label: 'Roll right', axis: 'roll', direction: -1 },
];

/**
 * The hero house: an interactive 3D model drawn with our own projection into one inline SVG.
 * It is its own lazy chunk, initialised after first paint and idle (see Hero.tsx).
 */
export default function HeroModel({ reducedMotion }: HeroModelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const facesRef = useRef<SVGGElement | null>(null);
  const groundRef = useRef<SVGPathElement | null>(null);
  const dimsRef = useRef<SVGGElement | null>(null);
  const gizmoRef = useRef<SVGGElement | null>(null);
  const controller = useRef<ModelController | null>(null);
  const [hint, setHint] = useState(true);
  const [autoOn, setAutoOn] = useState(true);

  // The hint goes away for good on the first interaction (or after a few seconds)
  const dismissHint = useCallback(() => setHint(false), []);

  useEffect(() => {
    const timer = window.setTimeout(dismissHint, MOTION.model3d.hintMs);
    return () => window.clearTimeout(timer);
  }, [dismissHint]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const faces = facesRef.current;
    const ground = groundRef.current;
    const dims = dimsRef.current;
    const gizmo = gizmoRef.current;
    if (!root || !stage || !faces || !ground || !dims || !gizmo) return;
    const instance = new ModelController(
      {
        root,
        stage,
        faces,
        ground,
        dims,
        gizmo,
        handoffTarget: () => document.getElementById('foundation'),
      },
      { reducedMotion, onInteract: dismissHint },
    );
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, [reducedMotion, dismissHint]);

  return (
    <div ref={rootRef} className="hero-model-widget" data-hero-model="">
      <div
        ref={stageRef}
        className="hero-model-stage"
        role="group"
        aria-label="3D house model, drag or use arrow keys to rotate"
        // The model is a custom control: focus lets keyboard users rotate it (arrows, Q, E, 0, Space)
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <svg
          className="hm-svg"
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          aria-hidden="true"
          focusable="false"
        >
          <path ref={groundRef} className="hm-ground" />
          <g ref={facesRef} />
          <g ref={dimsRef} />
        </svg>
        <svg
          className="hero-model-gizmo"
          viewBox="-50 -50 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <g ref={gizmoRef} />
        </svg>
      </div>

      {hint && <p className="hero-model-hint">Drag to turn the house</p>}

      <div className="hero-model-controls" role="group" aria-label="House view controls">
        {STEP_BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            className="hero-model-btn"
            onClick={() => controller.current?.step(b.axis, b.direction)}
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          className="hero-model-btn"
          onClick={() => controller.current?.reset()}
        >
          Reset view
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={autoOn}
          className="hero-model-btn hero-model-toggle"
          onClick={() => {
            const next = controller.current?.toggleAuto();
            if (next !== undefined) setAutoOn(next);
          }}
        >
          Auto-rotate
        </button>
      </div>
    </div>
  );
}
