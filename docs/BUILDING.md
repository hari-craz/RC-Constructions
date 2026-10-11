# RC Constructions — Evolving Building Architecture (`docs/BUILDING.md`)

This document defines the architectural specification, viewport layout strategy, stage progression sequence, and SVG vector engineering for the scroll-constructed building feature.

---

## 1. Layout Decision & Dual-Zone Composition

### The Core Problem

In RC Constructions, the narrative sections exist as a sticky, scaling sheet-stack (`position: sticky`, `transform: scale(0.94)`, `border-radius: 32px`, `opacity` dim overlay). Because each sheet is an opaque material slab (`--color-formwork-dark`, `--color-concrete`, or `--color-limewash`), placing a fixed building layer behind the sheet stack causes incoming sheets to completely occlude the building.

### The Solution: Co-Existent Dual-Zone Split

#### Desktop (≥ 1024px)

- **Left Column (~48% width)**: Houses the narrative content stack (`.sheet-inner`), section typography, engineering metrics, and copy blocks. The sheet-stack motion engine continues to scrub scale down to 0.94, rounds incoming sheet corners to 32px, and cross-dims outgoing sheets without clipping the building.
- **Right Column (~52% width)**: Forms a dedicated, fixed architectural "Site Window" (`.building-site-window`).
  - Anchored fixed to the viewport: `top: 0; right: 0; width: 52%; height: 100dvh;`.
  - `pointer-events: none` to guarantee all mouse, touch, and scroll interactions pass directly through to the underlying document scroll engine.
  - Layered above sheet surfaces (`z-index: var(--z-nav, 100) - 1`) with an opaque drafting background matching `--color-formwork-dark` or transparently floating on the shared plane.
  - Zero interference with the Hero sheet: During the Hero plan-view intro, the site window is transparent or visually dormant until the footprint stands up into the ground line.

#### Mobile & Tablet (< 1024px)

- **Top Elevation Band (34svh / 34dvh)**: The building elevation sits pinned in a fixed upper viewport band.
  - Dimensioned strictly in small/dynamic viewport units (`34svh`, `34dvh`), never `100vh`, preventing vertical jumps when iOS Safari or Android Chrome collapses or expands the dynamic address bar.
- **Lower Narrative Stream (66dvh)**: Section headings and descriptive copy scroll naturally beneath the fixed building band.
  - Top padding on mobile sheets (`padding-top: calc(34svh + var(--space-4))`) prevents content from being obscured beneath the building canvas.

---

## 2. Stage Progression Table

The building depicts an architectural elevation cut of a modern 4-storey mixed-use structural frame with an articulated ground-floor bay. It transitions continuously across 6 distinct phases:

| #     | Stage ID     | Target Anchor | Scroll Range  | Visual Elements Drawn / Revealed                                                                                                                                                                     | Token Palette                                                 |
| ----- | ------------ | ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **1** | `survey`     | `#hero`       | `0.00 – 0.16` | **Plan-view survey plot** (existing Hero). Hands off to elevation: boundary footprint stands up into the baseline datum line; amber front setback dimension carries over to the elevation baseline.  | `--color-concrete`, `--color-formwork-dark`, `--color-accent` |
| **2** | `foundation` | `#foundation` | `0.16 – 0.33` | **Substructure & Earthwork**: Ground datum line, stepped excavation cut, structural footings (isolated pad footings), plinth beam, and concrete ground slab drawn as technical section cuts.         | `--color-formwork-dark`, `--color-concrete`, `--color-steel`  |
| **3** | `structure`  | `#structure`  | `0.33 – 0.50` | **Superstructure Grid**: Vertical column lines rise level-by-level; floor slabs (Levels 1, 2, 3, Roof) and spandrel beams draw horizontally; structural stair core rises through the central shaft.  | `--color-formwork-dark`, `--color-steel`                      |
| **4** | `envelope`   | `#envelope`   | `0.50 – 0.67` | **Building Enclosure**: Exterior masonry/curtain walls infill; window structural openings punch through; roof parapet and weathering capstone establish building silhouette. Fills in flat limewash. | `--color-limewash`, `--color-formwork-dark`                   |
| **5** | `fit-out`    | `#fitout`     | `0.67 – 0.84` | **Architectural Detailing**: Internal partition layouts, doors, structural stair flights with handrails, window mullions, and ground-floor glazed entry portal.                                      | `--color-steel`, `--color-formwork-dark`                      |
| **6** | `completion` | `#completion` | `0.84 – 1.00` | **Commissioning & Handover**: Windows illuminate in solid work-lamp amber (flat fill, zero glow); architectural nameplate; final surveyed building height dimension line; entry access pathway.      | `--color-accent` (windows/dims), `--color-formwork-dark`      |

---

## 3. SVG Vector Structure & Element Budget

### Clean Geometry Budget (< 600 Elements)

To maintain 60 FPS mobile scrub and prevent long tasks, geometry is engineered without redundant markup:

- **Reuse via `<defs>`**:
  - `<symbol id="building-col">`: Single standardized column profile reused with `<use>` across 4 levels.
  - `<symbol id="building-window">`: Modular window opening unit.
  - `<pattern id="hatch-steel">`: Clean 45° single-line hatching for section cuts.
- **Hierarchical `<g>` Container Groups**:
  ```xml
  <svg class="building-svg" viewBox="0 0 800 1000" aria-hidden="true" role="presentation">
    <defs>...</defs>
    <g id="stage-foundation" class="building-stage">...</g>
    <g id="stage-structure" class="building-stage">...</g>
    <g id="stage-envelope" class="building-stage">...</g>
    <g id="stage-fitout" class="building-stage">...</g>
    <g id="stage-completion" class="building-stage">...</g>
    <g id="stage-dimensions" class="building-stage">...</g>
  </svg>
  ```
- **Stroke Weights & Engineering Hierarchy**:
  - _Primary section cuts_: `2.5px` (`--color-formwork-dark`).
  - _Secondary structural grid_: `1.5px` (`--color-steel`).
  - _Architectural infill & mullions_: `1.0px` (`--color-steel`).
  - _Dimension lines & ticks_: `1.0px` (`--color-accent`).
- **Zero Disallowed Styling**:
  - Zero linear/radial gradients.
  - Zero drop shadows or SVG filters (`<filter>`, `feGaussianBlur`).
  - Zero glow around lit windows; windows transition strictly between transparent and flat `--color-accent`.

---

## 4. Retiming Stages & Customizing Proportions

All stage definitions, section anchors, and scroll percentages reside in `src/data/stages.ts`:

```typescript
export interface StageConfig {
  id: 'survey' | 'foundation' | 'structure' | 'envelope' | 'fitout' | 'completion';
  sectionId: string;
  name: string;
  kicker: string;
  title: string;
  range: [number, number]; // Normalized scroll bounds [0..1]
}
```

To retime a stage or adjust the building's structural levels for a specific client tender:

1. Update `range: [start, end]` in `src/data/stages.ts`.
2. Update animation timings in `src/lib/motion.ts` under `MOTION.building`.
3. Modify grid bay pitch or floor count in `Building.tsx` symbols. All GSAP ScrollTrigger timeline bounds recalculate automatically.
