import { useRef, useState } from 'react';
import { Sheet } from '../../components/SheetStack';
import { PROJECTS_CONTENT, type ProjectItem } from '../../content/projects';
import { ENVELOPE_STAGE } from '../../data/stages';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import './Projects.css';

const stage = ENVELOPE_STAGE;
const content = PROJECTS_CONTENT;

interface ProjectRowProps {
  project: ProjectItem;
  isActive: boolean;
  onActivate: (projectId: string) => void;
}

function ProjectRow({ project, isActive, onActivate }: ProjectRowProps) {
  return (
    <li className={`projects-row-item ${isActive ? 'is-active' : ''}`} data-project-id={project.id}>
      <button
        type="button"
        className="projects-row-btn"
        aria-expanded={isActive}
        aria-label={`Project ${project.number}: ${project.name}, ${project.category}, ${project.location}`}
        onClick={() => onActivate(project.id)}
        onFocus={() => onActivate(project.id)}
        onMouseEnter={() => onActivate(project.id)}
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
  const firstProject = content.projects[0];
  const [activeProjectId, setActiveProjectId] = useState<string>(
    firstProject ? firstProject.id : '',
  );
  const { reducedMotion } = useScroll();

  const activeProject =
    content.projects.find((p) => p.id === activeProjectId) ?? content.projects[0];

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
    <Sheet id={stage.sectionId} label={content.kicker} tone={stage.tone} className="projects-sheet">
      <div ref={containerRef} className="container projects-content">
        <header className="projects-header">
          <div className="projects-kicker-row">
            <span className="projects-kicker">{content.kicker}</span>
            <span className="projects-code">{content.registerCode}</span>
          </div>
          <h2 className="projects-title">{content.title}</h2>
        </header>

        {/* PLACEHOLDER: Flat architectural preview slot reserved for project elevation / drawing */}
        <div
          className="projects-preview-slot"
          role="region"
          aria-label="Selected Project Architectural Preview"
        >
          <div className="projects-preview-badge">
            {'// PLACEHOLDER: ARCHITECTURAL ELEVATION DRAWING SLOT (1200 × 675)'}
          </div>
          {activeProject && (
            <div className="projects-preview-info">
              <span className="projects-preview-name">
                {activeProject.number} · {activeProject.name}
              </span>
              <span className="projects-preview-outcome">{activeProject.outcome}</span>
            </div>
          )}
        </div>

        <ul ref={registerRef} className="projects-register" aria-label="Selected Projects Index">
          {content.projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              onActivate={setActiveProjectId}
            />
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
