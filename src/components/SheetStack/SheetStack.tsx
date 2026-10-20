import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './SheetStack.css';

const NARROW_QUERY = '(width < 1024px)';

export interface SheetStackProps {
  children: ReactNode;
  className?: string;
}

export function SheetStack({ children, className = '' }: SheetStackProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();
  // Below 1024 px the sheets are plain blocks over the fixed building layer: no pinning or slide-over
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useGSAP(
    () => {
      if (reducedMotion || narrow || !containerRef.current) return;

      const sheets = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(':scope > .sheet'),
      );
      if (sheets.length <= 1) return;

      // Calculate sticky top for tall sheets
      const updateStickyTops = () => {
        const vh = window.innerHeight;
        sheets.forEach((sheet, index) => {
          if (index === sheets.length - 1) {
            sheet.style.position = 'relative';
            sheet.style.top = 'auto';
            return;
          }
          const height = sheet.offsetHeight;
          // Tall sheets pin their bottom edge to the viewport bottom so their last line stays
          // reachable; the next sheet then slides over padding, never over content.
          const tall = height > vh;
          sheet.style.top = tall ? `${vh - height}px` : '0px';
        });
      };

      updateStickyTops();

      const resizeObserver = new ResizeObserver(() => {
        updateStickyTops();
      });
      sheets.forEach((sheet) => resizeObserver.observe(sheet));

      // Build sheet-stack scrubbed transitions
      sheets.forEach((currentSheet, i) => {
        if (i === sheets.length - 1) return;
        const nextSheet = sheets[i + 1];
        if (!nextSheet) return;

        const dimOverlay = currentSheet.querySelector<HTMLElement>('.sheet-dim-overlay');

        // Initial state for incoming sheet top corners
        gsap.set(nextSheet, {
          borderTopLeftRadius: MOTION.sheetStack.radiusSheetPx,
          borderTopRightRadius: MOTION.sheetStack.radiusSheetPx,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: nextSheet,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              const active = self.isActive;
              nextSheet.style.willChange = active ? 'border-radius' : 'auto';
            },
          },
        });

        if (dimOverlay) {
          tl.to(
            dimOverlay,
            {
              opacity: MOTION.sheetStack.dimOverlayOpacity,
              ease: MOTION.sheetStack.ease,
            },
            0,
          );
        }

        tl.to(
          nextSheet,
          {
            borderTopLeftRadius: MOTION.sheetStack.radiusSquarePx,
            borderTopRightRadius: MOTION.sheetStack.radiusSquarePx,
            ease: MOTION.sheetStack.ease,
          },
          0,
        );
      });

      return () => {
        resizeObserver.disconnect();
      };
    },
    { scope: containerRef, dependencies: [reducedMotion, narrow] },
  );

  const containerClasses = [
    'sheet-stack',
    reducedMotion ? 'sheet-stack-reduced-motion' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      {children}
    </div>
  );
}
