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

- [ ] **Phase 3: Design Tokens & Layout Infrastructure**
  - Grid system, responsive layout tokens, and base layout shell.
  - Survey grid background generator and theme primitives.

- [ ] **Phase 4: Scroll Engine & Section Architecture**
  - Lenis smooth scroll provider integration.
  - GSAP ScrollTrigger timeline orchestrator and sheet-stack section transitions.

- [ ] **Phase 5: Section 01 — Site Excavation & Foundation (Hero)**
  - Initial brand arrival, headline choreography, coordinate markers, and foundation reveal.

- [ ] **Phase 6: Sections 02 & 03 — Framing & Engineering Metrics**
  - Structural column assembly scroll animation.
  - Material specifications and engineering performance data visualization.

- [ ] **Phase 7: Section 04 — Selected Projects Showcase**
  - Project case study cards, technical blueprint overlays, and detail transitions.

- [ ] **Phase 8: Section 05 — Contact Form & Survey Marker**
  - Formspree integration with typed validation and accessible form controls.
  - Footer coordinates and physical survey badge.

- [ ] **Phase 9: Performance Tuning, A11y Audit & Release**
  - Full Lighthouse audit verification (>= 0.85 perf, >= 0.95 a11y).
  - Cross-browser validation and production release sign-off.
