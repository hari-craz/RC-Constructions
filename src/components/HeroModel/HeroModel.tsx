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

const TURN_LEFT: StepButton = { label: 'Turn left', axis: 'turn', direction: -1 };
const TURN_RIGHT: StepButton = { label: 'Turn right', axis: 'turn', direction: 1 };
const TILT_UP: StepButton = { label: 'Tilt up', axis: 'tilt', direction: 1 };
const TILT_DOWN: StepButton = { label: 'Tilt down', axis: 'tilt', direction: -1 };
const ROLL_LEFT: StepButton = { label: 'Roll left', axis: 'roll', direction: 1 };
const ROLL_RIGHT: StepButton = { label: 'Roll right', axis: 'roll', direction: -1 };

/** Wider screens: every step has its own button. */
const STEP_BUTTONS: readonly StepButton[] = [
  TURN_LEFT,
  TURN_RIGHT,
  TILT_UP,
  TILT_DOWN,
  ROLL_LEFT,
  ROLL_RIGHT,
];

/**
 * Phones: Turn, Tilt, Reset and Auto-rotate only. The short label is what is seen; the full name
 * (which contains it) is what a screen reader hears. The other directions and roll sit behind
 * "More"; roll is also a two-finger twist on the model.
 */
const PHONE_BUTTONS: readonly (StepButton & { short: string })[] = [
  { ...TURN_RIGHT, short: 'Turn' },
  { ...TILT_UP, short: 'Tilt' },
];
const PHONE_MORE: readonly StepButton[] = [TURN_LEFT, TILT_DOWN, ROLL_LEFT, ROLL_RIGHT];
const PHONE_QUERY = '(width <= 640px)';

function usePhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(PHONE_QUERY);
    const on = () => setPhone(mql.matches);
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, []);
  return phone;
}

/**
 * The hero house: an interactive 3D model drawn with our own projection into one inline SVG.
 * It is its own lazy chunk, initialised after first paint and idle (see Hero.tsx).
 */
export default function HeroModel({ reducedMotion }: HeroModelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const sceneRef = useRef<SVGGElement | null>(null);
  const facesRef = useRef<SVGGElement | null>(null);
  const groundRef = useRef<SVGPathElement | null>(null);
  const dimsRef = useRef<SVGGElement | null>(null);
  const gizmoRef = useRef<SVGGElement | null>(null);
  const controller = useRef<ModelController | null>(null);
  const [hint, setHint] = useState(true);
  const [autoOn, setAutoOn] = useState(true);
  const phone = usePhone();
  const [more, setMore] = useState(false);

  // The hint goes away for good on the first interaction (or after a few seconds)
  const dismissHint = useCallback(() => setHint(false), []);

  // A real signal that the model chunk has run (tests wait on it, not on a timeout)
  useEffect(() => {
    document.documentElement.dataset.heroModel = 'ready';
    performance.mark('hero-model-ready');
    return () => {
      delete document.documentElement.dataset.heroModel;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(dismissHint, MOTION.model3d.hintMs);
    return () => window.clearTimeout(timer);
  }, [dismissHint]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const svg = svgRef.current;
    const scene = sceneRef.current;
    const faces = facesRef.current;
    const ground = groundRef.current;
    const dims = dimsRef.current;
    const gizmo = gizmoRef.current;
    if (!root || !stage || !svg || !scene || !faces || !ground || !dims || !gizmo) return;
    const instance = new ModelController(
      {
        root,
        stage,
        heroSvg: svg,
        // The fixed full-screen layer (StageLayer) that carries the house once it leaves the hero
        layerSvg: document.querySelector<SVGSVGElement>('.stage-house'),
        scene,
        faces,
        ground,
        dims,
        gizmo,
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
          ref={svgRef}
          className="hm-svg"
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          aria-hidden="true"
          focusable="false"
        >
          <g ref={sceneRef}>
            <path ref={groundRef} className="hm-ground" />
            <g ref={facesRef} />
            {/* Dimensions are drawn over the house, so a label is never hidden behind a roof */}
            <g ref={dimsRef} />
          </g>
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

      <div
        className="hero-model-controls"
        role="group"
        aria-label="House view controls"
        data-phone={phone ? 'true' : undefined}
      >
        {phone
          ? PHONE_BUTTONS.map((b) => (
              <button
                key={b.label}
                type="button"
                className="hero-model-btn"
                aria-label={b.label}
                onClick={() => controller.current?.step(b.axis, b.direction)}
              >
                {b.short}
              </button>
            ))
          : STEP_BUTTONS.map((b) => (
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
          aria-label="Reset view"
          onClick={() => controller.current?.reset()}
        >
          {phone ? 'Reset' : 'Reset view'}
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
        {phone && (
          <button
            type="button"
            className="hero-model-btn hero-model-more"
            aria-expanded={more}
            aria-controls="hero-model-more"
            onClick={() => setMore((v) => !v)}
          >
            More
          </button>
        )}
        {phone && more && (
          <div id="hero-model-more" className="hero-model-extra" role="group" aria-label="More">
            {PHONE_MORE.map((b) => (
              <button
                key={b.label}
                type="button"
                className="hero-model-btn"
                onClick={() => controller.current?.step(b.axis, b.direction)}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
