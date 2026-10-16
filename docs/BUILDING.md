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

## 3. Section order and stage map (Phase 14)

The text and the building tell one story. Section ids never change (old links keep working); only the order did.

| Page order | Section (id)                     | Window | The building draws                                                               |
| ---------- | -------------------------------- | ------ | -------------------------------------------------------------------------------- |
| 1          | Hero (`#hero`)                   | no     | Survey plan view; it fades out, then the window slides in.                       |
| 2          | About (`#foundation`)            | yes    | Foundation: excavation, footings, plinth, ground slab, set-out pegs.             |
| 3          | Construction process (`#fitout`) | yes    | Six steps, each its own scrubbed part (below).                                   |
| 4          | Work delivered (`#completion`)   | yes    | Completion: lit windows, name plate, dimension lines.                            |
| 5          | Services (`#structure`)          | yes    | Finished building (nothing left to build).                                       |
| 6          | Projects (`#envelope`)           | yes    | Finished building, or the drawing of the project row that is hovered or focused. |
| 7          | Founder (`#founder`)             | no     | Full width.                                                                      |
| 8          | Contact (`#contact`)             | no     | Full width.                                                                      |

Process step to building part (`PROCESS_STEP_STAGES` in `src/data/stages.ts`): steps 1 and 2 draw the structure (storeys 0-1, then 2-3), steps 3 and 4 the envelope (walls and openings storeys 0-1, then 2-3 with parapet, backfill and string), steps 5 and 6 the fit-out (windows and rails, then entrance, slit and stair). There are eight scrubbed parts in all: foundation 1, structure 2, envelope 2, fit-out 2, completion 1.

### Sync rules

Ranges are bound to section bounding boxes (`src/components/Building/stageSync.ts`: `sheetTop`, `centreScroll`, `sheetEndScroll`), not to fixed scroll distances, so a change in copy length cannot desynchronise them.

1. A part never finishes before its text is centred in the viewport (a step that cannot reach the centre because its sheet ends first finishes when the sheet is fully scrolled).
2. A part never starts before the previous one is complete (ranges are contiguous: each starts where the last ended).
3. The building is never static for more than one step-height of scroll while a mapped section scrolls.
4. Reverse scrolling un-builds exactly (scrubbed, no snap), and anchor jumps land on the same state as scrolling there (function-based `start` and `end` with `invalidateOnRefresh`).

State is published on the window for tests and styles: `data-stage` (the stage in progress), `data-stage-progress` (0-1 within it), `data-build-progress` (0-1 overall), `data-part-progress` (eight comma-separated values), `data-preview`, and `data-static` under reduced motion. The header takes its window colours only when the window has fully arrived (`data-window-in` on `<html>`).

### Hero to window hand-off

One scrubbed timeline from the foundation sheet entering the viewport (`windowEnterViewport`) to its top edge reaching the top: the plot (`.hero-plot-container`) fades out over the first `plotFadeShare` of it, and only then does the window slide in (from the right on desktop, from the top on phones). No moving edge ever crosses the drawn plot.

### Reduced motion and no JavaScript

Reduced motion: no scrub. State swaps on entry to a section; in the Process the step nearest the viewport centre decides the stage (`data-static`, `data-stage`, and CSS hiding by stage). No JavaScript: the finished building is shown.

### Projects preview

Six original monochrome inline-SVG drawings (`src/components/ProjectPreview/drawings.tsx`, one lazy chunk, prefetched on the first hover or focus of a row) cross-fade (opacity only) over the finished building in the right-hand window. Nothing is active until a row is hovered, focused or tapped; leaving the register returns to the finished building. Reduced motion swaps instantly.

## 4. Motion architecture

- The building mounts after `motionGate()` (first input or an anchor in the URL). `Building.tsx` builds one scrubbed timeline per part, each in its own task (`inOwnTask`), with `scrubPart(key, range, build)`. All three of GSAP, ScrollTrigger and `useGSAP` come from `src/lib/gsap.ts`; there is one `useGSAP` hook.
- Use `fromTo` so each part's start state is applied up front. Do not use GSAP `stagger` with `fromTo` on scrubbed timelines (only the first target gets its start state); use the `staggered` helper (explicit positions).
- Lit windows use a 0.01 s `fromTo` per pane (a flat switch, reversible), never a colour blend over scroll distance.
- All durations, staggers and ratios are in `MOTION.building` (`src/lib/motion.ts`), including `plotFadeShare` and `windowEnterViewport`.

## 5. Tests

`e2e/phase-14.spec.ts` covers section order, the four sync rules by sampling the whole page every 40 px (desktop and phone), reverse scrolling, anchor jumps, the hero hand-off, reduced motion, the Projects preview and drawer, the header indicator at 390, 768, 1024, 1280, 1440 and 1904 px, form focus and the photo placeholders. `e2e/phase-11.spec.ts` and `e2e/phase-12.spec.ts` (no broken images, no `//` or placeholder text, quiet portrait slot, readable disabled send button, centred wide layouts) check window size and constant surface, mobile band, stage state per part, flat lit windows, reduced-motion state, stroke contrast, no labels, one headline per section, no text under 14 px or uppercase micro-labels, sheets never crop content, amber allowlist and header contrast. `src/styles/banned-patterns.test.ts` checks banned CSS patterns and the amber allowlist in source.

Assertions changed in Phase 14 because they asserted behaviour the brief replaced: the old "each stage complete at its anchor" (now: complete where its part ends), the grey preview slot, "first project active by default", the "Drawing to come" label (now "Site photo to come"), and the reduced-motion "finished building at `#foundation`" (now: the stage of the section in view).
