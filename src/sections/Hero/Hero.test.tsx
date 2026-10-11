import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollProvider } from '../../app/ScrollProvider';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders section landmark, headline, tagline, and CTA button', () => {
    render(
      <ScrollProvider>
        <Hero />
      </ScrollProvider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /rc constructions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we build homes, offices, factories and roads/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a quote/i })).toBeInTheDocument();

    const heroSection = document.getElementById('hero');
    expect(heroSection).toBeInTheDocument();
    expect(heroSection).toHaveClass('sheet-tone-concrete');
  });

  it('renders sheet-label as span to preserve proper h1 document heading outline', () => {
    render(
      <ScrollProvider>
        <Hero />
      </ScrollProvider>,
    );

    const sheetHeading = document.getElementById('hero-heading');
    expect(sheetHeading?.tagName).toBe('SPAN');
    expect(sheetHeading).toHaveTextContent(/section 01/i);

    // Ensure h1 is the first heading in the DOM order
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings).toHaveLength(1);
    expect(headings[0]?.tagName).toBe('H1');
  });
});
