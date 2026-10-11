import { describe, expect, it } from 'vitest';
import { MOTION } from './motion';

describe('motion constants', () => {
  it('defines sane sheet-stack values matching architectural specifications', () => {
    expect(MOTION.sheetStack.scaleMin).toBe(0.94);
    expect(MOTION.sheetStack.scaleMax).toBe(1);
    expect(MOTION.sheetStack.radiusSheetPx).toBe(32);
    expect(MOTION.sheetStack.radiusSquarePx).toBe(0);
    expect(MOTION.sheetStack.dimOverlayOpacity).toBe(0.4);
    expect(MOTION.sheetStack.transformOrigin).toBe('center top');
    expect(MOTION.sheetStack.ease).toBe('power2.out');
  });

  it('defines sane scroll parameters', () => {
    expect(MOTION.scroll.duration).toBeGreaterThan(0);
    expect(MOTION.scroll.lagSmoothing).toBe(0);
    expect(MOTION.scroll.resizeDebounceMs).toBeGreaterThan(0);
  });
});
