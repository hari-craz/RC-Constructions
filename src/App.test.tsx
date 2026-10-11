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

    // Verify sequential stage sections are rendered in the document outline
    expect(
      screen.getByRole('heading', { level: 2, name: /substructure & earthwork/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /column assembly & floor slabs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /weatherproof enclosure & walls/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /architectural glazing & mep/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /commissioning & commissioned handover/i }),
    ).toBeInTheDocument();
  });
});
