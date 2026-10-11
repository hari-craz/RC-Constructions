# RC Constructions — AI Engineering Guide

Single-page scroll-driven portfolio site where a building is progressively constructed as the visitor scrolls.

## Stack

- Node >=22, pnpm 10, React 19, Vite, TypeScript strict
- Hand-written CSS driven by design tokens in `src/styles/tokens.css` (No Tailwind)
- Self-hosted fonts: Big Shoulders Display (headings), Newsreader (body)
- Animation & Scroll: GSAP ScrollTrigger driven by Lenis smooth scroll
- Testing: Vitest (unit/DOM), Playwright (E2E + Axe a11y)
- Quality: ESLint flat, Prettier, Stylelint, Knip, Size-Limit, Commitlint, Husky

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
- `docs/` — Architectural specs, design system law, phase tracker

## Coding Rules

1. **Tokens Over Raw Values**: Always use CSS variables from `tokens.css`. Never use raw hex colors or ad-hoc magic numbers.
2. **Strict Typings**: No `any`. Strict TypeScript flags are enforced (`noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`).
3. **Exports & Structure**: Use named exports for non-page modules. Keep modules small and single-purpose.
4. **No Inline Design Styles**: Style via external CSS classes consuming tokens.
5. **Accessibility & Motion**: Maintain visible `:focus-visible` rings and respect `prefers-reduced-motion` everywhere.
6. **Data-Driven Sections**: Store content in typed data files under `src/content/`, not hardcoded in JSX markup.

## Do's and Don'ts

- **DO**: Run `pnpm check` before declaring any task complete.
- **DO**: Keep production bundle within size limit budget.
- **DO NOT**: Add Tailwind, UI kits, routers, or state libraries without explicit authorization.
- **DO NOT**: Bypass lint rules with blanket `eslint-disable` or `@ts-ignore`.
- **DO NOT**: Commit directly or push beyond `main`. Leave workspace clean for review.
- **DO NOT**: Add decorative filler, stock tropes, or unasked design flair.

## Strict Phasing Rule

**NEVER start a phase that was not asked for.** Build only what is requested for the active phase.

## Definition of Done

- `pnpm check` passes with 0 errors and 0 warnings.
- `pnpm test:e2e` passes cleanly on all configured viewports.
- All code complies with `docs/DESIGN.md` and `docs/ARCHITECTURE.md`.
