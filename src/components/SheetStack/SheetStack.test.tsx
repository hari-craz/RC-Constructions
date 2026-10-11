import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollContext, type ScrollContextValue } from '../../app/ScrollContext';
import { Sheet } from './Sheet';
import { SheetStack } from './SheetStack';

describe('SheetStack', () => {
  it('renders section landmarks with aria-labelledby and aria-hidden dim overlays', () => {
    const mockContext: ScrollContextValue = {
      lenis: null,
      reducedMotion: false,
      scrollTo: () => {},
      activeSection: '',
    };

    render(
      <ScrollContext.Provider value={mockContext}>
        <SheetStack>
          <Sheet id="test-1" label="Section Alpha">
            <p>Alpha Content</p>
          </Sheet>
          <Sheet id="test-2" label="Section Beta">
            <p>Beta Content</p>
          </Sheet>
        </SheetStack>
      </ScrollContext.Provider>,
    );

    const sections = screen.getAllByRole('region');
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveAttribute('id', 'test-1');
    expect(sections[0]).toHaveAttribute('aria-labelledby', 'test-1-heading');

    const overlay = sections[0]?.querySelector('.sheet-dim-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders static stacking classes and bypasses animation setup under reduced motion', () => {
    const mockContext: ScrollContextValue = {
      lenis: null,
      reducedMotion: true,
      scrollTo: () => {},
      activeSection: '',
    };

    const { container } = render(
      <ScrollContext.Provider value={mockContext}>
        <SheetStack>
          <Sheet id="test-1" label="Section Alpha">
            <p>Alpha Content</p>
          </Sheet>
        </SheetStack>
      </ScrollContext.Provider>,
    );

    const stackContainer = container.querySelector('.sheet-stack');
    expect(stackContainer).toHaveClass('sheet-stack-reduced-motion');
  });
});
