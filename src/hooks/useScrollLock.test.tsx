import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollContext, type ScrollContextValue } from '../app/ScrollContext';
import { getScrollLockCount, resetScrollLockCount, useScrollLock } from './useScrollLock';

describe('useScrollLock', () => {
  beforeEach(() => {
    resetScrollLockCount();
  });

  it('correctly increments and decrements ref count on nested locks', () => {
    const mockStop = vi.fn();
    const mockStart = vi.fn();

    const mockContext: ScrollContextValue = {
      lenis: {
        stop: mockStop,
        start: mockStart,
      } as unknown as ScrollContextValue['lenis'],
      reducedMotion: false,
      scrollTo: vi.fn(),
      activeSection: '',
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScrollContext.Provider value={mockContext}>{children}</ScrollContext.Provider>
    );

    expect(getScrollLockCount()).toBe(0);

    const hook1 = renderHook(() => useScrollLock(true), { wrapper });
    expect(getScrollLockCount()).toBe(1);
    expect(mockStop).toHaveBeenCalledTimes(1);

    const hook2 = renderHook(() => useScrollLock(true), { wrapper });
    expect(getScrollLockCount()).toBe(2);
    // Should NOT call stop again when already locked
    expect(mockStop).toHaveBeenCalledTimes(1);

    hook1.unmount();
    expect(getScrollLockCount()).toBe(1);
    // Should NOT call start until all locks release
    expect(mockStart).not.toHaveBeenCalled();

    hook2.unmount();
    expect(getScrollLockCount()).toBe(0);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
