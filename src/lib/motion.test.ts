import { describe, expect, it } from 'vitest';
import { MOTION } from './motion';

describe('motion constants', () => {
  it('defines sane sheet-stack values matching architectural specifications', () => {
    expect(MOTION.sheetStack.radiusSheetPx).toBe(32);
    expect(MOTION.sheetStack.radiusSquarePx).toBe(0);
    expect(MOTION.sheetStack.dimOverlayOpacity).toBe(0.1);
    expect(MOTION.sheetStack.ease).toBe('power2.out');
  });

  it('defines sane scroll parameters', () => {
    expect(MOTION.scroll.duration).toBeGreaterThan(0);
    expect(MOTION.scroll.lagSmoothing).toBe(0);
    expect(MOTION.scroll.resizeDebounceMs).toBeGreaterThan(0);
  });

  it('defines the hero headline timings within 2.6s', () => {
    expect(MOTION.hero.totalDuration).toBe(2.6);
    expect(MOTION.hero.headlineStart).toBe(0.5);
    expect(MOTION.hero.headlineDuration).toBe(0.9);
  });

  it('defines building elevation motion constants with non-zero durations', () => {
    expect(MOTION.building.digDuration).toBeGreaterThan(0);
    expect(MOTION.building.levelDuration).toBeGreaterThan(0);
    expect(MOTION.building.memberDuration).toBeGreaterThan(0);
    expect(MOTION.building.wallDuration).toBeGreaterThan(0);
    expect(MOTION.building.windowLitStagger).toBeGreaterThan(0);
  });

  it('defines stats and founder motion tokens with positive durations', () => {
    expect(MOTION.stats.countDuration).toBeGreaterThan(0);
    expect(MOTION.founder.revealDuration).toBeGreaterThan(0);
  });
});
