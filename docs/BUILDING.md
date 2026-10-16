# RC Constructions — The Building (`docs/BUILDING.md`)

The building is the protagonist. It is one inline SVG in a fixed "site window" that sits beside the text column and is built up as the visitor scrolls (and un-built when they scroll back).

## 1. Layout: site window and page grid

One 12-column grid governs the page (`src/components/SheetStack/SheetStack.css`, `tokens.css`):

| Zone        | Desktop (>= 1024 px)                                                                                                    | Mobile / tablet (< 1024 px)                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Text column | Columns 1-5 (5/12). Content is centred in the zone, max `--text-column-max` (40rem), never closer than the page gutter. | Full width, max 44rem, left aligned.                 |
| Site window | Columns 6-12 (7/12 = 58.33%), fixed, `top: 0`, full `100dvh`, constant `#232622` surface.                               | Fixed band at the top, `--site-band-height` (42svh). |

- The window never changes colour. Sheets (limewash or concrete) slide over the left; the window is layered above them (`--z-site-window`) and is `pointer-events: none`.
- `--column-left` is the left edge of the text column; the header logo and the Hero text align to it.
- The window is shown from Foundation to Completion (`isSiteWindowVisible` in `src/data/stages.ts`). Hero (plan view), Founder and Contact use the full width.
- Sheets carry no labels. Each section's headline (`id="<section>-heading"`) names the landmark.

## 2. Drawing

- Geometry lives in `src/components/Building/geometry.ts` (storeys, bays, windows, slabs, footings, pit, pegs). Change proportions there.
- Four storeys on a four-bay frame, 800 units wide, stair core on the right. `preserveAspectRatio="xMidYMax meet"`; the `viewBox` is chosen in `Building.tsx` by a media query (`VIEWBOXES.desktop`, `VIEWBOXES.mobile`). The drawn building (ground slab width) is about 78% of the window width on desktop and 80% or more of the band width on phones; tests assert at least 70% (1440, 1904, 2560) and 80% (phones).
- The ground line and soil are drawn far beyond the viewBox so they always run the full window width. Mobile band height: `--site-band-height` (`min(max(42svh, nav + 70vw), 52svh)`).
- Solid masses: limewash walls, concrete slabs / columns / core / footings, formwork-dark openings, `#2c302b` soil and glass.
- Line system (CSS vars on `.building-site-window`, `non-scaling-stroke`): heavy section cut 3 px (limewash), medium 2 px (steel), hairline 1 px (steel), dimension lines 1 px (amber). On mobile heavy 2.5 px, medium 1.5 px.
- All strokes must reach 3:1 against the window surface (limewash, concrete, steel or amber only). An e2e test enforces it.
- No gradients, filters, shadows, hatch patterns or translucent colour.

## 3. The six stages (each complete at rest)

| #   | Stage        | Anchor        | What is drawn at rest                                                                                                                                                                                  |
| --- | ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `survey`     | `#hero`       | Hero plan view (window hidden). Hands off to the elevation.                                                                                                                                            |
| 2   | `foundation` | `#foundation` | Stepped excavation (formation level -3.20 m), five footings, stubs, tie beam, ground slab, set-out pegs with profile string, level staff with marks, reinforcement cages (starter bars with stirrups). |
| 3   | `structure`  | `#structure`  | Four storeys, level by level: columns and stair core, then beam and slab. Roof slab last.                                                                                                              |
| 4   | `envelope`   | `#envelope`   | Limewash walls storey by storey, window openings, parapet and coping; excavation backfilled.                                                                                                           |
| 5   | `fitout`     | `#fitout`     | Window frames and mullions, entrance doors and canopy, stair flights in the core slit, railings.                                                                                                       |
| 6   | `completion` | `#completion` | Fifteen windows lit, each one flat amber rectangle, name plate, height and width dimension lines with two sentence-case labels.                                                                        |

## 4. Motion architecture

- The building mounts after `motionGate()` (first input or an anchor in the URL). `Building.tsx` builds one scrubbed timeline per stage, each in its own task (`inOwnTask`), with `scrubStage(sectionId, build)`: `ScrollTrigger` `scrub: true` from `MOTION.building.stageStart` to `stageEnd`. Scrubbing makes every stage reversible and seekable by anchor.
- Use `fromTo` so each stage's start state is applied up front. Do not use GSAP `stagger` with `fromTo` on scrubbed timelines (only the first target gets its start state); use the `staggered` helper (explicit positions).
- Lit windows use a 0.01 s `fromTo` per pane (a flat switch, reversible), never a colour blend over scroll distance.
- All durations, staggers and trigger strings are in `MOTION.building` (`src/lib/motion.ts`).
- Reduced motion: no timelines; the finished, lit building is shown (`data-static="true"` turns the panes amber in CSS).

## 5. Tests

`e2e/phase-11.spec.ts` and `e2e/phase-12.spec.ts` (no broken images, no `//` or placeholder text, quiet portrait slot, readable disabled send button, centred wide layouts): window size and constant surface, mobile band, stage state per anchor and reverse scroll, flat lit windows, reduced-motion state, stroke contrast, no labels, one headline per section, no text under 14 px or uppercase micro-labels, sheets never crop content, amber allowlist, Projects slot, header contrast. `src/styles/banned-patterns.test.ts` checks banned CSS patterns and the amber allowlist in source.
