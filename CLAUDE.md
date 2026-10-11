# RC Constructions — AI Engineering Guide

Single-page scroll-driven portfolio site where a building is progressively constructed as the visitor scrolls.

## Stack

- Node >=22, pnpm 10, React 19, Vite, TypeScript strict (pinned to `~5.8`)
- Hand-written CSS driven by design tokens in `src/styles/tokens.css` (No Tailwind)
- Self-hosted fonts: Big Shoulders Display (headings), Newsreader (body)
- Animation & Scroll: GSAP ScrollTrigger driven by Lenis smooth scroll
- Testing: Vitest (unit/DOM), Playwright (E2E + Axe a11y)
- Quality & DevOps: ESLint (pinned to `^9`), Prettier, Stylelint, Knip, Size-Limit, Docker, GHCR, Vercel

## Core Commands

- `pnpm dev` — Start Vite local dev server
- `pnpm build` — Typecheck and build production bundle
- `pnpm preview` — Preview production build locally
- `pnpm typecheck` — TypeScript verification (`tsc -b`)
- `pnpm lint` / `pnpm lint:fix` — ESLint verification and autofix
- `pnpm lint:css` — Stylelint verification
- `pnpm format` / `pnpm format:check` — Prettier verification and formatting
- `pnpm test` / `pnpm test:watch` — Vitest unit and DOM tests
- `pnpm test:e2e` — Playwright end-to-end smoke & accessibility suite
- `pnpm knip` — Detect unused files, exports, and dependencies
- `pnpm size` — Verify JS bundle size against 180 kB budget
- `pnpm check` — Complete CI verification suite (runs all checks and build)
- `pnpm docker:build` — Build production unprivileged Docker image
- `pnpm docker:run` — Run local container on port 8080
- `pnpm docker:dev` — Run dev container with live reload
- `pnpm compare:headers` — Verify header alignment between vercel.json and nginx.conf

## DevOps & Deployment Rules

1. **Hosting**: Vercel Git integration exclusively. No Vercel deploy workflow or `VERCEL_TOKEN`.
2. **Container**: Multi-stage unprivileged Nginx on port 8080 (`/healthz` endpoint).
3. **CI Gate**: Branch protection requires the unified `ci-pass` aggregate check and security checks.
4. **Version Pins**: Never bump `typescript` to 7 or `eslint` to 10 until plugin ecosystem matures.

## Folder Map

- `src/app/` — Application providers, scroll controller, layout wrappers
- `src/sections/` — Discrete portfolio sections (Hero, Blueprint, Structural, Projects, Contact)
- `src/components/` — Shared, reusable UI primitives
- `src/content/` — Typed content schemas and datasets (`types.ts`)
- `src/hooks/` — Custom hooks (motion preferences, measurements, scroll)
- `src/lib/` — Utilities, GSAP & Lenis orchestration
- `src/styles/` — Design tokens (`tokens.css`) and global reset/foundations (`base.css`)
- `src/assets/` — Static SVGs, diagrams, textures
- `e2e/` — Playwright test specs
- `docs/` — Architectural specs, design system law, deployment guide, phase tracker
- `.github/workflows/` — CI, Lighthouse, Docker release, Security, and Release-Please pipelines

## Strict Phasing Rule

**NEVER start a phase that was not asked for.** Build only what is requested for the active phase.

## Definition of Done

- `pnpm check` passes with 0 errors and 0 warnings.
- `pnpm test:e2e` passes cleanly on all configured viewports.
- All code complies with `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, and `docs/DEPLOYMENT.md`.
