import { MOTION } from './motion';

/**
 * The morph: how far the hero has handed over to the building. It is a pure function of the scroll
 * position, so it reverses exactly and an anchor jump lands in the right state.
 *
 *   m = 0   the hero house stands in the hero (the About sheet has not begun to arrive)
 *   m = 1   the About sheet has reached the top; the house is gone and the foundation begins
 *
 * `beyond` is how many pixels the page has scrolled past that point.
 */
export interface MorphState {
  m: number;
  beyond: number;
}

type Listener = (state: MorphState) => void;

const listeners = new Set<Listener>();
let current: MorphState = { m: 0, beyond: 0 };
let reduced = false;
let frame = 0;
let started = 0;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));

export function readMorph(): MorphState {
  const hero = document.getElementById('hero');
  const vh = window.innerHeight || 1;
  const heroHeight = hero ? hero.offsetHeight : vh;
  const y = window.scrollY;
  if (reduced) return { m: y >= heroHeight ? 1 : 0, beyond: Math.max(0, y - heroHeight) };
  return { m: clamp01((y - (heroHeight - vh)) / vh), beyond: Math.max(0, y - heroHeight) };
}

function publish() {
  frame = 0;
  current = readMorph();
  const root = document.documentElement;
  const M = MOTION.morph;
  root.dataset.morphProgress = current.m.toFixed(3);
  root.style.setProperty('--morph', current.m.toFixed(3));
  // The stage backdrop turns from the hero's concrete to the site's formwork, and the hero text
  // fades before it does, so no text ever sits on a mid-grey it cannot read against
  root.style.setProperty(
    '--morph-backdrop',
    ramp(current.m, M.backdropStart, M.backdropEnd).toFixed(3),
  );
  root.style.setProperty(
    '--morph-hero-text',
    (1 - ramp(current.m, M.heroTextFadeStart, M.heroTextFadeEnd)).toFixed(3),
  );
  root.dataset.stageDark = current.m >= M.backdropEnd ? 'true' : 'false';
  listeners.forEach((fn) => fn(current));
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(publish);
}

export function onMorph(fn: Listener): () => void {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

/** Start following the scroll (once; a repeat call only updates the reduced-motion setting). */
export function startMorph(reducedMotion: boolean): () => void {
  reduced = reducedMotion;
  if (started++ === 0) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  publish();
  return () => {
    if (--started === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** Shares of the morph (0 to 1) at which a window of it begins and ends, eased in and out. */
export function morphRamp(m: number, from: number, to: number): number {
  const t = ramp(m, from, to);
  return t * t * (3 - 2 * t);
}
