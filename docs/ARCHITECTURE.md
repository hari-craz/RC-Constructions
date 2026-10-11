# RC Constructions — Technical Architecture

This document outlines the frontend architecture, scroll engine orchestration, data modeling, and deployment infrastructure for the portfolio.

---

## 1. Core Principles

1. **Single-Page Architecture**: No multi-route client router. The application is a unified, progressive single-page viewport.
2. **Scroll-Driven Physics**: Scroll progress drives state and timeline execution, not time-based autonomous loops.
3. **Data-Driven Content**: JSX templates render data from typed datasets in `src/content/`. Copy and specs are never hardcoded inside presentation components.
4. **Token-Driven CSS**: Vanilla CSS utilizing CSS Custom Properties in `src/styles/tokens.css`. Zero CSS-in-JS runtime and zero Tailwind dependencies.

---

## 2. Scroll Engine Architecture

### Lenis + GSAP ScrollTrigger Integration

- **Single Scroll Provider (`ScrollProvider`)**: A top-level component instantiates a single Lenis smooth-scroll instance (`autoRaf: false`, `smoothWheel: true`) and wraps the entire application context via `ScrollContext`.
- **Single Ticker Synchronization**: Lenis does not run an internal requestAnimationFrame loop. Instead, `gsap.ticker.add((time) => lenis.raf(time * 1000))` locks Lenis rendering directly to GSAP's ticker, eliminating timing desynchronization between virtual scroll interpolation and GSAP ScrollTrigger calculations. GSAP lag smoothing is configured with `lagSmoothing(500, 33)`.
- **Trigger Refresh Rules**:
  - `ScrollTrigger.refresh()` is automatically executed upon `document.fonts.ready` resolution to prevent layout shift inaccuracies caused by font loading.
  - Window resize events recalculate trigger geometry with a 200ms debounce (`MOTION.scroll.resizeDebounceMs`), avoiding thrashing during viewport resizing.
  - Mobile address bar resizing is insulated with `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **Ref-Counted Scroll Lock (`useScrollLock`)**:
  - Dialogs, mobile menus, and modal overlays use `useScrollLock(locked: boolean)`.
  - A central reference counter tracks nested lock consumers. When count transitions `0 -> 1`, `lenis.stop()` is invoked and body scroll is locked. When count returns to `0`, `lenis.start()` resumes virtual scrolling without premature unlocks from child unmounts.
- **Section Spy & History State Synchronization**:
  - `IntersectionObserver` tracks which `<section id>` occupies the viewport midpoint (`rootMargin: '-40% 0px -40% 0px'`).
  - Active section updates the URL hash cleanly using `history.replaceState(null, '', `#${id}`)`, preventing the user's browser back button from being flooded with hundreds of scroll entries.
  - `--page-progress` CSS custom property is throttled via `requestAnimationFrame` on `document.documentElement` to reflect `0.0000` to `1.0000` total viewport scroll progress.
- **Clean Redirection & Reduced Motion Safety**:
  - When `prefers-reduced-motion: reduce` is active, Lenis is completely omitted (`lenis: null`).
  - Animations are disabled, and programmatic scrollTo reverts to native `element.scrollIntoView({ behavior: 'auto' })`.

### Transition Pattern: Sheet-Stack Layering

- Sections stack physically like structural blueprints or architectural drafting sheets.
- Outgoing sheets scale down to `scaleMin: 0.94`, round their corners to `32px`, and dim by `40%` as incoming sheets translate upward and square their top corners to `0px`.
- Sticky tops are dynamically computed for tall sheets whose content height exceeds viewport height (`top: vh - height`), ensuring terminal elements are fully scrollable before subsequent sheets overlap.

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

---

## 5. Deployment & Infrastructure Architecture

### Production Edge: Vercel Git Integration

- Deployed via native GitHub integration without separate deploy workflows or secrets.
- `vercel.json` enforces CSP, strict cache headers for hashed assets, and clean URLs without catch-all routing.

### Self-Hosted & Containerization: Docker & GHCR

- **Multi-Stage Build**: `deps` (pnpm cache), `build` (Vite static compilation), and `runtime` (`nginxinc/nginx-unprivileged` Alpine).
- **Hardened Container**: Non-root execution (`USER 101`), read-only root filesystem with tmpfs, `/healthz` endpoint on port 8080.
- **Header Parity**: Automated verification (`scripts/compare-headers.mjs`) ensures exact alignment of security and cache headers between `vercel.json` and `nginx.conf`.
- **Registry & Automation**: Automated multi-arch builds (`linux/amd64`, `linux/arm64`) pushed to GHCR on `main` and release tags, with optional Portainer webhook redeployment.
