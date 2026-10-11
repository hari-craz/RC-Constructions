import { Sheet, SheetStack } from '../components/SheetStack';
import { useActiveSection } from '../hooks/useActiveSection';
import { useScroll } from '../hooks/useScroll';

/**
 * TEMPORARY DEV PLAYGROUND — Phase 3 motion verification only.
 * Will be replaced in Phase 4 by real architectural sections.
 */
export function Playground() {
  const { scrollTo, reducedMotion } = useScroll();
  const activeSection = useActiveSection();

  return (
    <div className="playground-root">
      <nav
        aria-label="Playground Navigation"
        className="container"
        style={{ paddingBlock: 'var(--space-4)' }}
      >
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-ink-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Phase 3 Motion Playground {reducedMotion ? '(Reduced Motion Mode)' : ''}{' '}
          {activeSection ? `[Active: ${activeSection}]` : ''}
        </p>
        <ul style={{ display: 'flex', gap: 'var(--space-4)', listStyle: 'none' }}>
          <li>
            <button type="button" onClick={() => scrollTo('#sheet-1')}>
              Sheet 1
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollTo('#sheet-2')}>
              Sheet 2
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollTo('#sheet-3')}>
              Sheet 3 (Tall)
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollTo('#sheet-4')}>
              Sheet 4
            </button>
          </li>
        </ul>
      </nav>

      <SheetStack>
        <Sheet id="sheet-1" label="Sheet 01 — Base Foundation" tone="dark">
          <div className="container">
            <p>
              Demonstrates initial pinning, scaling to 0.94, rounding to 32px, and 40% formwork-dark
              dimming.
            </p>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-ink-muted)' }}>
              Scroll down to observe Sheet 02 sliding over this foundation sheet.
            </p>
          </div>
        </Sheet>

        <Sheet id="sheet-2" label="Sheet 02 — Framing & Columns" tone="raised">
          <div className="container">
            <p>Demonstrates top corners squaring from 32px to 0 as it reaches viewport top.</p>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-ink-muted)' }}>
              Subsequent sheets stack over previously pinned layers.
            </p>
          </div>
        </Sheet>

        <Sheet id="sheet-3" label="Sheet 03 — Materials Specification" tone="light">
          <div
            className="container"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}
          >
            <p>
              Demonstrates tall sheet handling (height &gt; viewport). The bottom sticks so all
              content is reachable.
            </p>
            <div style={{ height: '40dvh', border: '1px dashed var(--color-line)' }}>
              <p style={{ padding: 'var(--space-4)' }}>Intermediate section block 1</p>
            </div>
            <div style={{ height: '40dvh', border: '1px dashed var(--color-line)' }}>
              <p style={{ padding: 'var(--space-4)' }}>Intermediate section block 2</p>
            </div>
            <div
              id="tall-sheet-terminal"
              style={{ padding: 'var(--space-4)', border: '2px solid var(--color-line)' }}
            >
              <p>
                <strong>Tall Sheet Terminal Element:</strong> Reachable before Sheet 04 covers it.
              </p>
            </div>
          </div>
        </Sheet>

        <Sheet id="sheet-4" label="Sheet 04 — Survey Marker" tone="concrete">
          <div className="container">
            <p>Final sheet in the stack. Settles without pinning to conclude page progression.</p>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-surface)' }}>
              Scroll up to observe seamless bidirectional scrubbing back to the base sheet.
            </p>
          </div>
        </Sheet>
      </SheetStack>
    </div>
  );
}
