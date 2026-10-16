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

## Motion Engineering Rules

1. **No Rogue GSAP**: Never call `ScrollTrigger.create` or `gsap.to` outside `useGSAP` or a dedicated hook with explicit cleanup.
2. **Motion Token Discipline**: All numerical values animated by GSAP or consumed by scroll engines must reside in `src/lib/motion.ts`. Never use magic numbers in animation callbacks.
3. **Reduced Motion Law**: Every animated feature must provide an explicit, graceful `prefers-reduced-motion: reduce` fallback path and a corresponding E2E verification test.
4. **No `100vh`**: Never use `100vh` in CSS or JS layouts. Always use `100dvh` or `100svh` to avoid viewport layout jumps on mobile browsers.

## DevOps & Deployment Rules

1. **Hosting**: Vercel Git integration exclusively. No Vercel deploy workflow or `VERCEL_TOKEN`.
2. **Container**: Multi-stage unprivileged Nginx on port 8080 (`/healthz` endpoint).
3. **CI Gate**: Branch protection requires the unified `ci-pass` aggregate check and security checks.
4. **Version Pins**: Never bump `typescript` to 7 or `eslint` to 10 until plugin ecosystem matures.

## Performance Rules

1. **GSAP, ScrollTrigger and Lenis are lazy**: import `gsap`, `ScrollTrigger` and `useGSAP` only from `src/lib/gsap.ts` (forwards to the `gsapCore` chunk, loaded after the first input via `motionGate()`). Never import `gsap` or `lenis` directly elsewhere.
2. **First paint is CSS only**: the hero intro and loading line are CSS; nothing above the fold waits on the motion chunk.
3. **Split setup into small tasks** (`inOwnTask`); no task over about 50 ms on first scroll.
4. **Measure the production build**: `node scripts/lh-median.mjs mobile 5` (see `docs/PERFORMANCE.md`). Targets: mobile performance >= 90, LCP <= 2.5 s, TBT <= 200 ms, CLS <= 0.01.

## Content Rules

1. **Company facts live only in `src/content/company.ts`.** A missing fact is `null` and the element is hidden (`hasContent`); never invent a year, licence, figure, quote, client or address, and never show "20XX", "XX" or "to come" in body copy.
2. **No absolute or guarantee-style wording** (`src/content/claims.ts`; tests fail on it). Use factual, process-based statements.
3. **One canonical URL**: `src/config/site.json`. Meta tags, sitemap, robots, security.txt and JSON-LD are generated from it (`vite.config.ts`, `src/lib/siteFiles.ts`).
4. Sample contact details are flagged (`contact.isSample`) and listed first in `docs/BEFORE-GOING-LIVE.md`.
5. New pages: Vite inputs (`privacy.html`, `terms.html`), no router. Console must stay clean (`e2e/phase-13.spec.ts`).

## Layout & Building Rules

- One 12-column grid: text in columns 1-5, fixed site window (constant formwork) in columns 6-12; mobile band 42svh. Details in `docs/BUILDING.md` and `docs/DESIGN.md` section 8.
- No section labels, eyebrows, codes or uppercase micro-labels. Sheets are labelled by their headline (`<section>-heading`).
- Never use GSAP `stagger` with `fromTo` on scrubbed building timelines; use the `staggered` helper.

## Folder Map

- `src/app/` — Application providers, scroll controller, layout wrappers
- `src/sections/` — Discrete portfolio sections (Hero, About, Services, Projects, Process, Completion, Founder, Contact)
- `src/components/` — Shared, reusable UI primitives (LoadingLine, SurveyCursor, ProjectOverlay, Sheet, etc.)
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
