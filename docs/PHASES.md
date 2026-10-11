# Project Phases — RC Constructions

- [x] **Phase 1: Scaffold and Tooling (Foundation Setup)**
  - Repository initialization with Node 22, pnpm 10, React 19, Vite, TypeScript strict.
  - Zero-Tailwind design tokens and base typography configuration via @fontsource.
  - Complete tooling suite: ESLint, Prettier, Stylelint, Vitest, Playwright, Knip, Size-Limit, Husky, commitlint.
  - AI canonical instruction files and architectural documentation.

- [x] **Phase 2: CI Pipeline, Docker & Deployment Setup**
  - Containerization setup (multi-stage Dockerfile, docker-compose profiles, nginx.conf on port 8080).
  - GitHub Actions pipelines (CI with parallel jobs and `ci-pass` aggregate gate, Lighthouse, multi-arch Docker release to GHCR, Security with CodeQL/Audit/Gitleaks/Trivy, Release-Please).
  - Vercel production hosting configuration (`vercel.json`) with header parity test against `nginx.conf`.
  - Repo automation (Renovate with pinned TS/ESLint majors, issue/PR templates, CODEOWNERS, SECURITY.md).
  - Comprehensive deployment and branch protection documentation (`docs/DEPLOYMENT.md`).

- [x] **Phase 3: Design Tokens, Scroll Engine & Sheet-Stack Foundation**
  - Finalized design tokens with semantic aliases, fluid type scale, and motion tokens in `src/lib/motion.ts`.
  - Ticker-driven Lenis `ScrollProvider` synchronized with GSAP ScrollTrigger and lag smoothing.
  - Ref-counted `useScrollLock`, active section spy with clean `history.replaceState`, and `--page-progress` variable.
  - Bidirectional `SheetStack` component supporting tall sheets, scale and border-radius scrubbing, dim overlay, and complete reduced-motion fallback.
  - Comprehensive unit and E2E test suites with zero axe violations and screenshot capture.

- [x] **Phase 4: Pinned Hero & Land Survey Drawing**
  - Land survey drawing (`HeroPlot`) in chalk-line precision on concrete with normalized paths (`pathLength="1"`).
  - Massive architectural headline in Big Shoulders Display with masked line reveals.
  - Polymorphic `Button` with amber accent and `Logo` with favicon geometry.
  - Section-spy responsive `Nav` switching tone over sheets with accessible skip link.
  - Orchestrated load sequence and scroll-linked footprint fill in `MOTION.hero`.
  - Placeholder audit catalogued in `docs/PLACEHOLDERS.md`.

- [x] **Phase 5: Independent Review & Pre-Launch Audit (Checkpoint)**
  - Local audit across code correctness, security, WCAG 2.1 AA accessibility, design system law, mobile Lighthouse, and repo hygiene.
  - Heading hierarchy outline corrected with `headingTag` prop; touch targets expanded to 44px min-height; design tokens and motion constants strictly enforced.
  - Multi-viewport visual verification screenshots captured across 5 resolutions (intro-complete and mid-transition).
  - Launch checklist (`docs/LAUNCH-CHECKLIST.md`), physical device QA matrix (`docs/QA-DEVICES.md`), and review log (`docs/REVIEW-phase-5.md`) authored.

- [x] **Phase 6: The Evolving Building**
  - Signature building constructed across scroll stages (Foundation, Structure, Envelope, Fit-out, Completion).
  - Synchronized elevation drawing canvas with technical hatching and dimension badges.

- [x] **Phase 7: Real Page Content**
  - [x] **7A done**: About and Services replacing Foundation and Structure stubs with typed contractor content and drawing schedule table.
  - [x] **7B done**: Projects and Process replacing Envelope and Fit-out stubs with register index and ordered sequence.
  - [x] **7C done**: Completion stats with ruled title-block grid and count-up helper, and Founder monograph section with 4:5 reserved portrait slot.
  - [x] **7D done**: Real Contact section wired to Formspree, full validation, honeypot, rate guard, and minimal footer. Every section on the page is now real content.

- [x] **Phase 8: Polish (Loading Sequence, Cursor, Project Overlays)**
  - Hairline amber dimension line loading sequence capping at 1.2s with session skip.
  - Fine-pointer survey-marker custom cursor with contextual state transitions (default, link, project, hidden) and tone adaptation.
  - Lazy-loaded full-height project detail overlay sheet with focus trap, scroll lock, URL hash syncing, and accessible adjacent project navigation.

- [ ] **Phase 9: Performance Tuning, A11y Audit & Release**
  - Full Lighthouse audit verification (>= 0.85 perf, >= 0.95 a11y).
  - Cross-browser validation and production release sign-off.
