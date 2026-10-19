# RC Constructions — Design System Law

This document defines the strict aesthetic and design standards for RC Constructions. It is authoritative law across all phases.

---

## 1. Brand Palette & Usage Rules

The palette evokes raw construction materials, physical drafting paper, structural concrete, and survey site tools.

| Token                     | Hex       | Role & Strict Usage Rules                                                                                                                                                                  |
| :------------------------ | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-concrete`        | `#C4C4BC` | Secondary body text, dimensional measurement callouts, blueprint gridlines.                                                                                                                |
| `--color-limewash`        | `#E9E7DF` | Primary text on dark backgrounds, drawing surface background when light inverted.                                                                                                          |
| `--color-formwork-dark`   | `#232622` | Core site background, dark timber formwork, solid structural foundations.                                                                                                                  |
| `--color-steel`           | `#7A7E78` | Muted captions, technical borders, secondary division lines, mechanical guides.                                                                                                            |
| `--color-work-lamp-amber` | `#E3B341` | **The Sole Accent**: Reserved exclusively for focal illumination, survey registration marks, and the single primary call to action. Never used as general decoration or background washes. |

### Strict Rule for Amber (`#E3B341`)

Work-lamp amber represents a focused construction work-lamp or laser theodolite. It must **never** be used for generic text, backgrounds, multi-color card borders, or decorative noise.

---

## 2. Typography

- **Headlines**: `Big Shoulders Display Variable` (via `@fontsource-variable/big-shoulders-display`).
  - Architectural, industrial, technical, impactful uppercase letterforms.
  - Used for Section Titles, Building Phases, Structural Identifiers.
- **Body & Editorial**: `Newsreader Variable` (via `@fontsource-variable/newsreader`).
  - Editorial, tactile serif providing high-craft human contrast to industrial headlines.
  - Used for project descriptions, technical notes, narrative copy.

### Type Scale

- Display: `7rem` (`--font-size-display`)
- 4XL: `5rem` (`--font-size-4xl`)
- 3XL: `3.75rem` (`--font-size-3xl`)
- 2XL: `2.75rem` (`--font-size-2xl`)
- XL: `2rem` (`--font-size-xl`)
- LG: `1.5rem` (`--font-size-lg`)
- MD: `1.125rem` (`--font-size-md`)
- Base: `1rem` (`--font-size-base`)
- SM: `0.875rem` (`--font-size-sm`)
- XS: `0.75rem` (`--font-size-xs`)

---

## 3. Motion & Animation Principles

- **Scroll-Driven Construction**: The user's scroll position acts as physical time. As the user descends, the architectural structure erects floor by floor, truss by truss.
- **Mechanical, Deliberate Easing**: Physics are grounded in physical steel and concrete mass (`cubic-bezier(0.2, 0, 0, 1)` or GSAP `power2.out`). No bouncy cartoon easing.
- **Division of Responsibility (CSS vs motion.ts)**:
  - Static styling, token variables, fluid typography, responsive layouts, and base rules live exclusively in `src/styles/tokens.css` and CSS stylesheets.
  - Numerical parameters animated by GSAP or consumed by scroll engines live strictly in `src/lib/motion.ts` (e.g. `scaleMin: 0.94`, `radiusSheetPx: 32`, `dimOverlayOpacity: 0.4`, durations, debounce timing). Never hardcode magic numbers in component animation code.
- **Sheet-Stack Motion Specifications**:
  - Pinned sticky stack (`position: sticky`, `top: 0` or calculated `vh - height` for tall sheets exceeding viewport).
  - Outgoing sheet smoothly scrubs down from `scale: 1.0` to `scale: 0.94` with `transform-origin: center top`.
  - Outgoing sheet border radius smoothly rounds to `32px` (`--radius-sheet`), and a dimming overlay scrubs from `0` to `40%` opacity (`--color-formwork-dark`).
  - Incoming sheet top corners square from `32px` to `0px` as the sheet arrives at the viewport top.
  - Scrubbing is strictly bidirectional, synchronized with Lenis virtual scroll through `gsap.ticker`.
- **Accessibility & Reduced Motion**:
  - All motion strictly obeys `prefers-reduced-motion: reduce`.
  - Under reduced motion, Lenis is disabled, sheets revert to natural static flow (`position: static`, `transform: none`, `border-radius: 0`), dim overlays are hidden (`display: none`), and standard instant browser jump scrolling is used.

---

## 4. WCAG 2.1 Contrast Matrix & Pair Rules

All color combinations must satisfy WCAG AA contrast (≥ 4.5:1 for body text, ≥ 3.0:1 for large display headlines ≥ 24px).

| Foreground Color          | Background Surface        | Contrast Ratio | WCAG AA Status | Permitted Usage                                |
| :------------------------ | :------------------------ | :------------- | :------------- | :--------------------------------------------- |
| Limewash (`#E9E7DF`)      | Formwork Dark (`#232622`) | **14.2:1**     | PASS (AAA)     | Primary headline & body text on dark sheets    |
| Formwork Dark (`#232622`) | Limewash (`#E9E7DF`)      | **14.2:1**     | PASS (AAA)     | Primary text on light inverted sheets          |
| Formwork Dark (`#232622`) | Concrete (`#C4C4BC`)      | **9.8:1**      | PASS (AAA)     | Primary text on blueprint concrete sheets      |
| Formwork Dark (`#232622`) | Amber (`#E3B341`)         | **8.5:1**      | PASS (AAA)     | Text on primary focal amber CTA button         |
| Amber (`#E3B341`)         | Formwork Dark (`#232622`) | **8.5:1**      | PASS (AAA)     | Focal accents, registration badges, indicators |
| Concrete (`#C4C4BC`)      | Formwork Dark (`#232622`) | **9.8:1**      | PASS (AAA)     | Muted secondary copy and structural callouts   |

### Strictly Forbidden Color Pairings (Contrast Failures)

The following combinations fail WCAG contrast and are **strictly banned**:

- ❌ **Amber on Concrete (`#E3B341` on `#C4C4BC`)**: Contrast is 1.3:1 (Severe Failure).
- ❌ **Amber on Limewash (`#E3B341` on `#E9E7DF`)**: Contrast is 1.7:1 (Severe Failure).
- ❌ **Limewash on Concrete (`#E9E7DF` on `#C4C4BC`)**: Contrast is 1.4:1 (Severe Failure).
- ❌ **Steel on Formwork Dark (`#7A7E78` on `#232622`) for body text**: Contrast is ~3.8:1 (Fails normal body text AA; permitted solely for non-text borders, mechanical guides, and large captions).

---

## 5. Hero Section Specification (Creative Direction & Architecture)

The hero opens with the building itself: a small **interactive 3D house** drawn on bare concrete that turns slowly by itself and can be turned by the visitor (Phase 14C replaced the earlier survey plot; see section 12).

### Visual Foundations

- **Surface**: Pure flat concrete (`--color-concrete`, `#C4C4BC`). Strictly zero gradients, zero drop shadows, zero noisy canvas overlays, zero glassmorphism blurs.
- **The Drawing (3D house)**: an original two-storey house (main block, garage, front porch, gable roofs, chimney) as plain data in `src/lib/model3d/`, projected by our own maths into one inline SVG. Limewash walls, concrete roofs, formwork-dark windows and doors, ink edges in the three-weight system. Dimension lines (overall width and height) and their labels follow the model in **amber exclusively** (`--color-work-lamp-amber`), with the labels on formwork-dark tags for contrast.

### Typography & Hierarchy

- **Headline**: "RC Constructions" set on two lines (`RC` / `Constructions`), weight 800, leading 0.88, anchored bottom-left. Rendered via `--font-size-display-hero: clamp(4.25rem, 3.25rem + 7vw, 9.5rem)`. The raw physical scale of the type is the graphic statement; zero gradient text, zero decorative badges.
- **Tagline**: One line in Newsreader Variable (`--font-size-md`, `--color-formwork-dark`).
- **Primary CTA**: Button with solid work-lamp amber fill (`--color-accent`), formwork-dark ink (`--color-accent-ink`), no arrow icons (`→`), high-visibility focus ring.
- **Boldness Allocation**: Visual intensity is spent in two places only: the high-contrast line drawing and the massive headline. All other elements remain quiet and utilitarian.

### Breakpoint Layout Rules

- **Desktop (1440×900)**:
  - Dual-zone composition: Text column anchored to bottom-left with `--page-gutter` padding.
  - The 3D house and its controls occupy the right 56% of the hero, above and beside the headline block; zero overlap with the text.
- **Tablet (768×1024)**:
  - The house sits above the headline, full width, with the controls beneath it.
- **Mobile (390×844)**:
  - The house fills the width of the upper area; its control cluster (two rows of four, 44 px targets) sits beneath it; headline, tagline and button anchor to the lower part.
  - Dimension labels are drawn 1.8 times larger below 768 px so they stay readable.

### Motion Timeline

1. **Load**: the headline reveals via a masked line clip (CSS, `MOTION.hero.headline*`). The 3D house is a lazy chunk requested after first paint and an idle moment; it fades in (opacity only) once ready.
2. **Scroll hand-off**: see `docs/BUILDING.md` and section 12 (the house eases to its front elevation, then fades while the window arrives).
3. **Accessibility**: with `prefers-reduced-motion: reduce` there is no auto-rotate, inertia or easing; the house stays at its rest angle and the buttons and keys snap.

### Banned List Audit & Revision Record

- _Review against cliches_: No generic hero tags, no "Scroll to explore" pulsing arrows, no gradient text, no glassmorphism cards.
- _Changes made from initial concept_: Added formwork-dark marker backing behind amber dimension labels to enforce WCAG AA/AAA contrast (8.5:1) rather than raw amber on bare concrete (which fails at 1.3:1).

---

## 6. The Banned List

The following design clichés and defaults are **strictly forbidden** in this project:

- **Banned Palettes & Shading**:
  - Purple or blue palettes.
  - Color gradients, radiant fills, or gradient text.
  - Glassmorphism, backdrop blurs, or glowing neon orbs.
  - Cream + terracotta defaults.
  - Tinted near-black as a generic style substitute.
- **Banned Layout & Component Tropes**:
  - Monospace micro-labels above everything.
  - All-caps eyebrows floating above headings.
  - Arrows mechanically appended to button labels (`→`, `->`).
  - Identical rounded card grids with drop shadows.
  - Generic fade-up animations on every section entry.
  - Stock-looking hero patterns (e.g. giant generic number + gradient accent).
- **Banned Fonts**:
  - Space Grotesk, Inter, Archivo, Roboto, and default tech-bro typography picks.

---

## 7. Survey-Marker Cursor & Focus Specification (Phase 8)

### Survey-Marker Cursor Law

The custom cursor evokes a surveyor's optical level crosshair. It is engineered with strict restraint:

- **Target Devices**: Mounted strictly on devices matching `(hover: hover) and (pointer: fine)`. Never rendered or instantiated on touch devices.
- **Native Cursor Co-existence**: Native cursor is **always kept visible**. `cursor: none` is forbidden globally. Over form fields (`input`, `textarea`, `select`), the survey marker fades out completely and the native I-beam cursor operates unhindered.
- **Color & Tone Rules**:
  - Never uses amber (`#E3B341`).
  - Tone is determined contextually by the underlying surface:
    - **Ink (`--color-formwork-dark`)** on light surfaces (`--color-concrete`, `--color-limewash`).
    - **Limewash (`--color-limewash`)** on dark surfaces (`--color-formwork-dark`).
    - Handled via `data-cursor-tone="dark"` or `"light"`.
- **States & Geometry (`data-cursor`)**:
  - **`default`**: Fine crosshair composed of two hairlines and a 2px center dot.
  - **`link`**: Frame opens to a 28px square bracket drawing frame on hover over links and buttons.
  - **`project`**: 28px bracket frame with an "Open" label set in Newsreader (13px) for project register rows.
  - **`hidden`**: Opacity 0 when cursor leaves the window or enters text editable elements.
- **Performance & Mechanical Motion**:
  - Driven by `gsap.quickTo` on x/y translate transforms. Zero layout shifts. Passive single `pointermove` listener.
  - All pointer events pass through (`pointer-events: none`).
  - Under `prefers-reduced-motion: reduce`, marker follows coordinates with instant damping (no easing lag), and bracket state changes do not animate.

### Universal Focus-Visible Standard

- Every interactive element across the document and within project overlays features a unified `:focus-visible` ring:
  ```css
  :focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 3px;
  }
  ```
- Complies with WCAG 2.4.7 (Focus Visible) and WCAG 2.4.11 (Focus Appearance).

## 8. Phase 11 — Composition and Sheet Rules

- **Grid**: one 12-column grid. Text owns columns 1-5, the fixed site window columns 6-12 (58.33% wide, full height, constant `#232622`) on desktop; on mobile the window is a fixed 42svh band. See `docs/BUILDING.md`.
- **Quiet text column**: one headline opens each section, then short body and the content module (table, register, steps, stats). No section labels, eyebrows, drawing codes, all-caps or monospace micro-labels. Body text uses `--font-size-body` (18-20 px); nothing is smaller than 14 px.
- **Sheets**: tones are limewash or concrete (the ink tokens are re-pointed per tone in `SheetStack.css`). A sheet is as tall as its content plus `--sheet-bottom-pad` (at least 12vh); it never crops its content. Tall sheets pin their bottom edge, so the next sheet slides over padding. The dim on the sheet below is formwork at `MOTION.sheetStack.dimOverlayOpacity` (0.1), a darker version of its own surface.
- **Projects**: the grey image slot was removed in Phase 14; the right-hand window previews the active row (section 10).
- **Header**: two zones that follow the grid. The logo sits on the sheet surface; the action sits on the window surface once the window shows. No blur.
- **Amber** appears only on dimension lines, lit windows, primary buttons and the loading line (`e2e/phase-11.spec.ts`, `src/styles/banned-patterns.test.ts`).

## 9. Phase 12 — Wide layouts, sheets and placeholders

- **Panel-less sections** (Founder, Contact) use a centred grid: `.sheet-wide`, max `--wide-content-max` (75rem) plus gutters. On phones they do not reserve the building band. Sections with the site window keep text in grid columns 1-5.
- **Sheet stack**: sheets no longer scale (scaling revealed the dark body as side bars). The outgoing sheet is dimmed with formwork at `MOTION.sheetStack.dimOverlayOpacity`; the incoming sheet's top corners go from `radiusSheetPx` to square.
- **Placeholders**: never a broken image and never code-comment text. Founder portrait: `FOUNDER_CONTENT.portraitAvailable` (false until the photo files are committed) switches between a quiet concrete block with one sentence and the `<picture>`. Photo slots read "Site photo to come" (section 10). The form's missing-ID note is a plain sentence beside a flat, readable disabled button.

## 10. Phase 14 — One story, header indicator, preview and focus

- **Order**: Hero, About, Construction process, Work delivered, Services, Projects, Founder, Contact. Ids are unchanged. The building follows the text (`docs/BUILDING.md` section 3).
- **Projects live preview**: nothing is active until a row is hovered, focused or tapped. The active row has a 3 px ink left rule, a 10% ink tint and `aria-current="true"`. The drawing is one of six original monochrome inline SVGs in the three-weight line system, cross-faded with opacity only. Leaving the register returns to the finished building.
- **Project drawer**: on desktop it covers only the window region (grid columns 6-12); the list stays visible and inert, the row stays marked, Previous and Next update and scroll the row into view. On phones it is a full-screen bottom sheet. Focus trap, focus return, Escape, Close, scroll lock and the `#project-<slug>` hash are unchanged.
- **Photo placeholders** (`src/styles/photo-slot.css`): a thin outline frame, four corner crop marks and one sentence-case line ("Site photo to come"), with a project-specific caption. No all-caps, no `//`.
- **Header section indicator**: from 1280 px, sentence-case Newsreader links at 16 px (Principles, Process, Track record, Services, Projects, Contact) with 44 px targets; the current one has a 2 px ink underline and `aria-current="true"`. Below 1280 px, a button naming the current section opens a full-width list in a native `<dialog>` (scroll lock, Escape, Close, focus returned to the button). The wordmark hides below 480 px so the header never collides. No all-caps, amber, arrows or numbering.
- **Form focus**: a 2 px ink outline with 2 px offset and a 3 px bottom border (padding gives back the extra 2 px so nothing shifts); at least 3:1 against the field and never amber.
- **Services highlight (optional)**: skipped. Lighting the part of the building a service refers to would imply the services are built in a fixed order, which they are not, and the building already follows the process section directly above.

## 11. Phase 14B — Map, hand-off and framing

- Process steps 01 to 03 complete the foundation; step 04 raises the structure, 05 closes the envelope, 06 is the fit-out (`docs/BUILDING.md` section 3). Lit windows wait for the Work delivered headline to be centred.
- Phone and tablet hand-off: the band rides with the arriving sheet's top edge; no empty region taller than 20% of the viewport.
- The foundation is framed by a lifted camera (`MOTION.building.siteCamera*`), not left low in an empty window.
- The founder portrait falls back to the quiet placeholder if the file fails to load; `src/content/portrait.test.ts` requires real files of the right type before the flag can be switched on.

## 12. Phase 14C — Interactive 3D house in the hero

- **Model**: `src/lib/model3d/` holds plain data (about 110 vertices, solids with flat window and door decals), rotation and projection maths (turn about y, then tilt about x, then roll about z; a mild perspective), back-face culling and a painter's sort by solid. No 3D library. One inline SVG; faces of one kind that are neighbours in paint order share a path to keep DOM work small.
- **Auto-rotate**: one turn in 20 s about y with an 8 degree bob on x, redrawn at most 30 times a second. It pauses on hover (mouse), when the model has keyboard focus, while dragging, while the hero is off-screen or the tab is hidden, and resumes after 3 s without input.
- **Controls**: drag turns (y) and tilts (x, clamped to 80 degrees) with inertia; Shift + drag or a two-finger twist rolls (z). On touch `touch-action: pan-y` keeps vertical swipes scrolling the page. Always-visible buttons (Turn left, Turn right, Tilt up, Tilt down, Roll left, Roll right, Reset view, Auto-rotate) rotate 15 degrees with a short ease. The model is focusable (arrows, Q and E, 0 or Home, Space). Focus rings are 2 px ink with a 2 px offset. An x, y, z axis gizmo rotates with the model; one hint line ("Drag to turn the house") is removed after 6 s or the first interaction. Nothing is announced by a live region.
- **Hand-off**: over the first quarter of the hero-to-window hand-off the house eases to its front elevation (all angles 0, perspective to orthographic); it then fades by opacity only before the window enters. Scrolling back restores the pose it had.
- **Fallbacks**: reduced motion as above; no-JS shows the house at its rest angle, inlined into `index.html` at build time (`%HERO_MODEL_SVG%`).
- **Tokens**: `MOTION.model3d` in `src/lib/motion.ts`.
