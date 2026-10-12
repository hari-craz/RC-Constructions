import { useEffect, useState } from 'react';
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

  const [surfaceTone, setSurfaceTone] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const updateSurfaceTone = () => {
      const sheets = Array.from(document.querySelectorAll<HTMLElement>('.sheet'));
      const navY = 48;
      let matched: 'light' | 'dark' | null = null;
      for (const sheet of sheets) {
        const rect = sheet.getBoundingClientRect();
        if (rect.top <= navY && rect.bottom > navY) {
          matched = sheet.classList.contains('sheet-tone-dark') ? 'light' : 'dark';
        }
      }
      if (matched) {
        setSurfaceTone(matched);
      } else {
        const s = getSectionById(activeSection);
        setSurfaceTone(
          s?.tone === 'concrete' || s?.tone === 'light' || activeSection === 'hero'
            ? 'dark'
            : 'light',
        );
      }
    };

    updateSurfaceTone();
    window.addEventListener('scroll', updateSurfaceTone, { passive: true });
    return () => window.removeEventListener('scroll', updateSurfaceTone);
  }, [activeSection]);

  const toneClass = surfaceTone === 'dark' ? 'nav-tone-dark' : 'nav-tone-light';

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
