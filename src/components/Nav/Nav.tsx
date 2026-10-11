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

  // Hero and Contact sheets are concrete (dark ink); About sheet is formwork-dark (light ink).
  const isLightSheet = !activeSection || activeSection === 'hero' || activeSection === 'contact';
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
