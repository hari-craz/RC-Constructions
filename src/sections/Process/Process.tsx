import { useRef } from 'react';
import { Sheet } from '../../components/SheetStack';
import { PROCESS_CONTENT, type ProcessStep } from '../../content/process';
import { FITOUT_STAGE } from '../../data/stages';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import './Process.css';

const stage = FITOUT_STAGE;
const content = PROCESS_CONTENT;

export function Process() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spineRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;

      const container = containerRef.current;
      const spine = spineRef.current;
      const markers = container.querySelectorAll('.process-step-marker');

      if (spine) {
        gsap.fromTo(
          spine,
          { '--spine-progress': 0 },
          {
            '--spine-progress': 1,
            ease: 'none',
            scrollTrigger: {
              trigger: `#${stage.sectionId}`,
              start: 'top 70%',
              end: 'bottom 85%',
              scrub: true,
            },
          },
        );
      }

      markers.forEach((marker) => {
        gsap.to(marker, {
          scrollTrigger: {
            trigger: marker,
            start: 'top 75%',
            toggleClass: { targets: marker, className: 'is-reached' },
          },
        });
      });
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <Sheet id={stage.sectionId} tone={stage.tone} className="process-sheet">
      <div ref={containerRef} className="sheet-column process-content">
        <header className="process-header">
          <h2 id={`${stage.sectionId}-heading`} className="process-title">
            {content.title}
          </h2>
        </header>

        <div className="process-sequence-container">
          <div className="process-spine" aria-hidden="true">
            <div ref={spineRef} className="process-spine-active" />
          </div>

          <ol className="process-steps" aria-label="Six-step construction delivery process">
            {content.steps.map((step: ProcessStep) => (
              <li key={step.id} className="process-step-item">
                <div
                  className={`process-step-marker ${reducedMotion ? 'is-reached' : ''}`}
                  aria-hidden="true"
                />
                <div className="process-step-header">
                  <span className="process-step-num">{step.number}</span>
                  <h3 className="process-step-title">{step.title}</h3>
                </div>
                <p className="process-step-desc">{step.description}</p>
                <p className="process-step-deliverable">
                  <span className="process-step-deliverable-label">Client Deliverable:</span>
                  {step.deliverable}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Sheet>
  );
}
