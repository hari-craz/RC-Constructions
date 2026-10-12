import { getSectionById, isSiteWindowVisible } from '../../data/stages';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScroll } from '../../hooks/useScroll';
import { Logo } from '../Logo';
import './Nav.css';

export interface NavProps {
  className?: string;
}

export function Nav({ className = '' }: NavProps) {
  const activeSection = useActiveSection();
  const { scrollTo } = useScroll();

  // The header takes the surface of the sheet beneath it. Over the fixed site window
  // (always formwork) it switches to light ink so it stays legible on every surface.
  const tone = (activeSection && getSectionById(activeSection)?.tone) || 'concrete';
  const windowOn = isSiteWindowVisible(activeSection);

  const handleEnquireClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollTo('#contact');
    if (window.location.hash !== '#contact') {
      history.replaceState(null, '', '#contact');
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollTo('#hero');
    if (window.location.hash !== '#hero') {
      history.replaceState(null, '', '#hero');
    }
  };

  return (
    <header
      className={`nav-bar ${className}`.trim()}
      data-tone={tone}
      data-window={windowOn ? 'on' : 'off'}
    >
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="nav-zone nav-zone-text">
        <Logo onClick={handleLogoClick} />
      </div>
      <nav className="nav-zone nav-zone-window" aria-label="Main Navigation">
        <ul className="nav-list">
          <li>
            <a href="#contact" className="nav-link" onClick={handleEnquireClick}>
              Enquire
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
