import { getSectionById } from '../../data/stages';
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

  // Hero, Contact, Founder, and concrete/light stages are light sheets (dark ink); dark stages need light ink.
  const section = getSectionById(activeSection);
  const isLightSheet =
    !activeSection ||
    activeSection === 'hero' ||
    section?.tone === 'concrete' ||
    section?.tone === 'light';
  const toneClass = isLightSheet ? 'nav-tone-dark' : 'nav-tone-light';

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
    <header className={`nav-bar ${toneClass} ${className}`.trim()}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="container nav-container">
        <Logo onClick={handleLogoClick} />
        <nav aria-label="Main Navigation">
          <ul className="nav-list">
            <li>
              <a href="#contact" className="nav-link" onClick={handleEnquireClick}>
                Enquire
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
