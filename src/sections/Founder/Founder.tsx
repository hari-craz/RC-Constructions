import { Sheet } from '../../components/SheetStack';
import { FOUNDER_CONTENT } from '../../content/founder';
import './Founder.css';

export function Founder() {
  return (
    <Sheet id={FOUNDER_CONTENT.sectionId} tone="concrete" className="founder-sheet">
      <div className="sheet-wide founder-content">
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
        </div>
      </div>
    </Sheet>
  );
}
