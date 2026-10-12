import { useEffect, useRef, useState } from 'react';
import { getStageBySectionId, type StageId } from '../../data/stages';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScroll } from '../../hooks/useScroll';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import './Building.css';

export interface BuildingProps {
  className?: string;
}

export function Building({ className = '' }: BuildingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const { reducedMotion } = useScroll();
  const activeSection = useActiveSection();

  // Derive active stage from activeSection
  const stageFromSection = getStageBySectionId(activeSection);
  const activeStage: StageId = stageFromSection
    ? stageFromSection.id
    : activeSection === 'contact' || activeSection === 'founder'
      ? 'completion'
      : 'survey';

  const isVisible =
    activeStage !== 'survey' && activeSection !== 'founder' && activeSection !== 'contact';

  // Lazy mount after initial idle period to stay completely off the Hero LCP critical path
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(
        () => {
          setMounted(true);
        },
        { timeout: 1500 },
      );
    } else {
      timeoutId = setTimeout(() => {
        setMounted(true);
      }, 500);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useGSAP(
    () => {
      if (!mounted || !containerRef.current) return;

      const container = containerRef.current;
      const foundationGroup = container.querySelector('#stage-foundation');
      const structureGroup = container.querySelector('#stage-structure');
      const envelopeGroup = container.querySelector('#stage-envelope');
      const fitoutGroup = container.querySelector('#stage-fitout');
      const completionGroup = container.querySelector('#stage-completion');
      const dimensionsGroup = container.querySelector('#stage-dimensions');
      const columns = container.querySelectorAll('.bldg-col');
      const slabs = container.querySelectorAll('.bldg-slab');
      const windows = container.querySelectorAll('.bldg-window-glass');

      if (reducedMotion) {
        // Immediate static layout for reduced motion
        gsap.set(
          [
            foundationGroup,
            structureGroup,
            envelopeGroup,
            fitoutGroup,
            completionGroup,
            dimensionsGroup,
          ].filter(Boolean),
          { opacity: 1, scaleY: 1, strokeDashoffset: 0 },
        );
        gsap.set(columns, { scaleY: 1, opacity: 1 });
        gsap.set(slabs, { scaleX: 1, opacity: 1 });
        gsap.set(windows, { fill: 'var(--color-accent)' });
        return;
      }

      // Initial state: hide progressive elevation stages
      gsap.set(
        [
          foundationGroup,
          structureGroup,
          envelopeGroup,
          fitoutGroup,
          completionGroup,
          dimensionsGroup,
        ].filter(Boolean),
        { opacity: 0 },
      );
      gsap.set(columns, { scaleY: 0, transformOrigin: 'bottom center' });
      gsap.set(slabs, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(windows, { fill: 'transparent' });

      // Stage 2: Foundation (Substructure & Earthwork)
      const foundationSection = document.getElementById('foundation');
      if (foundationSection && foundationGroup) {
        const foundationPaths = foundationGroup.querySelectorAll<SVGGeometryElement>(
          'path, line, rect, polygon',
        );
        foundationPaths.forEach((el) => {
          el.setAttribute('pathLength', '1');
          gsap.set(el, { strokeDasharray: 1, strokeDashoffset: 1 });
        });

        const foundationTl = gsap.timeline({
          scrollTrigger: {
            trigger: foundationSection,
            start: 'top 85%',
            end: 'top 20%',
            scrub: true,
          },
        });

        foundationTl.to(foundationGroup, { opacity: 1, duration: 0.2 }, 0);
        foundationTl.to(
          foundationPaths,
          {
            strokeDashoffset: 0,
            duration: MOTION.building.foundationDrawDuration,
            ease: MOTION.building.strokeEase,
            stagger: 0.04,
          },
          0.1,
        );
      }

      // Stage 3: Structure (Column Grid & Slabs)
      const structureSection = document.getElementById('structure');
      if (structureSection && structureGroup) {
        const structureTl = gsap.timeline({
          scrollTrigger: {
            trigger: structureSection,
            start: 'top 85%',
            end: 'top 20%',
            scrub: true,
          },
        });

        structureTl.to(structureGroup, { opacity: 1, duration: 0.1 }, 0);
        structureTl.to(
          columns,
          {
            scaleY: 1,
            duration: MOTION.building.columnRiseDuration,
            ease: MOTION.building.strokeEase,
            stagger: MOTION.building.columnRiseStagger,
          },
          0.1,
        );
        structureTl.to(
          slabs,
          {
            scaleX: 1,
            duration: MOTION.building.slabDrawDuration,
            ease: MOTION.building.strokeEase,
            stagger: MOTION.building.slabDrawStagger,
          },
          0.4,
        );
      }

      // Stage 4: Envelope (Walls & Openings)
      const envelopeSection = document.getElementById('envelope');
      if (envelopeSection && envelopeGroup) {
        const envelopeTl = gsap.timeline({
          scrollTrigger: {
            trigger: envelopeSection,
            start: 'top 85%',
            end: 'top 20%',
            scrub: true,
          },
        });

        envelopeTl.to(
          envelopeGroup,
          {
            opacity: 1,
            duration: MOTION.building.wallFillDuration,
            ease: MOTION.building.fillEase,
          },
          0,
        );
      }

      // Stage 5: Fit-out (Partitions, Stairs & Mullions)
      const fitoutSection = document.getElementById('fitout');
      if (fitoutSection && fitoutGroup) {
        const fitoutTl = gsap.timeline({
          scrollTrigger: {
            trigger: fitoutSection,
            start: 'top 85%',
            end: 'top 20%',
            scrub: true,
          },
        });

        fitoutTl.to(fitoutGroup, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0);
      }

      // Stage 6: Completion (Lit Windows, Dimensions & Handover)
      const completionSection = document.getElementById('completion');
      if (completionSection && completionGroup) {
        const dimPaths = dimensionsGroup?.querySelectorAll<SVGGeometryElement>('line, path') || [];
        dimPaths.forEach((el) => {
          el.setAttribute('pathLength', '1');
          gsap.set(el, { strokeDasharray: 1, strokeDashoffset: 1 });
        });

        const completionTl = gsap.timeline({
          scrollTrigger: {
            trigger: completionSection,
            start: 'top 85%',
            end: 'top 20%',
            scrub: true,
          },
        });

        completionTl.to(completionGroup, { opacity: 1, duration: 0.2 }, 0);
        completionTl.to(
          windows,
          {
            fill: 'var(--color-accent)',
            duration: MOTION.building.windowLitDuration,
            ease: 'none',
            stagger: MOTION.building.windowLitStagger,
          },
          0.1,
        );
        if (dimensionsGroup) {
          completionTl.to(dimensionsGroup, { opacity: 1, duration: 0.2 }, 0.4);
          completionTl.to(
            dimPaths,
            {
              strokeDashoffset: 0,
              duration: MOTION.building.dimensionDrawDuration,
              ease: MOTION.building.strokeEase,
            },
            0.5,
          );
        }
      }

      // Check immediate initial hash and seek if present
      const initialHash = window.location.hash.slice(1);
      if (initialHash === 'completion') {
        gsap.set(
          [
            foundationGroup,
            structureGroup,
            envelopeGroup,
            fitoutGroup,
            completionGroup,
            dimensionsGroup,
          ].filter(Boolean),
          { opacity: 1, scaleY: 1, strokeDashoffset: 0 },
        );
        gsap.set(columns, { scaleY: 1, opacity: 1 });
        gsap.set(slabs, { scaleX: 1, opacity: 1 });
        gsap.set(windows, { fill: 'var(--color-accent)' });
      }

      ScrollTrigger.refresh();
    },
    { scope: containerRef, dependencies: [mounted, reducedMotion] },
  );

  if (!mounted) {
    return null;
  }

  return (
    <aside
      ref={containerRef}
      className={`building-site-window ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      data-stage={activeStage}
      aria-hidden="true"
    >
      <div className="building-svg-container">
        <svg
          className="building-svg"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          focusable="false"
        >
          <defs>
            {/* 45° Technical Hatch for section cuts */}
            <pattern
              id="hatch-steel"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="var(--color-steel)"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
            </pattern>

            {/* Reusable structural column profile (width 16, height 122) */}
            <symbol id="bldg-col" viewBox="0 0 16 122">
              <rect
                x="0"
                y="0"
                width="16"
                height="122"
                className="bldg-column-stroke"
                vectorEffect="non-scaling-stroke"
              />
            </symbol>

            {/* Reusable window bay unit (width 60, height 75) */}
            <symbol id="bldg-window" viewBox="0 0 60 75">
              <rect
                x="0"
                y="0"
                width="60"
                height="75"
                className="bldg-window-opening"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x="3"
                y="3"
                width="54"
                height="69"
                className="bldg-symbol-glass"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="30"
                y1="0"
                x2="30"
                y2="75"
                className="bldg-window-mullion"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="0"
                y1="38"
                x2="60"
                y2="38"
                className="bldg-window-mullion"
                vectorEffect="non-scaling-stroke"
              />
            </symbol>
          </defs>

          {/* Persistent Ground Datum Line (y = 750) */}
          <line
            x1="60"
            y1="750"
            x2="740"
            y2="750"
            className="bldg-datum-line"
            vectorEffect="non-scaling-stroke"
          />

          {/* STAGE 2: FOUNDATION (Substructure & Earthwork) */}
          <g id="stage-foundation" className="stage-group">
            {/* Stepped excavation perimeter */}
            <path
              d="M 100 750 L 130 840 L 670 840 L 700 750"
              className="bldg-excavation-cut"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            {/* 4 Reinforced Pad Footings */}
            <rect
              x="150"
              y="805"
              width="80"
              height="35"
              className="bldg-footing-outline"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="270"
              y="805"
              width="80"
              height="35"
              className="bldg-footing-outline"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="450"
              y="805"
              width="80"
              height="35"
              className="bldg-footing-outline"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="570"
              y="805"
              width="80"
              height="35"
              className="bldg-footing-outline"
              vectorEffect="non-scaling-stroke"
            />
            {/* Continuous Ground Plinth Tie Beam */}
            <rect
              x="130"
              y="745"
              width="540"
              height="15"
              className="bldg-tie-beam"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* STAGE 3: STRUCTURE (Columns & Slabs) */}
          <g id="stage-structure" className="stage-group">
            {/* Level 1 Columns (y: 628..745) */}
            <use href="#bldg-col" x="182" y="625" className="bldg-col" />
            <use href="#bldg-col" x="302" y="625" className="bldg-col" />
            <use href="#bldg-col" x="482" y="625" className="bldg-col" />
            <use href="#bldg-col" x="602" y="625" className="bldg-col" />

            {/* Level 1 Slab (y = 620) */}
            <rect
              x="160"
              y="617"
              width="480"
              height="10"
              className="bldg-slab bldg-slab-cut"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 2 Columns (y: 498..617) */}
            <use href="#bldg-col" x="182" y="497" className="bldg-col" />
            <use href="#bldg-col" x="302" y="497" className="bldg-col" />
            <use href="#bldg-col" x="482" y="497" className="bldg-col" />
            <use href="#bldg-col" x="602" y="497" className="bldg-col" />

            {/* Level 2 Slab (y = 490) */}
            <rect
              x="160"
              y="487"
              width="480"
              height="10"
              className="bldg-slab bldg-slab-cut"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 3 Columns (y: 368..487) */}
            <use href="#bldg-col" x="182" y="367" className="bldg-col" />
            <use href="#bldg-col" x="302" y="367" className="bldg-col" />
            <use href="#bldg-col" x="482" y="367" className="bldg-col" />
            <use href="#bldg-col" x="602" y="367" className="bldg-col" />

            {/* Level 3 Slab (y = 360) */}
            <rect
              x="160"
              y="357"
              width="480"
              height="10"
              className="bldg-slab bldg-slab-cut"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 4 Columns (y: 250..357) */}
            <use href="#bldg-col" x="182" y="247" className="bldg-col" />
            <use href="#bldg-col" x="302" y="247" className="bldg-col" />
            <use href="#bldg-col" x="482" y="247" className="bldg-col" />
            <use href="#bldg-col" x="602" y="247" className="bldg-col" />

            {/* Roof Slab & Parapet Beam (y = 240) */}
            <rect
              x="160"
              y="237"
              width="480"
              height="12"
              className="bldg-slab bldg-slab-cut"
              vectorEffect="non-scaling-stroke"
            />

            {/* Central Stair Core Shaft (x = 370..430) */}
            <rect
              x="370"
              y="245"
              width="60"
              height="500"
              className="bldg-stair-core"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* STAGE 4: ENVELOPE (Walls & Apertures) */}
          <g id="stage-envelope" className="stage-group">
            {/* Ground Floor Infill Walls */}
            <rect
              x="160"
              y="627"
              width="130"
              height="118"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="510"
              y="627"
              width="130"
              height="118"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 2 Infill Walls */}
            <rect
              x="160"
              y="497"
              width="130"
              height="120"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="510"
              y="497"
              width="130"
              height="120"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 3 Infill Walls */}
            <rect
              x="160"
              y="367"
              width="130"
              height="120"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="510"
              y="367"
              width="130"
              height="120"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />

            {/* Level 4 Infill Walls */}
            <rect
              x="160"
              y="249"
              width="130"
              height="108"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="510"
              y="249"
              width="130"
              height="108"
              className="bldg-wall-infill"
              vectorEffect="non-scaling-stroke"
            />

            {/* Roof Parapet Cap (y = 220) */}
            <rect
              x="155"
              y="222"
              width="490"
              height="15"
              className="bldg-slab-cut"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* STAGE 5: FIT-OUT (Partitions, Windows & Mullions) */}
          <g id="stage-fitout" className="stage-group">
            {/* Level 2 Windows */}
            <use href="#bldg-window" x="205" y="520" className="bldg-window-glass" />
            <use href="#bldg-window" x="535" y="520" className="bldg-window-glass" />

            {/* Level 3 Windows */}
            <use href="#bldg-window" x="205" y="390" className="bldg-window-glass" />
            <use href="#bldg-window" x="535" y="390" className="bldg-window-glass" />

            {/* Level 4 Windows */}
            <use href="#bldg-window" x="205" y="265" className="bldg-window-glass" />
            <use href="#bldg-window" x="535" y="265" className="bldg-window-glass" />

            {/* Ground Bay Glazed Entrance Portal */}
            <rect
              x="320"
              y="630"
              width="160"
              height="115"
              className="bldg-window-opening"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="325"
              y="635"
              width="150"
              height="105"
              className="bldg-window-glass"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="400"
              y1="630"
              x2="400"
              y2="745"
              className="bldg-window-mullion"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="320"
              y1="690"
              x2="480"
              y2="690"
              className="bldg-window-mullion"
              vectorEffect="non-scaling-stroke"
            />

            {/* Stair Flights (Internal Core) */}
            <line
              x1="380"
              y1="745"
              x2="420"
              y2="625"
              className="bldg-stair-core"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="420"
              y1="617"
              x2="380"
              y2="497"
              className="bldg-stair-core"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="380"
              y1="487"
              x2="420"
              y2="367"
              className="bldg-stair-core"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="420"
              y1="357"
              x2="380"
              y2="247"
              className="bldg-stair-core"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* STAGE 6: COMPLETION (Lighting, Dimensions & Nameplate) */}
          <g id="stage-completion" className="stage-group">
            {/* Architectural Entrance Nameplate */}
            <rect
              x="355"
              y="615"
              width="90"
              height="16"
              fill="var(--color-limewash)"
              stroke="var(--color-formwork-dark)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="400"
              y="627"
              textAnchor="middle"
              className="bldg-nameplate"
              vectorEffect="non-scaling-stroke"
            >
              RC / PLOT 104
            </text>

            {/* Entry Access Path */}
            <line
              x1="320"
              y1="755"
              x2="480"
              y2="755"
              stroke="var(--color-formwork-dark)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* Elevation Height Dimension Lines (Amber exclusively) */}
          <g id="stage-dimensions" className="stage-group">
            {/* Top and Bottom Extension Witness Ticks */}
            <line
              x1="655"
              y1="222"
              x2="710"
              y2="222"
              className="bldg-dimension-tick"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="655"
              y1="750"
              x2="710"
              y2="750"
              className="bldg-dimension-tick"
              vectorEffect="non-scaling-stroke"
            />
            {/* Continuous Vertical Dimension Line */}
            <line
              x1="700"
              y1="222"
              x2="700"
              y2="750"
              className="bldg-dimension-line"
              vectorEffect="non-scaling-stroke"
            />
            {/* Dimension Text Badge */}
            <rect
              x="665"
              y="470"
              width="70"
              height="22"
              fill="var(--color-formwork-dark)"
              rx="0"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="700"
              y="485"
              textAnchor="middle"
              className="bldg-dimension-text"
              vectorEffect="non-scaling-stroke"
            >
              15.40 m
            </text>
          </g>
        </svg>
      </div>
    </aside>
  );
}
