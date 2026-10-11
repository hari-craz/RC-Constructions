# RC Constructions — Technical Architecture

This document outlines the frontend architecture, scroll engine orchestration, and data modeling for the portfolio.

---

## 1. Core Principles

1. **Single-Page Architecture**: No multi-route client router. The application is a unified, progressive single-page viewport.
2. **Scroll-Driven Physics**: Scroll progress drives state and timeline execution, not time-based autonomous loops.
3. **Data-Driven Content**: JSX templates render data from typed datasets in `src/content/`. Copy and specs are never hardcoded inside presentation components.
4. **Token-Driven CSS**: Vanilla CSS utilizing CSS Custom Properties in `src/styles/tokens.css`. Zero CSS-in-JS runtime and zero Tailwind dependencies.

---

## 2. Scroll Engine Architecture

### Lenis + GSAP ScrollTrigger Integration

- **Single Scroll Provider**: A top-level Lenis instance initializes smooth virtual scrolling and drives the animation tick loop.
- **ScrollTrigger Synchronization**: Lenis `on('scroll', ScrollTrigger.update)` ties virtualized smooth scroll positions directly into GSAP's scroll calculation engine.
- **GSAP Ticker Hook**: `gsap.ticker.add((time) => lenis.raf(time * 1000))` locks both systems to the browser's native `requestAnimationFrame` lifecycle.
- **Scroll Memory & Resize Protection**: Window resize listeners recompute trigger bounds using `ScrollTrigger.refresh()`.

### Transition Pattern: Sheet-Stack Layering

- Sections stack physically like structural blueprints or architectural drafting sheets.
- As the user scrolls into a new threshold, the incoming section translates over or peels away the previous section, creating a tangible sense of structural depth without jarring page jumps.

---

## 3. Section Sequence

The building construction sequence follows this deliberate order:

1. **Section 01: Site Excavation & Foundation (Hero)**
   - Initial site boundary, ground survey coordinates, excavation footprint.
2. **Section 02: Structural Framing & Blueprint**
   - Foundation poured, primary steel columns and load-bearing framing erected.
3. **Section 03: Engineering Metrics & Materials**
   - High-precision concrete curing data, steel grade certifications, structural specs.
4. **Section 04: Project Portfolio (Selected Works)**
   - Interactive structural case studies and delivered architectural builds.
5. **Section 05: Survey Marker & Contact**
   - Job specification inquiry and contact form powered by Formspree (`VITE_FORMSPREE_ID`).

---

## 4. Content Architecture

All data resides in `src/content/`:

- `types.ts`: Pure TypeScript interfaces (`ProjectItem`, `MetricItem`, `SectionContent`, `SiteContent`).
- Content modules export strongly typed arrays/objects validated at build time against these interfaces.
- Components consume typed props, allowing mock datasets in tests and clean content revisions without layout edits.
