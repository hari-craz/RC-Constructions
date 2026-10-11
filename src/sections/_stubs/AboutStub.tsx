import { Sheet } from '../../components/SheetStack';

/**
 * Temporary Section Stub — Phase 4 SheetStack Transition Anchor.
 * To be replaced in Phase 6 with the live Structural Framing assembly.
 */
export function AboutStub() {
  return (
    <Sheet id="about" label="Section 02 — Structural Framing" tone="dark">
      <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 'var(--font-size-2xl)',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}
        >
          Structural Framing & Assembly [Temporary Stub]
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-ink-muted)',
            maxWidth: '60ch',
            marginBottom: 'var(--space-8)',
          }}
        >
          This section anchors the SheetStack slide-over transition above the hero until Phase 6
          implements the live structural column assembly.
        </p>
        <div
          style={{
            minHeight: '40dvh',
            border: '1px dashed var(--color-line-subtle)',
            padding: 'var(--space-4)',
          }}
        >
          <p style={{ color: 'var(--color-ink-muted)' }}>
            Interim structural column grid specifications and load-bearing metrics.
          </p>
        </div>
        <div
          id="tall-sheet-terminal"
          style={{
            marginTop: 'var(--space-8)',
            padding: 'var(--space-4)',
            border: '1px solid var(--color-line)',
          }}
        >
          <p style={{ color: 'var(--color-limewash)' }}>
            <strong>Tall Sheet Terminal Element:</strong> Reachable in viewport before Contact sheet
            covers.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
