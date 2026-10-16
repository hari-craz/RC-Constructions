# Agent Instructions — RC Constructions

All non-Claude AI agents working in this repository must strictly adhere to the project rules and standards defined in the canonical guide:
👉 **Read and follow [CLAUDE.md](CLAUDE.md) before performing any work.**

## Performance Law

GSAP, ScrollTrigger and Lenis load lazily through `src/lib/gsap.ts` after the first input; first paint is CSS only. Measure the production build with `node scripts/lh-median.mjs mobile 5` (see `docs/PERFORMANCE.md`). Targets: mobile performance >= 90, LCP <= 2.5 s, TBT <= 200 ms, CLS <= 0.01.

## The Three Rules That Matter Most

1. **Never Start Unrequested Phases**: Only implement the current, explicitly requested phase. Do not build forward into upcoming milestones.
2. **Strict Design Token Discipline**: Never use Tailwind, UI component libraries, inline design styles, or raw hex colors. All visual attributes must reference design tokens in `src/styles/tokens.css` per `docs/DESIGN.md`.
3. **Flawless Quality Gates**: Every task must pass `pnpm check` and `pnpm test:e2e` with zero errors and zero warnings before completion. Never disable lint or type checks.
