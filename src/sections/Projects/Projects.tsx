import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Sheet } from '../../components/SheetStack';
import {
  getProjectById,
  getProjectBySlug,
  PROJECTS_CONTENT,
  type ProjectItem,
} from '../../content/projects';
import { ENVELOPE_STAGE } from '../../data/stages';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import { parseProjectHash } from '../../lib/slug';
import './Projects.css';

// Lazy-load ProjectOverlay to keep main bundle small
const ProjectOverlay = lazy(() =>
  import('../../components/ProjectOverlay').then((m) => ({ default: m.ProjectOverlay })),
);

const prefetchOverlay = () => {
  import('../../components/ProjectOverlay');
};

const stage = ENVELOPE_STAGE;
const content = PROJECTS_CONTENT;

interface ProjectRowProps {
  project: ProjectItem;
  isActive: boolean;
  onActivate: (projectId: string) => void;
  onOpen: (projectId: string, triggerEl: HTMLElement) => void;
}

function ProjectRow({ project, isActive, onActivate, onOpen }: ProjectRowProps) {
  return (
    <li
      id={`${project.id}-row`}
      className={`projects-row-item ${isActive ? 'is-active' : ''}`}
      data-project-id={project.id}
      data-cursor="project"
    >
      <button
        type="button"
        className="projects-row-btn"
        aria-expanded={isActive}
        aria-label={`Project ${project.number}: ${project.name}, ${project.category}, ${project.location}. Click to open detail sheet.`}
        onClick={(e) => {
          onActivate(project.id);
          onOpen(project.id, e.currentTarget);
        }}
        onFocus={() => {
          onActivate(project.id);
          prefetchOverlay();
        }}
        onMouseEnter={() => {
          onActivate(project.id);
          prefetchOverlay();
        }}
      >
        <div className="projects-row-top">
          <div className="projects-row-ident">
            <span className="projects-row-num">{project.number}</span>
            <h3 className="projects-row-name">{project.name}</h3>
          </div>
          <span className="projects-row-meta">
            {project.category} — {project.year}
          </span>
        </div>
        <div className="projects-row-bottom">
          <span className="projects-row-spec">
            {project.location} · {project.builtArea}
          </span>
          <span className="projects-row-outcome">{project.outcome}</span>
        </div>
      </button>
      <div className="projects-row-rule" aria-hidden="true" />
    </li>
  );
}

export function Projects() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const registerRef = useRef<HTMLUListElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const firstProject = content.projects[0];
  const [activeProjectId, setActiveProjectId] = useState<string>(
    firstProject ? firstProject.id : '',
  );
  const [overlayProjectId, setOverlayProjectId] = useState<string | null>(null);
  const { reducedMotion } = useScroll();

  const activeProject =
    content.projects.find((p) => p.id === activeProjectId) ?? content.projects[0];
  const overlayProject = overlayProjectId ? (getProjectById(overlayProjectId) ?? null) : null;

  // Sync state with URL hash (#project-<slug>) on direct visit, reload, or back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const slug = parseProjectHash(window.location.hash);
      if (slug) {
        const found = getProjectBySlug(slug);
        if (found) {
          setOverlayProjectId(found.id);
          setActiveProjectId(found.id);

          // Scroll projects section into place behind overlay on direct visit
          const sectionEl = document.getElementById(stage.sectionId);
          if (sectionEl && window.scrollY < 100) {
            sectionEl.scrollIntoView({ behavior: 'auto' });
          }
        }
      } else {
        setOverlayProjectId(null);
        const trigger = triggerRef.current;
        if (trigger) {
          let attempts = 0;
          const refocus = () => {
            if (document.activeElement === trigger) return;
            trigger.focus({ preventScroll: true });
            attempts++;
            if (attempts < 15 && document.activeElement !== trigger) {
              setTimeout(refocus, 50);
            }
          };
          requestAnimationFrame(refocus);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleOpenOverlay = (projectId: string, triggerEl: HTMLElement) => {
    triggerRef.current = triggerEl;
    const project = getProjectById(projectId);
    if (project) {
      setOverlayProjectId(project.id);
      const targetHash = `#project-${project.slug}`;
      if (window.location.hash !== targetHash) {
        history.pushState(null, '', targetHash);
      }
    }
  };

  const handleCloseOverlay = () => {
    setOverlayProjectId(null);
    const trigger = triggerRef.current;
    if (window.location.hash.startsWith('#project-')) {
      history.back();
    }
    if (trigger) {
      let attempts = 0;
      const refocus = () => {
        if (document.activeElement === trigger) return;
        trigger.focus({ preventScroll: true });
        attempts++;
        if (attempts < 15 && document.activeElement !== trigger) {
          setTimeout(refocus, 50);
        }
      };
      requestAnimationFrame(refocus);
    }
  };

  const handleSelectAdjacent = (nextId: string) => {
    const nextProj = getProjectById(nextId);
    if (nextProj) {
      setOverlayProjectId(nextProj.id);
      setActiveProjectId(nextProj.id);
      document.getElementById(`${nextProj.id}-row`)?.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      const targetHash = `#project-${nextProj.slug}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }
  };

  useGSAP(
    () => {
      if (reducedMotion || !registerRef.current) return;

      const rules = registerRef.current.querySelectorAll('.projects-row-rule');
      if (rules.length === 0) return;

      gsap.from(rules, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: `#${stage.sectionId}`,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: containerRef, dependencies: [reducedMotion] },
  );

  return (
    <>
      <Sheet id={stage.sectionId} tone={stage.tone} className="projects-sheet">
        <div ref={containerRef} className="sheet-column projects-content">
          <header className="projects-header">
            <h2 id={`${stage.sectionId}-heading`} className="projects-title">
              {content.title}
            </h2>
          </header>

          {/* Summary panel for the selected project; it never holds list rows */}
          <div
            className="projects-preview-slot"
            role="group"
            aria-label={
              activeProject ? `Project summary for ${activeProject.name}` : 'Project summary'
            }
          >
            {activeProject && (
              <dl className="projects-preview-facts">
                <div>
                  <dt>Location</dt>
                  <dd>{activeProject.location}</dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{activeProject.year}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{activeProject.builtArea}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{activeProject.duration}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{activeProject.role}</dd>
                </div>
              </dl>
            )}
          </div>

          <ul ref={registerRef} className="projects-register" aria-label="Selected Projects Index">
            {content.projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onActivate={setActiveProjectId}
                onOpen={handleOpenOverlay}
              />
            ))}
          </ul>
        </div>
      </Sheet>

      {/* Lazy-loaded Project Detail Sheet */}
      <Suspense fallback={null}>
        <ProjectOverlay
          project={overlayProject}
          isOpen={Boolean(overlayProjectId && overlayProject)}
          onClose={handleCloseOverlay}
          onSelectProject={handleSelectAdjacent}
          returnFocusRef={triggerRef}
        />
      </Suspense>
    </>
  );
}
