# RC Constructions — The Building (`docs/BUILDING.md`)

The building is the protagonist. It is one inline SVG in a fixed "site window" that sits beside the text column and is built up as the visitor scrolls (and un-built when they scroll back).

## 1. Layout: site window and page grid

One 12-column grid governs the page (`src/components/SheetStack/SheetStack.css`, `tokens.css`):

| Zone        | Desktop (>= 1024 px)                                                                                                    | Mobile / tablet (< 1024 px)                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Text column | Columns 1-5 (5/12). Content is centred in the zone, max `--text-column-max` (40rem), never closer than the page gutter. | Full width, max 44rem, left aligned.                 |
| Site window | Columns 6-12 (7/12 = 58.33%), fixed, `top: 0`, full `100dvh`, constant `#232622` surface.                               | The whole screen (`100svh`), fixed, behind the text. |

- The window never changes colour. Sheets (limewash or concrete) slide over the left; the window is layered above them (`--z-site-window`) and is `pointer-events: none`.
- `--column-left` is the left edge of the text column; the header logo and the Hero text align to it.
- The window is shown from Foundation to Completion (`isSiteWindowVisible` in `src/data/stages.ts`). Hero (plan view), Founder and Contact use the full width.
- Sheets carry no labels. Each section's headline (`id="<section>-heading"`) names the landmark.

## 2. Drawing

- Geometry lives in `src/components/Building/geometry.ts` (storeys, bays, windows, slabs, footings, pit, pegs). Change proportions there.
- Four storeys on a four-bay frame, 800 units wide, stair core on the right. `preserveAspectRatio="xMidYMax meet"`; the `viewBox` is chosen in `Building.tsx` by a media query (`VIEWBOXES.desktop`, `VIEWBOXES.mobile`). The drawn building (ground slab width) is about 78% of the window width on desktop and about 95% of the screen width on phones (`VIEWBOXES.mobile`, centred in a full-screen layer); tests assert at least 70% (1440, 1904, 2560) and 80% (phones).
- The ground line and soil are drawn far beyond the viewBox so they always run the full window width. Below 1024 px the layer is `100svh` and the drawing is centred in it (`xMidYMid meet`), so the building is behind the text as well as between its blocks.
- Solid masses: limewash walls, concrete slabs / columns / core / footings, formwork-dark openings, `#2c302b` soil and glass.
- Line system (CSS vars on `.building-site-window`, `non-scaling-stroke`): heavy section cut 3 px (limewash), medium 2 px (steel), hairline 1 px (steel), dimension lines 1 px (amber). On mobile heavy 2.5 px, medium 1.5 px, in the muted variant (section 1b).
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

Process step to building part (`PROCESS_STEP_STAGES` in `src/data/stages.ts`, changed in Phase 14B because steps 1 to 3 describe pre-construction work and the structure should not appear before the building starts):

| Section or step                               | Part drawn                                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| About                                         | `foundation:0` excavation and set-out pegs                                                                |
| Process steps 01 to 03                        | `foundation:1` footings, stubs and tie beam, starter bars, ground slab, level marks (complete at step 03) |
| Process step 04                               | `structure:0` columns and core, then beams and slab, all four storeys                                     |
| Process step 05                               | `envelope:0` walls and openings storey by storey, parapet, backfill, profile string taken down            |
| Process step 06                               | `fitout:0` window frames and rails, then entrance, canopy and stair                                       |
| Work delivered, until its headline is centred | `completion:0` name plate and dimension lines                                                             |
| Work delivered, headline centred onward       | `completion:1` every window lit (never before the headline is centred; tested at 390, 768 and 1440)       |

There are seven scrubbed parts in all: foundation 2, structure 1, envelope 1, fit-out 1, completion 2. The step copy was not changed.

### Site camera

While the foundation is drawn the whole drawing sits in a `.b-camera` group lifted by `MOTION.building.siteCameraLiftDesktop` or `...Phone` (viewBox units, optional `siteCameraScale`) so the site fills the middle of the window instead of the bottom. It settles to the resting frame across process step 04 as the columns rise. The transform is written straight to the group (a scrubbed `{k}` proxy) so the origin is exact; under reduced motion CSS applies the foundation frame directly.

### Sync rules

Ranges are bound to section bounding boxes (`src/components/Building/stageSync.ts`: `sheetTop`, `centreScroll`, `sheetEndScroll`), not to fixed scroll distances, so a change in copy length cannot desynchronise them.

1. A part never finishes before its text is centred in the reading area (the viewport centre on desktop; below 1024 px the upper part of the screen, `MOTION.stageLayer.readingShare`, 34%); the Process sheet has room below step 06 so every step can reach it.
2. A part never starts before the previous one is complete (ranges are contiguous: each starts where the last ended).
3. The building is never static for more than one step-height of scroll while a mapped section scrolls.
4. Reverse scrolling un-builds exactly (scrubbed, no snap), and anchor jumps land on the same state as scrolling there (function-based `start` and `end` with `invalidateOnRefresh`).

State is published on the window for tests and styles: `data-stage` (the stage in progress), `data-stage-progress` (0-1 within it), `data-build-progress` (0-1 overall), `data-part-progress` (seven comma-separated values), `data-preview`, and `data-static` under reduced motion. The header takes its window colours only when the window has fully arrived (`data-window-in` on `<html>`).

### Hero to building morph (Phase 14D)

`m` runs 0 to 1 while the About sheet arrives over the hero (`src/lib/morph.ts`; it is a pure function of the scroll position, so it reverses exactly and an anchor jump lands in the right state). It is published as `data-morph-progress` on `<html>` (with `--morph`, `--morph-backdrop` and `--morph-hero-text`). All shares below are `MOTION.morph`.

1. 0 to `frontEnd`: auto-rotate has stopped and the house eases to its front elevation (all angles 0, orthographic).
2. `landStart` to `landEnd`: it scales and moves (`landing()` in `src/lib/model3d/render.ts`) until its ground line and width equal the building's ground line and footprint on screen (`src/lib/siteTarget.ts`, the same maths as `Building.tsx` and the site camera at its first frame). Its palette steps one tone darker and its ink turns to steel (`recolourStart` to `recolourEnd`, `--hm-mix`).
3. `windowStart` to `windowEnd`: desktop, the site window slides in from the right; below 1024 px the drawing appears behind the text. On desktop the house moves from the hero to a fixed layer above the window (`.stage-house`, one DOM move of its scene group) when the morph begins, so it can land over the window.
4. `dissolveStart` to `dissolveEnd`: top first, class by class (roofs, upper storey, ground storey, porch; `MOTION.model3d.dissolveWindows`), each by opacity and a small downward settle (`dissolveSettleMetres`). The plinth stays.
5. The foundation begins when the dissolve is complete (`foundationRange` starts at the About sheet's top). The plinth fades over `plinthFadeViewport` of scroll as the pit is dug where it stood, and the layer is then hidden.

Controls fade first (`controlsFadeEnd`) and the widget is `inert` once the hero is behind, so the house can no longer be handled. Reduced motion: no morph; `m` is 0 while the hero is in view and 1 once it has left, and the house is swapped for the building with no animation. No JavaScript: the static house stays in the hero. The building itself is not server-rendered, so no finished building shows after it (a stated limit).

## 1b. The full-bleed background below 1024 px (Phase 14D)

- Layers, back to front: backdrop (`.stage-backdrop`, `--z-stage-backdrop`), building (`.building-site-window`, 100svh, transparent), house (`.stage-house`), then the sheets (`--z-sheet`), then the header. All decorative layers are `aria-hidden` with `pointer-events: none`; only the hero stage (inside the hero) takes drag and keys, and only while the hero is in view.
- The backdrop turns from the hero's concrete to formwork (`backdropStart` to `backdropEnd`), after the hero text has faded (`heroTextFadeStart` to `heroTextFadeEnd`), so no text sits on a mid-grey.
- Sheets are plain blocks in the page flow (no pinning, slide-over, radius or dim); About, Process, Work delivered, Services and Projects are transparent with light ink (`.sheet-stage`). Founder and Contact stay opaque light sheets.
- Legibility without gradients, blur or translucency: the building is a muted ghost (`--b-*` variables in `Building.css`: formwork ground, fills one step darker, strokes a darker steel) so limewash and concrete text keeps at least 4.5:1 over any pixel of it. The lit windows are full amber only while Work delivered is read, where every block sits on a flat opaque formwork plate (`--stage-plate`); in Services and Projects they are a flat muted amber and the dimension lines are hidden. The Services title also sits on a plate, because it can arrive while the windows are still lit.
- `e2e/phase-14d.spec.ts` samples the pixels behind every visible text block (text hidden, page screenshot) at 390x844 and 768x1024 from the end of the hero to the end of Projects: body text 4.5:1, large text 3:1.
- At 1024 px and above (including a tablet in landscape) the desktop layout applies; at 1023 and below the layer applies. `e2e/phase-14d.spec.ts` checks the switch and a portrait to landscape turn.

## 3b. Release candidate changes (Phase 15A)

- **Text over the building (below 1024 px).** `src/components/Building/textClear.ts` measures every line of text in the sheets once (document coordinates, again on resize or font load) and, on each scroll frame, hides building detail that lies under a line (window frames and openings, mullions, lit panes, rails, the stair, set-out strings: `visibility: hidden`) and removes the outline of structure there (`stroke: none`; the ghost fill stays). Both are `data-clear` attributes styled in `Building.css`; nothing is removed or moved. The margin is `MOTION.textClear.marginPx`. Between text blocks the building is drawn whole. The gap between text blocks on phones is wider (`SheetStack.css`). Nothing is cleared at 1024 px and above.
- **Phone house tone.** The house is drawn at the full tones of the window palette until the dissolve starts. `--hm-dim` (0 to 1, written by `ModelController.applyMix` from the morph) takes every fill and stroke to the ghost during the dissolve (`MOTION.morph.dissolveStart` to `dimEnd`). It is 0 in the hero, so the hero is unchanged, and it goes back exactly on reverse scroll.
- **Phone control strip.** Up to 640 px: Turn, Tilt, Reset, Auto-rotate and More (`HeroModel.tsx`). More opens Turn left, Tilt down, Roll left and Roll right. Roll is also a two-finger twist. Wider screens keep all eight controls.
- **No JavaScript.** The static house and the finished building (all windows lit, entrance, name plate; `src/lib/buildingStatic.ts` from the same geometry as the scrolled drawing) are inlined from `index.html` at build time, styled by `StaticBuilding.css`.

## 4. Motion architecture

- The building mounts after `motionGate()` (first input or an anchor in the URL). `Building.tsx` builds one scrubbed timeline per part, each in its own task (`inOwnTask`), with `scrubPart(key, range, build)`. All three of GSAP, ScrollTrigger and `useGSAP` come from `src/lib/gsap.ts`; there is one `useGSAP` hook.
- Use `fromTo` so each part's start state is applied up front. Do not use GSAP `stagger` with `fromTo` on scrubbed timelines (only the first target gets its start state); use the `staggered` helper (explicit positions).
- Lit windows use a 0.01 s `fromTo` per pane (a flat switch, reversible), never a colour blend over scroll distance.
- All durations, staggers and ratios are in `MOTION.building` (`src/lib/motion.ts`), including `windowEnterViewport` (the house and window shares are in `MOTION.model3d`).

## 5. Tests

`e2e/phase-14.spec.ts` covers section order, the four sync rules by sampling the whole page every 40 px (desktop and phone), reverse scrolling, anchor jumps, reduced motion, the Projects preview and drawer, the header indicator at 390, 768, 1024, 1280, 1440 and 1904 px, form focus and the photo placeholders. `e2e/phase-11.spec.ts` and `e2e/phase-12.spec.ts` (no broken images, no `//` or placeholder text, quiet portrait slot, readable disabled send button, centred wide layouts) check window size and constant surface, the mobile layer, stage state per part, flat lit windows, reduced-motion state, stroke contrast, no labels, one headline per section, no text under 14 px or uppercase micro-labels, sheets never crop content, amber allowlist and header contrast. `src/styles/banned-patterns.test.ts` checks banned CSS patterns and the amber allowlist in source.

Assertions changed in Phase 14 because they asserted behaviour the brief replaced: the old "each stage complete at its anchor" (now: complete where its part ends), the grey preview slot, "first project active by default", the "Drawing to come" label (now "Site photo to come"), and the reduced-motion "finished building at `#foundation`" (now: the stage of the section in view).

## 6. How the house is drawn, and how to edit it safely (Phase 14E)

The house is correct at every angle because its draw order is not computed per frame from depths but
read from a binary space partition (BSP) built once from the source geometry.

- **Source** (`src/lib/model3d/house.ts`, `buildHouseSource()`): metres, front is +z. Faces have a role.
  `solid` faces belong to a convex solid and are wound outward; a `board` is a free-standing thin face
  (the fascia boards); `detail` faces (decals: window frames, glass, doors, trim; hairlines: siding,
  shingles, mullions) lie on a solid face of their own solid and carry its facing. Each solid has a build
  window (the intro) and a dissolve class (the morph). The source is not shipped.
- **Build** (`pnpm model:bsp`, `scripts/build-model-bsp.mjs`, builder in `src/lib/model3d/bsp.ts`, Node
  built-ins only; Node strips the types): writes `src/lib/model3d/house.bsp.json` (about 40 kB, compact
  numbers, loaded by `houseModel.ts` with no work at load). `pnpm test` fails if the file differs from a
  fresh build, so the two never drift. Steps: (1) trim: the part of a solid's face that lies inside
  another solid is cut away (the porch roof ends at the bay and wall, the cross gable meets the main roof
  along the valley); an interface between two solids is dropped unless the other solid is taken down
  first (so the plinth keeps its top); (2) attach: every decal and hairline is attached to the face it
  lies on and clipped to each piece of it, so it is always drawn with its face; (3) partition: pieces are
  split by the planes of other pieces (a handful of splits: the splitter is chosen among the largest
  pieces to cut the fewest others).
- **Draw** (`render.ts`, `buildFrame`): walk the tree from the eye (far side first); a node's pieces are
  drawn only if they face the eye (back-face culling is the side of the plane the eye is on), each
  followed at once by its detail. Pieces cut by the partition have a seam, not an edge: they are a fill
  whose stroke is its own colour (no anti-aliasing crack) plus a stroke-only path of their real edges.
  Paths are joined into runs: a path joins an earlier run of its class only if its bounding box cannot
  overlap anything painted since. Coordinates are whole quarter pixels (`quantum`), because integers are
  far cheaper to format and parse; the face group is scaled by 0.25 and the face CSS strokes are four
  times their pixel width. The eye is never nearer than 1.5 bounding radii.
- **Orientation** (`orientation.ts`): a unit quaternion. Drag, buttons, keys and auto-rotate apply small
  rotations about the world vertical (turn), the screen's horizontal axis (tilt, stopping where the
  elevation reaches the limit, in steps of at most 4 degrees so it cannot cross the pole) and the view
  axis (roll). The matrix is made once per frame. Reset and the morph's ease to the front elevation are
  spherical interpolations. A fling is capped at `MOTION.model3d.inertiaMaxSpeed`.
- **Fit**: the bounding sphere fills at most `MOTION.model3d.heroFill` (desktop) or `overlayFill`
  (below 1024 px) of its container, so the house never clips at any rotation.
- **Editing safely**: keep every face flat, convex and wound outward (the unit tests check it); put each
  decal exactly on a face of its own solid (the builder stops with an error if one lies on none); make a
  solid convex; use `board` only for free-standing thin faces; then run `pnpm model:bsp`, `pnpm test` and
  `pnpm exec playwright test e2e/phase-14e.spec.ts`.
- **Proof**: `src/lib/model3d/reference.ts` is a z-buffer renderer used only by tests.
  `reference.test.ts` compares the real renderer's order with it over the whole turntable grid (y every 15
  degrees, x from -80 to 80 in 20, z from -45 to 45 in 15) and 50 random orientations;
  `e2e/phase-14e.spec.ts` does the same on the real SVG (`?hm-test` draws each piece in its own flat
  colour with no edges, detail or anti-aliasing, and exposes `window.__hm`) at 390x844 and 1440x900.
  Pass: fewer than 0.3 percent of the model's pixels differ, ignoring a 1 px band round face edges.
  `e2e/phase-14e-behaviour.spec.ts` checks no clipping, no flips and the tilt limit.
