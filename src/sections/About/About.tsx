import { useRef } from 'react';
import { Sheet } from '../../components/SheetStack';
import { ABOUT_CONTENT } from '../../content/about';
import { FOUNDATION_STAGE } from '../../data/stages';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import './About.css';

const stage = FOUNDATION_STAGE;
const content = ABOUT_CONTENT;

export function About() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const { reducedMotion } = useScroll();

  useGSAP(
    () => {
      if (reducedMotion || !headlineRef.current) return;

      const lines = headlineRef.current.querySelectorAll('.about-headline-line');
      if (lines.length === 0) return;

      gsap.from(lines, {
        y: '100%',
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: `#${stage.sectionId}`,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <Sheet id={stage.sectionId} label={content.kicker} tone={stage.tone} className="about-sheet">
      {/* Anchor alias so #about deep-links seamlessly target Foundation/About */}
      <div id="about" aria-hidden="true" style={{ height: '1px', width: '100%' }} />
      <div ref={containerRef} className="container about-content">
        <header className="about-header">
          <span className="about-title">{content.title}</span>
          <h2 ref={headlineRef} className="about-headline">
            <span className="about-headline-line">{content.headline}</span>
          </h2>
        </header>

        <div className="about-copy">
          {content.paragraphs.map((p, idx) => (
            <p key={idx} className="about-paragraph">
              {p}
            </p>
          ))}
        </div>

        <div className="about-principles">
          <h3 className="about-principles-title">{content.principlesTitle}</h3>
          <ul className="about-principles-list">
            {content.principles.map((principle) => (
              <li key={principle.id} className="about-principle-item">
                <span className="about-principle-statement">{principle.statement}</span>
                <span className="about-principle-consequence">{principle.consequence}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  );
}
