import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollContext, type ScrollContextValue } from '../../app/ScrollContext';
import { Nav } from './Nav';

describe('Nav', () => {
  const mockScroll: ScrollContextValue = {
    lenis: null,
    reducedMotion: false,
    scrollTo: () => {},
    activeSection: 'hero',
  };

  it('renders navigation landmark with skip link and enquire action', () => {
    render(
      <ScrollContext.Provider value={mockScroll}>
        <Nav />
      </ScrollContext.Provider>,
    );

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('nav-tone-dark');

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main');

    const navLink = screen.getByRole('link', { name: /enquire/i });
    expect(navLink).toBeInTheDocument();
    expect(navLink).toHaveAttribute('href', '#contact');
  });

  it('switches tone to light when activeSection is a dark sheet', () => {
    const darkScroll: ScrollContextValue = {
      ...mockScroll,
      activeSection: 'about',
    };

    render(
      <ScrollContext.Provider value={darkScroll}>
        <Nav />
      </ScrollContext.Provider>,
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('nav-tone-light');
  });
});
