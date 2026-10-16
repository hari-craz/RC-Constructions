import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    expect(header).toHaveAttribute('data-tone', 'concrete');
    expect(header).toHaveAttribute('data-window', 'off');

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main');

    const navLink = screen.getByRole('link', { name: /enquire/i });
    expect(navLink).toBeInTheDocument();
    expect(navLink).toHaveAttribute('href', '#contact');
  });

  it('takes the sheet tone and flags the site window once past the hero', () => {
    const darkScroll: ScrollContextValue = {
      ...mockScroll,
      activeSection: 'envelope',
    };

    render(
      <ScrollContext.Provider value={darkScroll}>
        <Nav />
      </ScrollContext.Provider>,
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-tone', 'light');
    expect(header).toHaveAttribute('data-window', 'on');
  });
  it('lists the sections in story order and marks the current one', () => {
    const scrollTo = vi.fn();
    render(
      <ScrollContext.Provider value={{ ...mockScroll, activeSection: 'fitout', scrollTo }}>
        <Nav />
      </ScrollContext.Provider>,
    );

    const sections = screen.getByRole('navigation', { name: 'Sections' });
    const links = within(sections).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Principles',
      'Process',
      'Track record',
      'Services',
      'Projects',
      'Contact',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '#foundation',
      '#fitout',
      '#completion',
      '#structure',
      '#envelope',
      '#contact',
    ]);
    const current = links.filter((l) => l.getAttribute('aria-current') === 'true');
    expect(current.map((l) => l.textContent)).toEqual(['Process']);

    fireEvent.click(links[3] as HTMLElement);
    expect(scrollTo).toHaveBeenCalledWith('#structure');

    // The compact button names the current section
    expect(screen.getByRole('button', { name: 'Process' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });
});
