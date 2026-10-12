# RC Constructions — Final Visual Review & Art Direction Record

**Date**: 2026-10-12  
**Role**: Art Director & Front-End Design Lead  
**Scope**: Final Visual Refinement & Defect Closure (Phases 1–9)  
**Budget Verification**: Size Limit 180 kB budget -> **122.47 kB brotlied** (57.53 kB headroom)

---

## 1. Ranked Design & Layout Issues Remediated

| Rank    | Defect ID | Description                                                                                                                                        | Root Cause                                                                                                                       | Remediation                                                                                                                                                                                                                                       | Verification                                                                                                                                       |
| :------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**  | **B0.1**  | Building structure collided with copy columns in Services, Projects, Process, and About on wide viewports (1440px+).                               | Building container was positioned across full screen without column restraint; copy containers spanned 72ch into building space. | Decoupled canvas into fixed right column (`width: 44vw; right: 0; overflow: clip`). Constrained all left sheet copy to `max-width: min(46vw, 38rem)`.                                                                                             | `e2e/refinement-geometry.spec.ts` passes 48/48 geometry assertions with zero bounding box intersections across 1440x900, 1904x1080, and 2560x1080. |
| **P2**  | **B0.2**  | Giant all-caps section sheet-labels clipped under top edge and overpowered editorial headlines.                                                    | Decorative headers used oversized uppercase tracking with negative margins.                                                      | Replaced with quiet sentence-case Newsreader micro-label (`font-size: 0.875rem; color: inherit; opacity: 0.85`), spaced cleanly below the fixed nav bar.                                                                                          | WCAG 2 AA contrast >= 7.5:1 across all sheet tones; axe reports 0 violations across all viewports.                                                 |
| **P3**  | **B0.3**  | Eyebrow labels, table headers, and form labels were all-caps heavy, resembling a tech dashboard rather than an architectural monograph.            | Overuse of uppercase `Big Shoulders Display` on micro-copy.                                                                      | Shifted kickers, table headers, form labels, and section metadata to sentence-case `Newsreader` (>= 14px). Only display titles and the nav button retain uppercase.                                                                               | Clean editorial hierarchy matching `docs/DESIGN.md` guidelines.                                                                                    |
| **P4**  | **B0.4**  | Leaked `// PLACEHOLDER` markers visible in rendered UI copy and tables.                                                                            | Raw mock comment tokens were embedded in strings in `src/content/`.                                                              | Removed visible `// PLACEHOLDER` markers from all UI copy; replaced with quiet architectural contractor specifications while preserving catalog entries in `docs/PLACEHOLDERS.md`.                                                                | Verified across DOM and Playwright content assertions.                                                                                             |
| **P5**  | **B0.5**  | Amber color discipline violations (amber bullets in About, amber row numbers in Projects, stray right-edge building strip during Founder/Contact). | Amber token used for decorative list markers and numbers; building canvas stayed active on non-building sheets.                  | Restored strict token discipline: bullets in concrete steel, project numbers in ink-muted. Hidden building during Founder and Contact (`isVisible = false`). Amber strictly isolated to dimensions, lit windows, loading line, and submit CTA.    | Grep audit and Playwright stage tests verify zero amber leakage.                                                                                   |
| **P6**  | **B0.6**  | Hero headline brand name read "RC CONSTRUCTION" (missing "S") and collided with plot drawing on desktop.                                           | Typo in headline string; SVG survey plot was centered instead of anchored into right survey field.                               | Corrected to "RC CONSTRUCTIONS"; clamped headline to `clamp(3.5rem, 2.5rem + 5vw, 7.5rem)`; anchored `HeroPlot` cleanly to top-right (54% width, 82% height on desktop, top 48% on mobile).                                                       | Zero headline overlap across all viewports from 360px to 2560px.                                                                                   |
| **P7**  | **B0.7**  | Sheet stack dimming overlay created muddy, dull grey surfaces on concrete sheets.                                                                  | Dim overlay opacity was set to `0.40`.                                                                                           | Reduced `MOTION.sheetStack.dimOverlayOpacity` from `0.40` to `0.12`, preserving raw concrete texture and high-contrast ink legibility.                                                                                                            | Visual inspection and contrast audits pass cleanly.                                                                                                |
| **P8**  | **B0.8**  | Dead vertical space in About; harsh black placeholder box in Founder; unfinished Contact footer layout.                                            | About had excessive min-heights; Founder portrait had no editorial framing; Contact footer lacked balanced spacing.              | Tightened About section padding; redesigned Founder portrait slot as an architectural concrete block with subtle steel hairline outline and scale callout; formatted Contact with `justify-content: space-between` and minimalist footer credits. | Editorial layout feels intentional, calm, and grounded.                                                                                            |
| **P9**  | **B0.9**  | Thin foundation drawing legibility and dark heavy wall infills in building stages.                                                                 | Foundation trench was 1px solid line; upper walls had dark solid fills that looked like opaque boxes.                            | Thickened foundation excavation cut to 2px dashed outline; converted heavy wall fills to clean architectural structural framing outlines with transparent interior glazing.                                                                       | Building stages read like precise architectural drawings rather than clip-art.                                                                     |
| **P10** | **B0.10** | Nav contrast: logo & Enquire button legibility across changing sheet surface tones.                                                                | Enquire button lacked a border in some tones; tone detection was desynchronized on fast anchor navigation.                       | Styled Enquire button with `border: 1px solid currentcolor;`; synchronized surface tone calculation directly with active section stage definitions and deep-link aliases.                                                                         | `e2e/hero.spec.ts` passes tone transition tests across Chromium, Firefox, WebKit, and Mobile Chrome.                                               |

---

## 2. What Changed

1. **Geometry & Column Alignment (`src/components/Building/Building.css`, `src/sections/*/*.css`)**:
   - Replaced centered building positioning with a dedicated 44vw right-hand structural column (`right: 0; width: 44vw; overflow: clip; z-index: 15`).
   - Standardized all content sheet copy containers to `max-width: min(46vw, 38rem); margin-left: 0; margin-right: auto;`.
   - Guaranteed minimum 4vw clearance gutter between text and drawn structures on all viewports from 1024px to 2560px+.
2. **Typography & Editorial Restraint (`src/components/SheetStack/SheetStack.css`, `src/styles/tokens.css`)**:
   - Reduced `.sheet-label` to sentence-case Newsreader at 0.875rem, inheriting tone color with 85% opacity.
   - Refined headings across About, Services, Projects, Process, Completion, and Founder to eliminate dashboard-like all-caps clutter.
   - Preserved Big Shoulders Display strictly for display headlines and the primary Enquire action.
3. **Architectural Palette Restraint (`src/styles/tokens.css`, `src/components/Building/Building.tsx`)**:
   - Isolated `--color-accent` (safety amber `#d97706`) strictly to:
     - Laser dimension survey lines
     - Energized completion lighting windows
     - Initial hairline page loading line
     - Contact submit button
   - Replaced all stray amber accents with steel `#7a7e78` or ink-muted `#c4c4bc`.
   - Hidden building canvas during Founder monograph and Contact section to prevent visual distraction.
4. **Interactive Controls & Touch Targets (`src/sections/Contact/Contact.css`, `src/sections/Contact/Contact.tsx`)**:
   - Elevated all interactive touch targets (`.contact-input`, `.contact-select`, `.contact-channel-value`, `.contact-footer-top`) to `min-height: 48px;` to eliminate Firefox sub-pixel threshold failures.
   - Added `useEffect` lifecycle synchronization to focus the success status confirmation region upon verified Formspree response.
5. **Drawing & Framing Legibility (`src/components/Building/Building.tsx`, `src/sections/Founder/Founder.css`)**:
   - Styled excavation earth cut with architectural dashed lines.
   - Converted structure and envelope infills to hairline wireframes with transparent window panes.
   - Framed Founder portrait as a measured 4:5 concrete block with dimension notations.

---

## 3. What Was Left As Is

1. **Core Single-Page Architecture**: Zero client-side routing additions; preserved native URL hash observation and Lenis scroll orchestration.
2. **Color Palette Boundaries**: Preserved the 5 core earth tones (`--color-formwork-dark`, `--color-surface-raised`, `--color-limewash`, `--color-concrete`, `--color-steel`) and zero usage of gradients, blues, purples, or glassmorphic blurs.
3. **Dual Font Pairing**: Retained `@fontsource-variable/big-shoulders-display` and `@fontsource-variable/newsreader` as the sole typographic system.
4. **Progressive Scroll Timeline**: Preserved the exact GSAP ScrollTrigger construction stages (survey -> foundation -> structure -> envelope -> fit-out -> completion) without altering stage boundaries or anchor hashes.
5. **Restrained Polish Layer**: Preserved Phase 8 loading line hairline, survey-marker cursor, and project detail overlay mechanics with zero extraneous visual flair.

---

## 4. Screenshot Index: Before vs. After

All baseline and refined screenshots are stored in version control under `docs/review/`:

### Viewport Comparisons

| Viewport                  | Before Baseline                                      | After Refinement                                    | Key Visual Improvement                                                                               |
| :------------------------ | :--------------------------------------------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-hero-settled.png`       | `docs/review/after/1440x900-hero-settled.png`       | Corrected brand name "RC CONSTRUCTIONS"; survey plot anchored right without text collision.          |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-about-settled.png`      | `docs/review/after/1440x900-about-settled.png`      | Text column constrained to left 46vw; building foundation clear on right; quiet sentence-case label. |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-completion-settled.png` | `docs/review/after/1440x900-completion-settled.png` | 4-stat layout balanced against illuminated completion structure.                                     |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-founder-settled.png`    | `docs/review/after/1440x900-founder-settled.png`    | Stray building canvas eliminated; architectural 4:5 concrete portrait block with dimension callouts. |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-contact-settled.png`    | `docs/review/after/1440x900-contact-settled.png`    | Balanced two-column contact register with minimal footer and 48px touch targets.                     |
| **1440x900 (Desktop)**    | `docs/review/before/1440x900-overlay-open.png`       | `docs/review/after/1440x900-overlay-open.png`       | Project detail overlay with trapped focus and sentence-case specifications.                          |
| **1920x1080 (HD)**        | `docs/review/before/1920x1080-about-settled.png`     | `docs/review/after/1920x1080-about-settled.png`     | Zero text-building collision; clear architectural spacing.                                           |
| **2560x1080 (Ultrawide)** | `docs/review/before/2560x1080-about-settled.png`     | `docs/review/after/2560x1080-about-settled.png`     | Max-width content capping preserves human-scale reading width alongside structural drawing.          |
| **360x640 (Mobile)**      | `docs/review/before/360x640-hero-settled.png`        | `docs/review/after/360x640-hero-settled.png`        | Single-column stack with survey plot positioned below headline.                                      |
| **768x1024 (Tablet)**     | `docs/review/before/768x1024-about-settled.png`      | `docs/review/after/768x1024-about-settled.png`      | Responsive stacking prevents collision and preserves hierarchy.                                      |

### Building Stages (1440x900)

| Stage             | Baseline Screenshot                             | Refined Screenshot                             | Refinement                                                                    |
| :---------------- | :---------------------------------------------- | :--------------------------------------------- | :---------------------------------------------------------------------------- |
| **01-survey**     | `docs/review/before/building-01-survey.png`     | `docs/review/after/building-01-survey.png`     | Laser setback lines and plot datum verified.                                  |
| **02-foundation** | `docs/review/before/building-02-foundation.png` | `docs/review/after/building-02-foundation.png` | 2px dashed excavation profile; legible ground tie-beams.                      |
| **03-structure**  | `docs/review/before/building-03-structure.png`  | `docs/review/after/building-03-structure.png`  | Reinforced concrete column grid and slab profiles without heavy opaque fills. |
| **04-envelope**   | `docs/review/before/building-04-envelope.png`   | `docs/review/after/building-04-envelope.png`   | Mullion patterns and spandrel glass framing lines.                            |
| **05-fitout**     | `docs/review/before/building-05-fitout.png`     | `docs/review/after/building-05-fitout.png`     | Interior core and architectural service drops.                                |
| **06-completion** | `docs/review/before/building-06-completion.png` | `docs/review/after/building-06-completion.png` | Warm amber window glow against structural frame; no stray artifacts.          |
