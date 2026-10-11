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
});
