import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders Nav and Hero with accessible landmarks and copy', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /rc constructions/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /enquire/i })).toBeInTheDocument();
    expect(screen.getByText(/we build homes, offices, factories and roads/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request a quote/i })).toBeInTheDocument();

    // Verify Phase 7 real content headings
    expect(
      screen.getByRole('heading', { level: 2, name: /we work from the ground up/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /services & construction schedule/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /^selected projects$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /construction process/i }),
    ).toBeInTheDocument();

    // Verify Phase 7C Completion and Founder headings are rendered
    expect(screen.getByRole('heading', { level: 2, name: /work delivered/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /gokul/i })).toBeInTheDocument();

    // Verify Phase 7D Contact heading and footer
    expect(
      screen.getByRole('heading', { level: 2, name: /tell us what you want to build/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send enquiry/i })).toBeInTheDocument();
    expect(screen.getByText(/built by unitaryx/i)).toBeInTheDocument();
  });
});
