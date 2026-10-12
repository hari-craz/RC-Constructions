import { useRef } from 'react';
import { Sheet } from '../../components/SheetStack';
import { FOUNDER_CONTENT } from '../../content/founder';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './Founder.css';

export function Founder() {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const portraitFrameRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();

  useGSAP(
    () => {
      if (!portraitFrameRef.current || reducedMotion) return;

      gsap.fromTo(
        portraitFrameRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: MOTION.founder.revealDuration,
          ease: MOTION.founder.ease,
          scrollTrigger: {
            trigger: portraitFrameRef.current,
            start: 'top 80%',
            once: true,
          },
        },
      );
    },
    { scope: contentRef },
  );

  return (
    <Sheet
      id={FOUNDER_CONTENT.sectionId}
      label={`${FOUNDER_CONTENT.kicker} — ${FOUNDER_CONTENT.name}`}
      headingTag="span"
      tone="concrete"
      className="founder-sheet"
    >
      <div ref={contentRef} className="container founder-content">
        <header className="founder-header">
          <span className="founder-kicker">{FOUNDER_CONTENT.kicker}</span>
          <div className="founder-name-group">
            <h2 className="founder-name">{FOUNDER_CONTENT.name}</h2>
            <span className="founder-role">{FOUNDER_CONTENT.role}</span>
          </div>
        </header>

        <div className="founder-grid">
          <div className="founder-editorial-col">
            <blockquote className="founder-quote">
              <p>{FOUNDER_CONTENT.pullQuote}</p>
            </blockquote>

            <div className="founder-bio">
              {FOUNDER_CONTENT.bioParagraphs.map((sentence) => (
                <p key={sentence} className="founder-bio-p">
                  {sentence}
                </p>
              ))}
            </div>

            <ul className="founder-facts-list" aria-label="Founder credentials and facts">
              {FOUNDER_CONTENT.facts.map((fact) => (
                <li key={fact.id} className="founder-fact-item">
                  <span className="founder-fact-label">{fact.label}</span>
                  <span className="founder-fact-value">{fact.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="founder-portrait-col">
            <div
              ref={portraitFrameRef}
              className="founder-portrait-frame"
              data-portrait-slot="founder"
            >
              {/* PLACEHOLDER: Founder portrait photograph to be supplied (1200x1500 WebP/JPEG) */}
              <picture className="founder-picture">
                <source srcSet="/images/founder-gokul.webp" type="image/webp" />
                <img
                  src="/images/founder-gokul.jpg"
                  alt={FOUNDER_CONTENT.portraitAlt}
                  width="1200"
                  height="1500"
                  loading="lazy"
                  className="founder-portrait-img"
                />
              </picture>
              <div className="founder-portrait-placeholder" aria-hidden="true">
                <span className="founder-portrait-spec">Portrait to come, 1200 by 1500</span>
                <span className="founder-portrait-dimensions">4:5 ratio · WebP / JPEG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
