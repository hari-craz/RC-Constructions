import Lenis from 'lenis';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { MOTION } from '../lib/motion';
import { ScrollContext, type ScrollContextValue, type ScrollToOptions } from './ScrollContext';

export interface ScrollProviderProps {
  children: ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const [activeSection, setActiveSection] = useState<string>('');

  const subscribe = useCallback((onStoreChange: () => void) => {
    listenersRef.current.add(onStoreChange);
    return () => {
      listenersRef.current.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => lenisRef.current, []);
  const getServerSnapshot = useCallback(() => null, []);

  const lenisInstance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updatePageProgress = useCallback(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    doc.style.setProperty('--page-progress', progress.toFixed(4));
  }, []);

  const scrollTo = useCallback(
    (target: string | HTMLElement, options?: ScrollToOptions) => {
      const lenis = lenisRef.current;
      if (typeof target === 'string' && target.startsWith('#')) {
        const id = target.slice(1);
        const element = document.getElementById(id);
        if (!element) return;
        target = element;
      }

      if (lenis && !reducedMotion) {
        lenis.scrollTo(target, {
          offset: options?.offset ?? 0,
          immediate: options?.immediate ?? false,
          duration: options?.duration ?? MOTION.scroll.duration,
        });
      } else {
        if (typeof target === 'string') {
          const el = document.querySelector(target);
          if (el) {
            el.scrollIntoView({ behavior: 'auto' });
          }
        } else if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'auto' });
        }
      }
    },
    [reducedMotion],
  );

  useEffect(() => {
    let rAFPending = false;
    const throttledProgress = () => {
      if (rAFPending) return;
      rAFPending = true;
      requestAnimationFrame(() => {
        rAFPending = false;
        updatePageProgress();
      });
    };

    if (reducedMotion) {
      window.addEventListener('scroll', throttledProgress, { passive: true });
      return () => {
        window.removeEventListener('scroll', throttledProgress);
      };
    }

    const listeners = listenersRef.current;

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      duration: MOTION.scroll.duration,
    });
    lenisRef.current = lenis;
    listeners.forEach((listener) => listener());
    if (typeof window !== 'undefined') {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    gsap.ticker.lagSmoothing(MOTION.scroll.lagSmoothing);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);

    const onLenisScroll = () => {
      ScrollTrigger.update();
      throttledProgress();
    };

    lenis.on('scroll', onLenisScroll);

    // Initial calculation
    throttledProgress();

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
      lenis.destroy();
      lenisRef.current = null;
      listeners.forEach((listener) => listener());
      gsap.ticker.remove(onTick);
    };
  }, [reducedMotion, updatePageProgress]);

  // Refresh ScrollTrigger after font loading and on debounced resize
  useEffect(() => {
    if (reducedMotion) return;

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, MOTION.scroll.resizeDebounceMs);
    };

    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [reducedMotion]);

  // Section spy and initial hash handling
  useEffect(() => {
    const handleInitialHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.slice(1);
        const element = document.getElementById(id);
        if (element) {
          setActiveSection(id);
          scrollTo(element, { immediate: true });
        }
      }
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(handleInitialHash);
    } else {
      handleInitialHash();
    }

    // Section spy observing sections crossing the viewport middle
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveSection(id);
            if (window.location.hash !== `#${id}`) {
              history.replaceState(null, '', `#${id}`);
            }
          }
        }
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));

    return () => {
      observer.disconnect();
    };
  }, [scrollTo]);

  const value = useMemo<ScrollContextValue>(
    () => ({
      lenis: lenisInstance,
      reducedMotion,
      scrollTo,
      activeSection,
    }),
    [lenisInstance, reducedMotion, scrollTo, activeSection],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
