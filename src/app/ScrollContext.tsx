import type Lenis from 'lenis';
import { createContext, useContext } from 'react';

export interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
}

export interface ScrollContextValue {
  lenis: Lenis | null;
  reducedMotion: boolean;
  scrollTo: (target: string | HTMLElement, options?: ScrollToOptions) => void;
  activeSection: string;
}

export const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScroll(): ScrollContextValue {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
}
