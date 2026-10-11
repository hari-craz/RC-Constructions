import { useEffect } from 'react';
import { useScroll } from './useScroll';

let lockCount = 0;

export function getScrollLockCount(): number {
  return lockCount;
}

export function resetScrollLockCount(): void {
  lockCount = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
}

export function useScrollLock(locked: boolean = true): void {
  const { lenis } = useScroll();

  useEffect(() => {
    if (!locked) return;

    lockCount++;
    if (lockCount === 1) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        lenis?.start();
        document.body.style.overflow = '';
      }
    };
  }, [locked, lenis]);
}
