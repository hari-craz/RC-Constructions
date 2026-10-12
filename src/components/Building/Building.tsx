import { useEffect, useRef, useState } from 'react';
import { getStageBySectionId, isSiteWindowVisible, type StageId } from '../../data/stages';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScroll } from '../../hooks/useScroll';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import {
  BAYS,
  BEAM_DEPTH,
  BUILDING_TOP,
  CANOPY,
  COLUMN_LEFTS,
  COLUMN_WIDTH,
  CORE_SLIT,
  ENTRANCE,
  FOOTING,
  FOOTINGS,
  FRAME,
  GROUND_Y,
  NAME_PLATE,
  PANE_INSET,
  PIT,
  SLAB_THICKNESS,
  SLAB_TOPS,
  STOREY_COUNT,
  VIEWBOX,
  WINDOWS,
  storeyBounds,
  wallBounds,
} from './geometry';
import './Building.css';

export interface BuildingProps {
  className?: string;
}

const STOREYS = Array.from({ length: STOREY_COUNT }, (_, s) => s);
const LEFT_ORIGIN = '0% 50%';
const TOP_ORIGIN = '50% 0%';
const BOTTOM_ORIGIN = '50% 100%';

const STAIR_POINTS = Array.from({ length: 7 }, (_, k) => {
  const x = k % 2 === 0 ? CORE_SLIT.x + 6 : CORE_SLIT.x + CORE_SLIT.width - 6;
  return `${x},${CORE_SLIT.y + CORE_SLIT.height - 52 * k}`;
}).join(' ');

const RAILINGS = WINDOWS.filter((w) => w.storey > 0).map((w) => {
  const rail = w.y + 36;
  const left = w.x - 6;
  const right = w.x + w.width + 6;
  let posts = '';
  for (let x = left; x <= right; x += 13) posts += `M${x} ${rail}V${w.y + w.height + 6}`;
  return { id: w.id, d: `M${left} ${rail}H${right}${posts}` };
});

export function Building({ className = '' }: BuildingProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const { reducedMotion } = useScroll();
  const activeSection = useActiveSection();

  const stageFromSection = getStageBySectionId(activeSection);
  const activeStage: StageId = stageFromSection
    ? stageFromSection.id
    : activeSection === 'contact' || activeSection === 'founder'
      ? 'completion'
      : 'survey';
  const isVisible = isSiteWindowVisible(activeSection);

  // Lazy mount after initial idle period to stay completely off the Hero LCP critical path
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
    } else {
      timeoutId = setTimeout(() => setMounted(true), 500);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  useGSAP(
    () => {
      if (!mounted || reducedMotion || !containerRef.current) return;

      const root = containerRef.current;
      const all = (selector: string) => gsap.utils.toArray<SVGElement>(selector, root);
      const styles = getComputedStyle(document.documentElement);
      const amber = styles.getPropertyValue('--color-work-lamp-amber').trim();
      const raised = styles.getPropertyValue('--color-surface-raised').trim();
      const B = MOTION.building;

      // Staggered fromTo tweens only render their first target's start state up front, so a
      // stagger is laid out as explicit per-element positions on the scrubbed timeline.
      const staggered = (
        tl: gsap.core.Timeline,
        targets: SVGElement[],
        from: gsap.TweenVars,
        to: gsap.TweenVars,
        at: number,
        step: number,
      ) => {
        targets.forEach((target, i) => tl.fromTo(target, from, to, at + i * step));
      };

      const scrubStage = (sectionId: string, build: (tl: gsap.core.Timeline) => void) => {
        const trigger = document.getElementById(sectionId);
        if (!trigger) return;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger,
            start: B.stageStart,
            end: B.stageEnd,
            scrub: true,
          },
        });
        build(tl);
      };

      // Stage 2: Foundation — excavation, footings, plinth, ground slab
      scrubStage('foundation', (tl) => {
        tl.fromTo(
          all('.b-pit'),
          { scaleY: 0, transformOrigin: TOP_ORIGIN },
          { scaleY: 1, duration: B.digDuration, ease: B.strokeEase },
          0,
        ).fromTo(
          all('.b-ground-slab'),
          { scaleX: 0, transformOrigin: LEFT_ORIGIN },
          { scaleX: 1, duration: B.memberDuration, ease: B.strokeEase },
          B.digDuration + B.footingDuration + B.memberDuration,
        );
        staggered(
          tl,
          all('.b-footing'),
          { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
          { scaleY: 1, duration: B.footingDuration, ease: B.strokeEase },
          B.digDuration,
          B.footingStagger,
        );
        staggered(
          tl,
          all('.b-stub, .b-tie'),
          { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
          { scaleY: 1, duration: B.memberDuration, ease: B.strokeEase },
          B.digDuration + B.footingDuration,
          B.memberStagger,
        );
      });

      // Stage 3: Structure — level by level: columns and core, then slab and beam
      scrubStage('structure', (tl) => {
        STOREYS.forEach((s) => {
          const at = s * B.levelStagger;
          tl.fromTo(
            all(`.b-level[data-level="${s}"] .b-col, .b-level[data-level="${s}"] .b-core`),
            { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
            { scaleY: 1, duration: B.levelDuration, ease: B.strokeEase },
            at,
          ).fromTo(
            all(`.b-level[data-level="${s}"] .b-slab, .b-level[data-level="${s}"] .b-beam`),
            { scaleX: 0, transformOrigin: LEFT_ORIGIN },
            { scaleX: 1, duration: B.levelDuration, ease: B.strokeEase },
            at + B.levelDuration * 0.6,
          );
        });
      });

      // Stage 4: Envelope — walls rise storey by storey, openings, parapet, backfill
      scrubStage('envelope', (tl) => {
        STOREYS.forEach((s) => {
          const at = s * B.wallStagger;
          tl.fromTo(
            all(`.b-wall[data-storey="${s}"]`),
            { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
            { scaleY: 1, duration: B.wallDuration, ease: B.strokeEase },
            at,
          ).fromTo(
            all(`.b-opening[data-storey="${s}"]`),
            { opacity: 0 },
            { opacity: 1, duration: B.wallDuration, ease: B.fillEase },
            at + B.wallDuration,
          );
        });
        staggered(
          tl,
          all('.b-parapet'),
          { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
          { scaleY: 1, duration: B.wallDuration, ease: B.strokeEase },
          STOREY_COUNT * B.wallStagger + B.wallDuration,
          B.wallStagger,
        );
        tl.to(all('.b-pit'), { fill: raised, duration: B.wallDuration, ease: B.fillEase }, 0);
      });

      // Stage 5: Fit-out — frames, mullions, doors, stair flights, railings
      scrubStage('fitout', (tl) => {
        staggered(
          tl,
          all('.b-fit'),
          { opacity: 0 },
          { opacity: 1, duration: B.detailDuration, ease: B.fillEase },
          0,
          B.detailStagger,
        );
      });

      // Stage 6: Completion — every window lit (flat amber), name plate, dimensions
      scrubStage('completion', (tl) => {
        // Each window switches on as one flat amber rectangle; never a blended or translucent tint
        all('.b-pane').forEach((pane, i) => {
          tl.fromTo(
            pane,
            { fill: raised },
            { fill: amber, duration: B.windowSwitchDuration, ease: 'none' },
            i * B.windowLitStagger,
          );
        });
        tl.fromTo(
          all('.b-plate'),
          { opacity: 0 },
          { opacity: 1, duration: B.detailDuration, ease: B.fillEase },
          0,
        )
          .fromTo(
            all('.b-dim-vertical'),
            { scaleY: 0, transformOrigin: TOP_ORIGIN },
            { scaleY: 1, duration: B.dimensionDrawDuration, ease: B.strokeEase },
            B.dimensionLabelDelay,
          )
          .fromTo(
            all('.b-dim-horizontal'),
            { scaleX: 0, transformOrigin: LEFT_ORIGIN },
            { scaleX: 1, duration: B.dimensionDrawDuration, ease: B.strokeEase },
            B.dimensionLabelDelay,
          )
          .fromTo(
            all('.b-dim-label, .b-dim-tick'),
            { opacity: 0 },
            { opacity: 1, duration: B.detailDuration, ease: B.fillEase },
            B.dimensionLabelDelay + B.dimensionDrawDuration,
          );
      });
    },
    { scope: containerRef, dependencies: [mounted, reducedMotion] },
  );

  if (!mounted) return null;

  const frameWidth = FRAME.right - FRAME.left;
  const dimX = FRAME.right + 28;
  const dimWidthY = BUILDING_TOP - 36;

  return (
    <aside
      ref={containerRef}
      className={`building-site-window ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      data-stage={activeStage}
      data-static={reducedMotion ? 'true' : undefined}
      aria-hidden="true"
    >
      <svg
        className="building-svg"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        preserveAspectRatio="xMidYMax slice"
        role="presentation"
        focusable="false"
      >
        {/* Ground: soil mass and the ground line run the full width of the window */}
        <rect className="b-soil" x={-400} y={GROUND_Y} width={2000} height={400} />
        <line className="b-ground-line" x1={-400} y1={GROUND_Y} x2={1600} y2={GROUND_Y} />

        {/* STAGE 2: FOUNDATION */}
        <g id="stage-foundation" className="stage-group">
          <polygon
            className="b-pit"
            points={`${PIT.topLeft},${GROUND_Y} ${PIT.bottomLeft},${GROUND_Y + PIT.depth} ${PIT.bottomRight},${GROUND_Y + PIT.depth} ${PIT.topRight},${GROUND_Y}`}
          />
          {FOOTINGS.map((f) => (
            <rect
              key={f.x}
              className="b-footing"
              x={f.x}
              y={FOOTING.top}
              width={f.width}
              height={FOOTING.height}
            />
          ))}
          {COLUMN_LEFTS.map((x) => (
            <rect
              key={x}
              className="b-stub"
              x={x}
              y={GROUND_Y}
              width={COLUMN_WIDTH}
              height={FOOTING.top - GROUND_Y}
            />
          ))}
          <rect
            className="b-stub"
            x={FRAME.coreLeft + 10}
            y={GROUND_Y}
            width={FRAME.right - FRAME.coreLeft - 20}
            height={FOOTING.top - GROUND_Y}
          />
          <rect
            className="b-tie"
            x={COLUMN_LEFTS[0]}
            y={GROUND_Y + 22}
            width={FRAME.coreLeft - COLUMN_LEFTS[0]}
            height={16}
          />
          <rect
            className="b-ground-slab"
            x={FRAME.left - 4}
            y={SLAB_TOPS[0]}
            width={frameWidth + 8}
            height={SLAB_THICKNESS}
          />
        </g>

        {/* STAGE 4: ENVELOPE (drawn behind the frame) */}
        <g id="stage-envelope" className="stage-group">
          {STOREYS.flatMap((s) => {
            const wall = wallBounds(s);
            return BAYS.map((bay, i) => (
              <rect
                key={`w${s}${i}`}
                className="b-wall"
                data-storey={s}
                x={bay.left}
                y={wall.top}
                width={bay.right - bay.left}
                height={wall.height}
              />
            ));
          })}
          {WINDOWS.map((w) => (
            <rect
              key={`o${w.id}`}
              className="b-opening"
              data-storey={w.storey}
              x={w.x}
              y={w.y}
              width={w.width}
              height={w.height}
            />
          ))}
          <rect
            className="b-opening"
            data-storey={0}
            x={ENTRANCE.x}
            y={ENTRANCE.y}
            width={ENTRANCE.width}
            height={ENTRANCE.height}
          />
          <rect
            className="b-parapet b-parapet-wall"
            x={FRAME.left}
            y={SLAB_TOPS[4] - 20}
            width={frameWidth}
            height={20}
          />
          <rect
            className="b-parapet b-parapet-cap"
            x={FRAME.left - 6}
            y={BUILDING_TOP}
            width={frameWidth + 12}
            height={6}
          />
        </g>

        {/* STAGE 3: STRUCTURE */}
        <g id="stage-structure" className="stage-group">
          {STOREYS.map((s) => {
            const { ceiling, height } = storeyBounds(s);
            const slabTop = SLAB_TOPS[s + 1] as number;
            const roof = s === STOREY_COUNT - 1;
            return (
              <g key={s} className="b-level" data-level={s}>
                {COLUMN_LEFTS.map((x) => (
                  <rect
                    key={x}
                    className="b-col"
                    x={x}
                    y={ceiling}
                    width={COLUMN_WIDTH}
                    height={height}
                  />
                ))}
                <rect
                  className="b-core"
                  x={FRAME.coreLeft}
                  y={ceiling}
                  width={FRAME.right - FRAME.coreLeft}
                  height={height}
                />
                <rect
                  className="b-beam"
                  x={FRAME.left}
                  y={ceiling}
                  width={FRAME.coreLeft - FRAME.left}
                  height={BEAM_DEPTH}
                />
                <rect
                  className="b-slab"
                  x={FRAME.left - (roof ? 8 : 4)}
                  y={slabTop}
                  width={frameWidth + (roof ? 16 : 8)}
                  height={SLAB_THICKNESS}
                />
              </g>
            );
          })}
        </g>

        {/* STAGE 5: FIT-OUT */}
        <g id="stage-fitout" className="stage-group">
          {WINDOWS.map((w) => (
            <g key={`f${w.id}`} className="b-fit">
              <rect
                className="b-pane"
                x={w.x + PANE_INSET}
                y={w.y + PANE_INSET}
                width={w.width - PANE_INSET * 2}
                height={w.height - PANE_INSET * 2}
              />
              <rect className="b-frame" x={w.x} y={w.y} width={w.width} height={w.height} />
              <line
                className="b-mullion"
                x1={w.x + w.width / 2}
                y1={w.y}
                x2={w.x + w.width / 2}
                y2={w.y + w.height}
              />
              <line className="b-mullion" x1={w.x} y1={w.y + 20} x2={w.x + w.width} y2={w.y + 20} />
            </g>
          ))}
          <g className="b-fit">
            <rect
              className="b-frame"
              x={ENTRANCE.x}
              y={ENTRANCE.y}
              width={ENTRANCE.width}
              height={ENTRANCE.height}
            />
            <rect
              className="b-door"
              x={ENTRANCE.x + 5}
              y={ENTRANCE.y + 5}
              width={ENTRANCE.width / 2 - 7}
              height={ENTRANCE.height - 5}
            />
            <rect
              className="b-door"
              x={ENTRANCE.x + ENTRANCE.width / 2 + 2}
              y={ENTRANCE.y + 5}
              width={ENTRANCE.width / 2 - 7}
              height={ENTRANCE.height - 5}
            />
            <rect
              className="b-canopy"
              x={CANOPY.x}
              y={CANOPY.y}
              width={CANOPY.width}
              height={CANOPY.height}
            />
          </g>
          <g className="b-fit">
            <rect
              className="b-opening b-slit"
              x={CORE_SLIT.x}
              y={CORE_SLIT.y}
              width={CORE_SLIT.width}
              height={CORE_SLIT.height}
            />
            <polyline className="b-stair" points={STAIR_POINTS} />
          </g>
          {RAILINGS.map((r) => (
            <path key={r.id} className="b-fit b-rail" d={r.d} />
          ))}
        </g>

        {/* STAGE 6: COMPLETION — name plate */}
        <g id="stage-completion" className="stage-group">
          <g className="b-plate">
            <rect
              className="b-plate-box"
              x={NAME_PLATE.x}
              y={NAME_PLATE.y}
              width={NAME_PLATE.width}
              height={NAME_PLATE.height}
            />
            <text
              className="b-plate-text"
              x={NAME_PLATE.x + NAME_PLATE.width / 2}
              y={NAME_PLATE.y + NAME_PLATE.height / 2 + 5}
              textAnchor="middle"
            >
              RC Constructions
            </text>
          </g>
        </g>

        {/* Dimension lines: amber hairlines with two sentence-case labels */}
        <g id="stage-dimensions" className="stage-group">
          <line
            className="b-dim b-dim-vertical"
            x1={dimX}
            y1={BUILDING_TOP}
            x2={dimX}
            y2={GROUND_Y}
          />
          <line
            className="b-dim b-dim-tick"
            x1={dimX - 12}
            y1={BUILDING_TOP}
            x2={dimX + 12}
            y2={BUILDING_TOP}
          />
          <line
            className="b-dim b-dim-tick"
            x1={dimX - 12}
            y1={GROUND_Y}
            x2={dimX + 12}
            y2={GROUND_Y}
          />
          <text className="b-dim-label" x={dimX + 10} y={(BUILDING_TOP + GROUND_Y) / 2}>
            15.40 m
          </text>
          <line
            className="b-dim b-dim-horizontal"
            x1={FRAME.left}
            y1={dimWidthY}
            x2={FRAME.right}
            y2={dimWidthY}
          />
          <line
            className="b-dim b-dim-tick"
            x1={FRAME.left}
            y1={dimWidthY - 12}
            x2={FRAME.left}
            y2={dimWidthY + 12}
          />
          <line
            className="b-dim b-dim-tick"
            x1={FRAME.right}
            y1={dimWidthY - 12}
            x2={FRAME.right}
            y2={dimWidthY + 12}
          />
          <text
            className="b-dim-label"
            x={(FRAME.left + FRAME.right) / 2}
            y={dimWidthY - 12}
            textAnchor="middle"
          >
            17.40 m
          </text>
        </g>
      </svg>
    </aside>
  );
}
