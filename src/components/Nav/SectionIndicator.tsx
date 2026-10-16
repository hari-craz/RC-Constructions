import { useEffect, useRef, useState } from 'react';
import { NAV_SECTIONS } from '../../data/stages';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScroll } from '../../hooks/useScroll';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Where am I on this long page. From 1280 px: small links with the current one underlined.
 * Below that: a button showing the current section that opens a full-width list in a dialog.
 */
export function SectionIndicator() {
  const activeSection = useActiveSection();
  const { scrollTo } = useScroll();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<string | null>(null);
  useScrollLock(open);

  // Scroll only once the dialog's scroll lock has released (Lenis ignores scrolls while stopped)
  useEffect(() => {
    if (open || !pendingRef.current) return;
    const id = pendingRef.current;
    pendingRef.current = null;
    scrollTo(`#${id}`);
  }, [open, scrollTo]);

  const currentId = activeSection === 'about' ? 'foundation' : activeSection;
  const current = NAV_SECTIONS.find((s) => s.sectionId === currentId);

  // A click on the backdrop (the dialog element itself) dismisses the list
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, []);

  // Close the dialog when the page is resized up to the full-link layout
  useEffect(() => {
    const query = window.matchMedia('(width >= 1280px)');
    const onChange = () => dialogRef.current?.open && dialogRef.current.close();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const dialog = dialogRef.current;
    if (dialog?.open) {
      pendingRef.current = id;
      dialog.close();
    } else {
      scrollTo(`#${id}`);
    }
    if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  };

  return (
    <>
      <nav className="nav-sections" aria-label="Sections">
        <ul className="nav-sections-list">
          {NAV_SECTIONS.map((s) => (
            <li key={s.sectionId}>
              <a
                href={`#${s.sectionId}`}
                className="nav-sections-link"
                aria-current={s.sectionId === currentId ? 'true' : undefined}
                onClick={(e) => go(e, s.sectionId)}
              >
                {s.navLabel}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={toggleRef}
        type="button"
        className="nav-sections-toggle"
        aria-haspopup="dialog"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
      >
        {current?.navLabel ?? 'Sections'}
      </button>

      <dialog
        ref={dialogRef}
        className="nav-sections-dialog"
        aria-label="Sections"
        onClose={() => {
          setOpen(false);
          // Safari does not focus buttons on click, so the dialog has nothing to hand focus back to
          toggleRef.current?.focus({ preventScroll: true });
        }}
      >
        <ul className="nav-sections-dialog-list">
          {NAV_SECTIONS.map((s) => (
            <li key={s.sectionId}>
              <a
                href={`#${s.sectionId}`}
                className="nav-sections-dialog-link"
                aria-current={s.sectionId === currentId ? 'true' : undefined}
                onClick={(e) => go(e, s.sectionId)}
              >
                {s.navLabel}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="nav-sections-dialog-close"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </dialog>
    </>
  );
}
