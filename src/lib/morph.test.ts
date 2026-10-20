import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readMorph, startMorph } from './morph';

function setup(heroHeight: number, vh: number, y: number) {
  document.body.innerHTML = '<section id="hero"></section>';
  const hero = document.getElementById('hero') as HTMLElement;
  Object.defineProperty(hero, 'offsetHeight', { value: heroHeight, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: vh, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
}

describe('morph progress', () => {
  let stop: () => void = () => {};
  beforeEach(() => {
    stop = () => {};
  });
  afterEach(() => stop());

  it('is 0 until the About sheet starts to arrive and 1 when it reaches the top', () => {
    setup(900, 900, 0);
    stop = startMorph(false);
    expect(readMorph().m).toBe(0);
    Object.defineProperty(window, 'scrollY', { value: 450, configurable: true });
    expect(readMorph().m).toBeCloseTo(0.5, 6);
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    expect(readMorph()).toEqual({ m: 1, beyond: 0 });
    Object.defineProperty(window, 'scrollY', { value: 1100, configurable: true });
    expect(readMorph()).toEqual({ m: 1, beyond: 200 });
  });

  it('is a pure function of the scroll position (so it reverses exactly)', () => {
    setup(844, 844, 0);
    stop = startMorph(false);
    const at = (y: number) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
      return readMorph().m;
    };
    const down = [0, 100, 300, 600, 844].map(at);
    const up = [844, 600, 300, 100, 0].map(at).reverse();
    expect(up).toEqual(down);
  });

  it('publishes data-morph-progress and the stage variables on the root', () => {
    setup(800, 800, 400);
    stop = startMorph(false);
    const root = document.documentElement;
    expect(root.dataset.morphProgress).toBe('0.500');
    expect(root.style.getPropertyValue('--morph')).toBe('0.500');
    expect(Number(root.style.getPropertyValue('--morph-hero-text'))).toBeLessThan(1);
    expect(root.dataset.stageDark).toBe('true');
  });

  it('under reduced motion is a swap: 0 while the hero is in view, 1 once it has left', () => {
    setup(900, 900, 450);
    stop = startMorph(true);
    expect(readMorph().m).toBe(0);
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    expect(readMorph().m).toBe(1);
  });
});
