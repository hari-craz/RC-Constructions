import { useEffect, useRef, useState } from 'react';
import { useProjectPreview } from '../../app/ProjectPreviewContext';
import { getProjectById } from '../../content/projects';
import {
  ABOUT_SECTION,
  COMPLETION_SECTION,
  getSectionById,
  getStageInView,
  isSiteWindowVisible,
  PROCESS_SECTION,
  PROCESS_STEP_STAGES,
  PROJECTS_SECTION,
  STAGES,
  type StageId,
} from '../../data/stages';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScroll } from '../../hooks/useScroll';
import { gsap, inOwnTask, motionGate, useGSAP } from '../../lib/gsap';
import { MOTION } from '../../lib/motion';
import { ProjectPreview } from '../ProjectPreview';
import {
  BAYS,
  BEAM_DEPTH,
  BUILDING_TOP,
  CANOPY,
  COLUMN_LEFTS,
  COLUMN_WIDTH,
  CORE_SLIT,
  DATUM_STAFF,
  ENTRANCE,
  FOOTING,
  FOOTINGS,
  FRAME,
  GROUND_Y,
  NAME_PLATE,
  PANE_INSET,
  PEGS,
  PIT_BOTTOM,
  PIT_POINTS,
  STRING_HEIGHT,
  TIE_BEAM,
  SLAB_THICKNESS,
  SLAB_TOPS,
  STARTER_HEIGHT,
  STOREY_COUNT,
  VIEWBOXES,
  WINDOWS,
  storeyBounds,
  wallBounds,
} from './geometry';
import { centreScroll, sheetEndScroll, sheetTop } from './stageSync';
import './Building.css';

export interface BuildingProps {
  className?: string;
}

const PHONE_QUERY = '(width < 1024px)';
const STOREYS = Array.from({ length: STOREY_COUNT }, (_, s) => s);
const LEFT_ORIGIN = '0% 50%';
const TOP_ORIGIN = '50% 0%';
const BOTTOM_ORIGIN = '50% 100%';

const STAIR_POINTS = Array.from({ length: 7 }, (_, k) => {
  const x = k % 2 === 0 ? CORE_SLIT.x + 6 : CORE_SLIT.x + CORE_SLIT.width - 6;
  return `${x},${CORE_SLIT.y + CORE_SLIT.height - 52 * k}`;
}).join(' ');

/** Reinforcement cage for a column starter: three bars with stirrups every 22 units. */
function starterCage(x: number) {
  let d = '';
  for (const dx of [3, 8, 13]) d += `M${x + dx} ${GROUND_Y}V${GROUND_Y - STARTER_HEIGHT}`;
  for (let y = GROUND_Y - 14; y > GROUND_Y - STARTER_HEIGHT; y -= 22)
    d += `M${x + 3} ${y}H${x + 13}`;
  return d;
}

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
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  const [staticStage, setStaticStage] = useState<StageId>('survey');
  const { reducedMotion } = useScroll();
  const activeSection = useActiveSection();
  const activeSectionRef = useRef(activeSection);
  const isVisible = isSiteWindowVisible(activeSection);

  // Project preview: while Projects is in view and a row is active, the window cross-fades from
  // the finished building to that project's drawing (opacity only, no layout shift)
  const { activeProjectId } = useProjectPreview();
  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined;
  const previewVisible = Boolean(activeProject) && activeSection === PROJECTS_SECTION.sectionId;
  const [shownSlug, setShownSlug] = useState<string | null>(null);
  // Keep the last drawing mounted while it fades out (derived during render, not in an effect)
  if (activeProject && activeProject.slug !== shownSlug) setShownSlug(activeProject.slug);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setPhone(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // The building mounts only once motion is needed (first input or an anchor in the URL),
  // keeping its markup and timelines off the first-paint critical path.
  useEffect(() => {
    let cancelled = false;
    // A short pause keeps the mount out of the same task as the input that opened the gate
    void motionGate()
      .then(() => new Promise((resolve) => setTimeout(resolve, MOTION.motionGate.mountDelayMs)))
      .then(() => {
        if (!cancelled) setMounted(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reduced motion: no scrubbing. The building shows the state for the section (or process step)
  // in view and swaps it without animation.
  useEffect(() => {
    if (!mounted || !reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = getSectionById(activeSectionRef.current)?.sectionId ?? 'hero';
      let stage = getStageInView(section);
      if (section === PROCESS_SECTION.sectionId) {
        const steps = [...document.querySelectorAll<HTMLElement>('.process-step-item')];
        const mid = window.innerHeight / 2;
        let best = 0;
        let bestDistance = Infinity;
        steps.forEach((step, i) => {
          const r = step.getBoundingClientRect();
          const distance = Math.abs(r.top + r.height / 2 - mid);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        stage = PROCESS_STEP_STAGES[best]?.stage ?? 'structure';
      }
      setStaticStage(stage);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    document.documentElement.dataset.windowIn = 'true';
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      delete document.documentElement.dataset.windowIn;
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mounted, reducedMotion]);

  useGSAP(
    (context) => {
      if (!mounted || reducedMotion || !containerRef.current) return;
      let cancelled = false;

      const root = containerRef.current;
      const all = (selector: string) => gsap.utils.toArray<SVGElement>(selector, root);
      const styles = getComputedStyle(document.documentElement);
      const amber = styles.getPropertyValue('--color-work-lamp-amber').trim();
      const raised = styles.getPropertyValue('--color-surface-raised').trim();
      const B = MOTION.building;
      const section = (id: string) => document.getElementById(id) as HTMLElement;

      // Site camera: lifted and enlarged for the foundation, settling to rest during the structure
      const camera = root.querySelector<SVGGElement>('.b-camera');
      const cameraView = phone ? VIEWBOXES.mobile : VIEWBOXES.desktop;
      const cameraLift = phone ? B.siteCameraLiftPhone : B.siteCameraLiftDesktop;
      // Scale about the middle of the ground line; k runs 1 (foundation frame) to 0 (rest frame).
      // Written straight to the group's transform so the origin is exact in viewBox units.
      const originX = cameraView.x + cameraView.width / 2;
      const applyCamera = (k: number) => {
        const scale = 1 + (B.siteCameraScale - 1) * k;
        const tx = originX * (1 - scale);
        const ty = GROUND_Y * (1 - scale) - cameraLift * k;
        camera?.setAttribute('transform', `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`);
      };
      applyCamera(1);

      root.dataset.stage = 'survey';
      root.dataset.stageProgress = '0';
      root.dataset.buildProgress = '0';
      root.dataset.partProgress = '0,0,0,0,0,0,0';

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

      // Progress of every scrubbed part, published as data-stage, data-stage-progress and
      // data-build-progress so tests (and styles) can follow the build.
      const partProgress = new Map<string, number>();
      const stageProgress = (id: StageId, parts: number) => {
        let sum = 0;
        for (let i = 0; i < parts; i++) sum += partProgress.get(`${id}:${i}`) ?? 0;
        return sum / parts;
      };
      const publish = () => {
        const built = STAGES.filter((s) => s.parts > 0);
        let current: StageId = 'survey';
        let currentProgress = 0;
        for (const stage of built) {
          const p = stageProgress(stage.id, stage.parts);
          if (p >= 0.999) {
            current = stage.id;
            currentProgress = 1;
            continue;
          }
          if (p > 0.001) {
            current = stage.id;
            currentProgress = p;
          }
          break;
        }
        let total = 0;
        let parts = 0;
        for (const stage of built) {
          parts += stage.parts;
          total += stageProgress(stage.id, stage.parts) * stage.parts;
        }
        root.dataset.stage = current;
        root.dataset.stageProgress = currentProgress.toFixed(3);
        root.dataset.buildProgress = (total / parts).toFixed(3);
        root.dataset.partProgress = built
          .flatMap((stage) =>
            Array.from({ length: stage.parts }, (_, i) =>
              (partProgress.get(`${stage.id}:${i}`) ?? 0).toFixed(3),
            ),
          )
          .join(',');
      };

      const markWindowIn = (arrived: boolean) => {
        document.documentElement.dataset.windowIn = arrived ? 'true' : 'false';
      };

      const vh = () => window.innerHeight;
      // Scroll position at which an element's box is centred in the viewport, capped at the
      // point where its sheet is fully scrolled (the sheet then stays pinned).
      const centred = (el: HTMLElement) => Math.min(centreScroll(el), sheetEndScroll(el));

      const aboutSheet = () => section(ABOUT_SECTION.sectionId);
      const processSheet = () => section(PROCESS_SECTION.sectionId);
      const completionSheet = () => section(COMPLETION_SECTION.sectionId);
      const steps = () => [...processSheet().querySelectorAll<HTMLElement>('.process-step-item')];

      // Contiguous scroll ranges: each part starts where the previous one ends, and ends when
      // its text is centred, so a stage never finishes before its text is read and never sits
      // idle while a mapped section scrolls.
      const foundationRange = (): [number, number] => {
        const start = sheetTop(aboutSheet()) - vh() * B.windowEnterViewport;
        return [start, Math.max(centred(aboutSheet()), start + 1)];
      };
      const stepRanges = () => {
        const out: [number, number][] = [];
        let start = foundationRange()[1];
        for (const step of steps()) {
          const end = Math.max(centred(step), start + 1);
          out.push([start, end]);
          start = end;
        }
        return out;
      };
      // A part drawn by process steps `from` to `to` (inclusive, zero based)
      const stepSpan = (from: number, to: number): [number, number] => {
        const ranges = stepRanges();
        const first = ranges[from] ?? foundationRange();
        const last = ranges[to] ?? first;
        return [first[0], Math.max(last[1], first[0] + 1)];
      };
      // Work delivered: first the plate and dimension lines (from the end of the last step until
      // its headline is centred), then the windows are lit (headline centred until the sheet is)
      const completionPlateRange = (): [number, number] => {
        const ranges = stepRanges();
        const start = ranges[ranges.length - 1]?.[1] ?? foundationRange()[1];
        const heading = document.getElementById(`${COMPLETION_SECTION.sectionId}-heading`);
        const end = heading ? centreScroll(heading) : centred(completionSheet());
        return [start, Math.max(end, start + 1)];
      };
      const completionWindowsRange = (): [number, number] => {
        const start = completionPlateRange()[1];
        return [start, Math.max(centred(completionSheet()), start + 1)];
      };

      // Each part's timeline is built in its own task, so setup never forms one long task
      const scrubPart = (
        key: string,
        range: () => [number, number],
        build: (tl: gsap.core.Timeline) => void,
      ) => {
        void inOwnTask(() => {
          if (cancelled) return;
          context.add(() => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: root,
                start: () => range()[0],
                end: () => range()[1],
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  partProgress.set(key, self.progress);
                  publish();
                },
                onRefresh: (self) => {
                  partProgress.set(key, self.progress);
                  publish();
                },
              },
            });
            build(tl);
          });
        });
      };

      // Window hand-off: the survey plot fades out first, then the window slides in from the
      // right edge (from the top on phones), so no moving edge ever cuts the drawn plot.
      void inOwnTask(() => {
        if (cancelled) return;
        context.add(() => {
          gsap.set(root, { clearProps: 'transform' });
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: () => sheetTop(aboutSheet()) - vh(),
              end: () => sheetTop(aboutSheet()),
              scrub: true,
              invalidateOnRefresh: true,
              // The header takes its window colours only once the window has fully arrived
              onUpdate: (self) => markWindowIn(self.progress >= 0.98),
              onRefresh: (self) => markWindowIn(self.progress >= 0.98),
            },
          });
          const plot = document.querySelector('.hero-plot-container');
          if (phone) {
            // The band rides up with the top edge of the arriving sheet, filling the space the
            // sheet reserves for it, so no empty area ever shows while the sheet arrives
            // The plot fades over the whole hand-off, so the hero never shows as an empty slab
            tl.to(plot, { opacity: 0, duration: 1, ease: 'none' }, 0).fromTo(
              root,
              { y: () => vh() },
              { y: 0, duration: 1, ease: 'none' },
              0,
            );
          } else {
            tl.to(plot, { opacity: 0, duration: B.plotFadeShare, ease: 'none' }, 0).fromTo(
              root,
              { xPercent: 100 },
              { xPercent: 0, duration: 1 - B.plotFadeShare, ease: 'none' },
              B.plotFadeShare,
            );
          }
          root.dataset.sync = 'true';
        });
      });

      // Stage 2a: Foundation, part 0 (About): excavation and set-out pegs
      scrubPart('foundation:0', foundationRange, (tl) => {
        tl.fromTo(
          all('.b-pit'),
          { scaleY: 0, transformOrigin: TOP_ORIGIN },
          { scaleY: 1, duration: B.digDuration, ease: B.strokeEase },
          0,
        );
        staggered(
          tl,
          all('.b-peg'),
          { opacity: 0 },
          { opacity: 1, duration: B.memberDuration, ease: B.fillEase },
          0,
          B.memberStagger,
        );
      });

      // Stage 2b: Foundation, part 1 (process steps 1 to 3, the pre-construction steps):
      // footings, stubs and tie beam, starter bars, ground slab, level marks
      scrubPart(
        'foundation:1',
        () => stepSpan(0, 2),
        (tl) => {
          staggered(
            tl,
            all('.b-footing'),
            { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
            { scaleY: 1, duration: B.footingDuration, ease: B.strokeEase },
            0,
            B.footingStagger,
          );
          staggered(
            tl,
            all('.b-stub, .b-tie'),
            { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
            { scaleY: 1, duration: B.memberDuration, ease: B.strokeEase },
            B.footingDuration,
            B.memberStagger,
          );
          staggered(
            tl,
            all('.b-starter'),
            { scaleY: 0, transformOrigin: BOTTOM_ORIGIN },
            { scaleY: 1, duration: B.memberDuration, ease: B.strokeEase },
            B.footingDuration + B.memberDuration,
            B.starterStagger,
          );
          tl.fromTo(
            all('.b-ground-slab'),
            { scaleX: 0, transformOrigin: LEFT_ORIGIN },
            { scaleX: 1, duration: B.memberDuration, ease: B.strokeEase },
            B.footingDuration + B.memberDuration,
          );
          staggered(
            tl,
            all('.b-datum'),
            { opacity: 0 },
            { opacity: 1, duration: B.memberDuration, ease: B.fillEase },
            B.footingDuration + B.memberDuration,
            B.memberStagger,
          );
        },
      );

      // Stage 3: Structure (process step 4): level by level, columns and core, then beams and slab
      scrubPart(
        'structure:0',
        () => stepSpan(3, 3),
        (tl) => {
          STOREYS.forEach((s, i) => {
            const at = i * B.levelStagger;
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
          const cameraTween = { k: 1 };
          tl.fromTo(
            cameraTween,
            { k: 1 },
            {
              k: 0,
              duration: tl.duration(),
              ease: 'none',
              onUpdate: () => applyCamera(cameraTween.k),
            },
            0,
          );
        },
      );

      // Stage 4: Envelope (process step 5): walls rise storey by storey with their openings, then
      // the parapet; the excavation is backfilled and the profile string comes down
      scrubPart(
        'envelope:0',
        () => stepSpan(4, 4),
        (tl) => {
          STOREYS.forEach((s, i) => {
            const at = i * B.wallStagger;
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
            STOREYS.length * B.wallStagger + B.wallDuration,
            B.wallStagger,
          );
          tl.to(all('.b-pit'), { fill: raised, duration: B.wallDuration, ease: B.fillEase }, 0);
          tl.to(all('.b-string'), { opacity: 0, duration: B.wallDuration, ease: B.fillEase }, 0);
        },
      );

      // Stage 5: Fit-out (process step 6): window frames and railings, then entrance, canopy
      // and stair
      scrubPart(
        'fitout:0',
        () => stepSpan(5, 5),
        (tl) => {
          const first = all('.b-fit[data-fit="a"]');
          staggered(
            tl,
            first,
            { opacity: 0 },
            { opacity: 1, duration: B.detailDuration, ease: B.fillEase },
            0,
            B.detailStagger,
          );
          staggered(
            tl,
            all('.b-fit[data-fit="b"]'),
            { opacity: 0 },
            { opacity: 1, duration: B.detailDuration, ease: B.fillEase },
            first.length * B.detailStagger,
            B.detailStagger,
          );
        },
      );

      // Stage 6a: Completion, part 0: name plate and the dimension lines
      scrubPart('completion:0', completionPlateRange, (tl) => {
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

      // Stage 6b: Completion, part 1: every window lit (a flat amber rectangle, never a blended or
      // translucent tint), only once the Work delivered headline is centred
      scrubPart('completion:1', completionWindowsRange, (tl) => {
        all('.b-pane').forEach((pane, i) => {
          tl.fromTo(
            pane,
            { fill: raised },
            { fill: amber, duration: B.windowSwitchDuration, ease: 'none' },
            i * B.windowLitStagger,
          );
        });
      });

      return () => {
        cancelled = true;
      };
    },
    { scope: containerRef, dependencies: [mounted, reducedMotion, phone] },
  );

  if (!mounted) return null;

  const view = phone ? VIEWBOXES.mobile : VIEWBOXES.desktop;
  const frameWidth = FRAME.right - FRAME.left;
  const dimX = FRAME.right + 28;
  const dimWidthY = BUILDING_TOP - 34;

  return (
    <aside
      ref={containerRef}
      className={`building-site-window ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      data-stage={reducedMotion ? staticStage : undefined}
      data-static={reducedMotion ? 'true' : undefined}
      data-preview={previewVisible ? 'true' : 'false'}
      aria-hidden="true"
    >
      <svg
        className="building-svg"
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio="xMidYMax meet"
        role="presentation"
        focusable="false"
      >
        <g className="b-camera">
          {/* Ground: soil mass and the ground line run the full width of the window */}
          <rect className="b-soil" x={-4000} y={GROUND_Y} width={9000} height={4000} />
          <line className="b-ground-line" x1={-4000} y1={GROUND_Y} x2={5000} y2={GROUND_Y} />

          {/* STAGE 2: FOUNDATION */}
          <g id="stage-foundation" className="stage-group">
            <polygon className="b-pit" points={PIT_POINTS.map((pt) => pt.join(',')).join(' ')} />
            <line
              className="b-string"
              x1={PEGS[0].x}
              x2={PEGS[1].x}
              y1={GROUND_Y - STRING_HEIGHT}
              y2={GROUND_Y - STRING_HEIGHT}
            />
            {PEGS.map((peg) => (
              <g key={peg.x} className="b-peg">
                <rect x={peg.x - 3} y={GROUND_Y - peg.height} width={6} height={peg.height + 14} />
                <rect x={peg.x - 16} y={GROUND_Y - peg.height} width={32} height={6} />
              </g>
            ))}
            <g className="b-datum">
              <line
                x1={DATUM_STAFF.x}
                y1={GROUND_Y}
                x2={DATUM_STAFF.x}
                y2={GROUND_Y - DATUM_STAFF.height}
              />
              {Array.from({ length: DATUM_STAFF.height / DATUM_STAFF.tickGap }, (_, i) => (
                <line
                  key={i}
                  x1={DATUM_STAFF.x}
                  x2={DATUM_STAFF.x + (i % 2 === 0 ? 16 : 9)}
                  y1={GROUND_Y - (i + 1) * DATUM_STAFF.tickGap}
                  y2={GROUND_Y - (i + 1) * DATUM_STAFF.tickGap}
                />
              ))}
              <text className="b-level-label" x={DATUM_STAFF.x - 6} y={GROUND_Y + 36}>
                0.00 m
              </text>
              <text className="b-level-label" x={DATUM_STAFF.x - 6} y={PIT_BOTTOM - 6}>
                -3.20 m
              </text>
            </g>
            {COLUMN_LEFTS.map((x) => (
              <path key={x} className="b-starter" d={starterCage(x)} />
            ))}
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
              y={TIE_BEAM.y}
              width={FRAME.coreLeft - COLUMN_LEFTS[0]}
              height={TIE_BEAM.height}
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
              <g key={`f${w.id}`} className="b-fit" data-fit="a">
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
                <line
                  className="b-mullion"
                  x1={w.x}
                  y1={w.y + 20}
                  x2={w.x + w.width}
                  y2={w.y + 20}
                />
              </g>
            ))}
            <g className="b-fit" data-fit="b">
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
            <g className="b-fit" data-fit="b">
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
              <path key={r.id} className="b-fit b-rail" data-fit="a" d={r.d} />
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
              y={dimWidthY + 18}
              textAnchor="middle"
            >
              17.40 m
            </text>
          </g>
        </g>
      </svg>
      <div className="building-preview" aria-hidden="true">
        {shownSlug && <ProjectPreview slug={shownSlug} />}
      </div>
    </aside>
  );
}
