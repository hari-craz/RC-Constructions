import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { type ProjectItem, PROJECTS_CONTENT } from '../../content/projects';
import { useScroll } from '../../hooks/useScroll';
import { useScrollLock } from '../../hooks/useScrollLock';
import { gsap } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './ProjectOverlay.css';

export interface ProjectOverlayProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export function ProjectOverlay({
  project,
  isOpen,
  onClose,
  onSelectProject,
  returnFocusRef,
}: ProjectOverlayProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const { reducedMotion } = useScroll();

  // Scroll lock: pauses Lenis and freezes document.body overflow while open
  useScrollLock(isOpen);

  // Focus trap, inert management, and escape key handling
  useEffect(() => {
    if (!isOpen || !project) return;

    // Apply inert to main content and navigation behind overlay
    const mainEl = document.getElementById('main');
    const navEl = document.querySelector('.nav-bar');
    if (mainEl) mainEl.setAttribute('inert', '');
    if (navEl) navEl.setAttribute('inert', '');

    // Focus the visible Close button first
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const triggerEl = returnFocusRef?.current;

    const returnFocus = () => {
      const target =
        triggerEl ??
        (project
          ? document.querySelector<HTMLElement>(`[data-project-id="${project.id}"] button`)
          : null);
      if (target && typeof target.focus === 'function') {
        let attempts = 0;
        const attempt = () => {
          if (document.activeElement === target) return;
          target.focus({ preventScroll: true });
          attempts++;
          if (attempts < 12 && document.activeElement !== target) {
            setTimeout(attempt, 50);
          }
        };
        requestAnimationFrame(attempt);
      }
    };

    const handleClose = () => {
      if (mainEl) mainEl.removeAttribute('inert');
      if (navEl) navEl.removeAttribute('inert');
      onClose();
      returnFocus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (mainEl) mainEl.removeAttribute('inert');
      if (navEl) navEl.removeAttribute('inert');

      requestAnimationFrame(() => {
        returnFocus();
        setTimeout(returnFocus, 50);
        setTimeout(returnFocus, 250);
      });
    };
  }, [isOpen, project, onClose, returnFocusRef]);

  // Entrance & Exit animation (0.7s power2.out sheet rise, instant under reduced motion)
  useEffect(() => {
    if (!sheetRef.current || !backdropRef.current) return;

    if (!isOpen) {
      if (!reducedMotion) {
        gsap.to(sheetRef.current, {
          yPercent: 100,
          duration: MOTION.overlay.sheetFallDuration,
          ease: 'power2.in',
        });
        gsap.to(backdropRef.current, {
          opacity: 0,
          duration: MOTION.overlay.sheetFallDuration,
          ease: 'power2.in',
        });
      }
      return;
    }

    if (reducedMotion) {
      gsap.set(sheetRef.current, { yPercent: 0 });
      gsap.set(backdropRef.current, { opacity: MOTION.overlay.backdropDimOpacity });
    } else {
      gsap.fromTo(
        sheetRef.current,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: MOTION.overlay.sheetRiseDuration,
          ease: MOTION.overlay.ease,
        },
      );
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        {
          opacity: MOTION.overlay.backdropDimOpacity,
          duration: MOTION.overlay.sheetRiseDuration,
          ease: MOTION.overlay.ease,
        },
      );
    }
  }, [isOpen, reducedMotion]);

  if (!isOpen || !project) {
    return null;
  }

  const allProjects = PROJECTS_CONTENT.projects;
  const currentIndex = allProjects.findIndex((p) => p.id === project.id);
  const prevProject = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length];
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length];

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-overlay-title"
      className="project-overlay-portal"
      data-testid="project-overlay"
    >
      {/* 40% Backdrop Dimmer */}
      <div
        ref={backdropRef}
        className="project-overlay-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Riser Sheet */}
      <div ref={sheetRef} className="project-overlay-sheet">
        <div className="project-overlay-scroll-container">
          <header className="project-overlay-header">
            <h2 id="project-overlay-title" className="project-overlay-title">
              {project.name}
            </h2>
            <p className="project-overlay-role">{project.role}</p>

            <button
              ref={closeBtnRef}
              type="button"
              className="project-overlay-close-btn"
              onClick={onClose}
              aria-label="Close project detail"
            >
              Close
            </button>
          </header>

          {/* Specifications Meta Grid */}
          <dl className="project-overlay-specs" aria-label="Project specifications">
            <div className="project-spec-item">
              <dt className="project-spec-key">Type</dt>
              <dd className="project-spec-val">{project.category}</dd>
            </div>
            <div className="project-spec-item">
              <dt className="project-spec-key">Location</dt>
              <dd className="project-spec-val">{project.location}</dd>
            </div>
            <div className="project-spec-item">
              <dt className="project-spec-key">Year</dt>
              <dd className="project-spec-val">{project.year}</dd>
            </div>
            <div className="project-spec-item">
              <dt className="project-spec-key">Built Area</dt>
              <dd className="project-spec-val">{project.builtArea}</dd>
            </div>
            <div className="project-spec-item">
              <dt className="project-spec-key">Duration</dt>
              <dd className="project-spec-val">{project.duration}</dd>
            </div>
          </dl>

          {/* Project Brief */}
          <section className="project-overlay-section" aria-labelledby="project-brief-heading">
            <h3 id="project-brief-heading" className="project-overlay-section-title">
              Contractor Brief
            </h3>
            <p className="project-overlay-brief-text">{project.brief}</p>
          </section>

          {/* Scope of Works */}
          <section className="project-overlay-section" aria-labelledby="project-scope-heading">
            <h3 id="project-scope-heading" className="project-overlay-section-title">
              Scope of Works
            </h3>
            <ul className="project-overlay-scope-list">
              {project.scope.map((item, idx) => (
                <li key={idx} className="project-overlay-scope-item">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Handover Outcome */}
          <section className="project-overlay-section" aria-labelledby="project-outcome-heading">
            <h3 id="project-outcome-heading" className="project-overlay-section-title">
              Delivered Outcome
            </h3>
            <p className="project-overlay-outcome-text">{project.outcome}</p>
          </section>

          {/* Reserved Concrete Gallery Slots */}
          <section className="project-overlay-section" aria-labelledby="project-gallery-heading">
            <h3 id="project-gallery-heading" className="project-overlay-section-title">
              Construction Record Drawings
            </h3>
            <div className="project-overlay-gallery-grid">
              {project.gallery.map((slot) => (
                <figure key={slot.id} className="project-overlay-gallery-slot">
                  <div
                    className="gallery-slot-block"
                    role="img"
                    aria-label={`Drawing placeholder: ${slot.caption}`}
                  >
                    <span className="gallery-slot-placeholder-mark">
                      {'// ARCHITECTURAL DRAWING SLOT'}
                    </span>
                  </div>
                  <figcaption className="gallery-slot-caption">{slot.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* Previous / Next Project Controls (plain text links, no arrows) */}
          <footer className="project-overlay-footer">
            <div className="project-adjacent-links" aria-label="Adjacent project navigation">
              {prevProject && (
                <button
                  type="button"
                  className="project-adjacent-btn"
                  onClick={() => onSelectProject(prevProject.id)}
                >
                  Previous: {prevProject.name}
                </button>
              )}
              {nextProject && (
                <button
                  type="button"
                  className="project-adjacent-btn"
                  onClick={() => onSelectProject(nextProject.id)}
                >
                  Next: {nextProject.name}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
