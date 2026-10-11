import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function BrokenComponent(): React.ReactNode {
  throw new Error('Simulated architectural component failure');
}

describe('ErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('catches runtime exception and displays fallback with company name and contact info', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('RC Constructions')).toBeInTheDocument();
    expect(screen.getByText(/Telephone/i)).toBeInTheDocument();
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload drawing interface/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
