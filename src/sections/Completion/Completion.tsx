import { useRef } from 'react';
import { Sheet } from '../../components/SheetStack';
import { COMPLETION_CONTENT } from '../../content/completion';
import { useScroll } from '../../hooks/useScroll';
import { formatStatNumber, parseStatValue } from '../../lib/countUp';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './Completion.css';

export function Completion() {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const visualRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const { reducedMotion } = useScroll();

  useGSAP(
    () => {
      if (!contentRef.current || reducedMotion) return;

      ScrollTrigger.create({
        trigger: contentRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          COMPLETION_CONTENT.stats.forEach((stat, index) => {
            const parsed = parseStatValue(stat.value);
            const visualEl = visualRefs.current[index];
            if (!parsed.isNumeric || !visualEl) return;

            const counterObj = { val: 0 };
            gsap.to(counterObj, {
              val: parsed.targetNumber,
              duration: MOTION.stats.countDuration,
              ease: MOTION.stats.ease,
              onUpdate: () => {
                visualEl.textContent = `${parsed.prefix}${formatStatNumber(Math.round(counterObj.val))}${parsed.suffix}`;
              },
            });
          });
        },
      });
    },
    { scope: contentRef },
  );

  return (
    <Sheet id={COMPLETION_CONTENT.sectionId} tone="light" className="completion-sheet">
      <div ref={contentRef} className="sheet-column completion-content">
        <header className="completion-header">
          <h2 id={`${COMPLETION_CONTENT.sectionId}-heading`} className="completion-title">
            {COMPLETION_CONTENT.title}
          </h2>
          <p className="completion-lead">{COMPLETION_CONTENT.lead}</p>
        </header>

        <div className="completion-handover">
          <h3 className="completion-handover-title">{COMPLETION_CONTENT.handoverTitle}</h3>
          <ul className="completion-handover-list">
            {COMPLETION_CONTENT.handover.map((item) => (
              <li key={item.id} className="completion-handover-item">
                <span className="completion-handover-name">{item.title}</span>
                <span className="completion-handover-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {COMPLETION_CONTENT.stats.length > 0 && (
          <div className="completion-stats-band" role="region" aria-label="Completion statistics">
            {COMPLETION_CONTENT.stats.map((stat, idx) => (
              <div key={stat.id} className="completion-stat-cell">
                <span className="completion-stat-figure" data-stat-id={stat.id}>
                  {/* Screen readers and initial no-JS DOM have the final value from the start */}
                  <span className="sr-only">{stat.value}</span>
                  <span
                    aria-hidden="true"
                    ref={(el) => {
                      visualRefs.current[idx] = el;
                    }}
                  >
                    {stat.value}
                  </span>
                </span>
                <p className="completion-stat-caption">{stat.caption}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tall sheet terminal element preserved for viewport reachability verification */}
        <div id="tall-sheet-terminal" aria-hidden="true" style={{ marginTop: 'var(--space-6)' }} />
      </div>
    </Sheet>
  );
}
