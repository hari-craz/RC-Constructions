import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders with accessible link label and brand wordmark', () => {
    render(<Logo />);
    const link = screen.getByRole('link', { name: /rc constructions - home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#hero');
    expect(screen.getByText('RC Constructions')).toBeInTheDocument();
  });
});
