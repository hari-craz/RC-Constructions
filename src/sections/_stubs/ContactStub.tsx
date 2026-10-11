import { Sheet } from '../../components/SheetStack';

/**
 * Temporary Section Stub — Phase 4 Contact Anchor.
 * To be replaced in Phase 8 with the live Formspree contact interface.
 */
export function ContactStub() {
  return (
    <Sheet id="contact" label="Section 05 — Survey Marker & Contact" tone="concrete">
      <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 'var(--font-size-2xl)',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}
        >
          Tender & Site Consultation [Temporary Stub]
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-formwork-dark)',
            maxWidth: '60ch',
          }}
        >
          This section anchors the #contact navigation target until Phase 8 implements the complete
          Formspree tender specification form.
        </p>
      </div>
    </Sheet>
  );
}
