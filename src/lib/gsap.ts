import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type RefObject } from 'react';
import { MOTION } from './motion';

/**
 * GSAP and ScrollTrigger live in their own chunk that loads after first paint.
 * `gsap` and `ScrollTrigger` below are thin forwards to the loaded modules; they must only be
 * used inside `useGSAP` callbacks or after `loadMotion()` has resolved.
 */
type Core = typeof import('./gsapCore');

let core: Core | null = null;
let pending: Promise<Core> | null = null;

export function loadMotion(): Promise<Core> {
  pending ??= import('./gsapCore').then((m) => {
    core = m;
    return m;
  });
  return pending;
}

function forward<T extends object>(pick: (c: Core) => T): T {
  return new Proxy({} as T, {
    get(_, key) {
      if (!core) throw new Error('Motion runtime is not loaded yet');
      const target = pick(core) as Record<PropertyKey, unknown>;
      const value = target[key];
      return typeof value === 'function'
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}

let gate: Promise<void> | null = null;

/**
 * Scroll-driven motion is not needed until the visitor interacts. This resolves on the first
 * input (pointer, wheel, touch, key, scroll), immediately when the URL carries an anchor, or
 * after a long idle period, so the first paint is never competing with animation setup.
 */
export function motionGate(): Promise<void> {
  gate ??= new Promise<void>((resolve) => {
    if (import.meta.env.MODE === 'test' || window.location.hash) {
      resolve();
      return;
    }
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'];
    const timer = setTimeout(() => open(), MOTION.motionGate.idleMs);
    function open() {
      events.forEach((name) => window.removeEventListener(name, open));
      clearTimeout(timer);
      resolve();
    }
    events.forEach((name) => window.addEventListener(name, open, { passive: true }));
  });
  return gate;
}

let tail: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` in its own macrotask, queued behind earlier calls, so that setting up many scroll
 * timelines after the first input never blocks the main thread in one long task.
 */
export function inOwnTask<T>(fn: () => T): Promise<T> {
  const run = tail.then(() => new Promise<T>((resolve) => setTimeout(() => resolve(fn()), 0)));
  tail = run.catch(() => undefined);
  return run;
}

export const gsap = forward((c) => c.gsap) as typeof gsapType;
export const ScrollTrigger = forward((c) => c.ScrollTrigger) as typeof ScrollTriggerType;

type GsapContext = ReturnType<typeof gsapType.context>;

interface UseGSAPOptions {
  scope?: RefObject<Element | null>;
  dependencies?: readonly unknown[];
}

/**
 * Runs `callback` inside a gsap context once the motion chunk has loaded, and reverts the
 * context (plus any cleanup the callback returns) when dependencies change or on unmount.
 */
export function useGSAP(callback: (context: GsapContext) => unknown, options: UseGSAPOptions = {}) {
  const { scope, dependencies = [] } = options;
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  const key = JSON.stringify(dependencies.map((d) => String(d)));

  useEffect(() => {
    let dead = false;
    let cleanup: (() => void) | undefined;
    let ctx: { revert: () => void } | undefined;
    void motionGate()
      .then(loadMotion)
      .then((m) =>
        inOwnTask(() => {
          if (dead) return;
          ctx = m.gsap.context((self) => {
            const result = callbackRef.current(self);
            if (typeof result === 'function') cleanup = result as () => void;
          }, scope?.current ?? undefined);
        }),
      );
    return () => {
      dead = true;
      cleanup?.();
      ctx?.revert();
    };
  }, [key, scope]);
}
