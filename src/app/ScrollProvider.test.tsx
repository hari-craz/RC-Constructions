import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gsap, loadMotion } from '../lib/gsap';
import { useScroll } from './ScrollContext';
import { ScrollProvider } from './ScrollProvider';

const mockDestroy = vi.fn();
const mockOn = vi.fn();
const mockRaf = vi.fn();

vi.mock('lenis', () => {
  return {
    default: class MockLenis {
      destroy = mockDestroy;
      on = mockOn;
      raf = mockRaf;
      scrollTo = vi.fn();
    },
  };
});

function Consumer() {
  const { lenis, reducedMotion } = useScroll();
  return (
    <div>
      <span data-testid="lenis-status">{lenis ? 'active' : 'null'}</span>
      <span data-testid="reduced-motion">{reducedMotion ? 'true' : 'false'}</span>
    </div>
  );
}

describe('ScrollProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates and cleans up Lenis and ticker callback on unmount', async () => {
    await loadMotion();
    const tickerAddSpy = vi.spyOn(gsap.ticker, 'add');
    const tickerRemoveSpy = vi.spyOn(gsap.ticker, 'remove');

    const { unmount } = render(
      <ScrollProvider>
        <Consumer />
      </ScrollProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('lenis-status')).toHaveTextContent('active'));
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    expect(tickerAddSpy).toHaveBeenCalled();

    unmount();

    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(tickerRemoveSpy).toHaveBeenCalled();
  });

  it('does not create Lenis when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ScrollProvider>
        <Consumer />
      </ScrollProvider>,
    );

    expect(screen.getByTestId('lenis-status')).toHaveTextContent('null');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });
});
