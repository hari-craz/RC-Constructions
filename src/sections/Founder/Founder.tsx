import { useRef, useState } from 'react';
import { Sheet } from '../../components/SheetStack';
import { FOUNDER_CONTENT } from '../../content/founder';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import '../../styles/photo-slot.css';
import { MOTION } from '../../lib/motion';
import './Founder.css';

export function Founder() {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const portraitFrameRef = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();
  // A portrait file that fails to load is swapped for the quiet placeholder, never a broken image
  const [portraitFailed, setPortraitFailed] = useState(false);

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
    <Sheet id={FOUNDER_CONTENT.sectionId} tone="concrete" className="founder-sheet">
      <div ref={contentRef} className="sheet-wide founder-content">
        <header className="founder-header">
          <div className="founder-name-group">
            <h2 id={`${FOUNDER_CONTENT.sectionId}-heading`} className="founder-name">
              {FOUNDER_CONTENT.name}
            </h2>
            <span className="founder-role">{FOUNDER_CONTENT.role}</span>
          </div>
        </header>

        <div className="founder-grid">
          <div className="founder-editorial-col">
            {FOUNDER_CONTENT.pullQuote && (
              <blockquote className="founder-quote">
                <p>{FOUNDER_CONTENT.pullQuote}</p>
              </blockquote>
            )}

            <div className="founder-bio">
              {FOUNDER_CONTENT.bioParagraphs.map((sentence) => (
                <p key={sentence} className="founder-bio-p">
                  {sentence}
                </p>
              ))}
            </div>

            {FOUNDER_CONTENT.facts.length > 0 && (
              <ul className="founder-facts-list" aria-label="Founder facts">
                {FOUNDER_CONTENT.facts.map((fact) => (
                  <li key={fact.id} className="founder-fact-item">
                    <span className="founder-fact-label">{fact.label}</span>
                    <span className="founder-fact-value">{fact.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="founder-portrait-col">
            <div
              ref={portraitFrameRef}
              className="founder-portrait-frame photo-slot"
              data-portrait-slot="founder"
            >
              {FOUNDER_CONTENT.portraitAvailable && !portraitFailed ? (
                <picture className="founder-picture">
                  <source srcSet="/images/founder-gokul.webp" type="image/webp" />
                  <img
                    src="/images/founder-gokul.jpg"
                    alt={FOUNDER_CONTENT.portraitAlt}
                    width="1200"
                    height="1500"
                    loading="lazy"
                    className="founder-portrait-img"
                    onError={() => setPortraitFailed(true)}
                  />
                </picture>
              ) : (
                <>
                  <span className="photo-crop photo-crop-tl" />
                  <span className="photo-crop photo-crop-tr" />
                  <span className="photo-crop photo-crop-bl" />
                  <span className="photo-crop photo-crop-br" />
                  <p className="founder-portrait-note photo-slot-note">
                    {FOUNDER_CONTENT.portraitNote}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
