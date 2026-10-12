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

  it('opens with a single h1 that names the landmark and no section label', () => {
    render(
      <ScrollProvider>
        <Hero />
      </ScrollProvider>,
    );

    const heading = document.getElementById('hero-heading');
    expect(heading?.tagName).toBe('H1');
    expect(document.getElementById('hero')).toHaveAttribute('aria-labelledby', 'hero-heading');
    expect(document.body).not.toHaveTextContent(/section 01/i);

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings).toHaveLength(1);
  });
});
