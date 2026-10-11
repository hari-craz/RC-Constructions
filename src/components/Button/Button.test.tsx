import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders as a button element when href is not provided', () => {
    render(<Button type="submit">Submit Inquiry</Button>);
    const btn = screen.getByRole('button', { name: /submit inquiry/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'submit');
  });

  it('renders as an anchor link when href is provided', () => {
    render(<Button href="#contact">Request a quote</Button>);
    const link = screen.getByRole('link', { name: /request a quote/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#contact');
  });
});
