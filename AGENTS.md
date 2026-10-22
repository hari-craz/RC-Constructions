# Agent Instructions — RC Constructions

All non-Claude AI agents working in this repository must strictly adhere to the project rules and standards defined in the canonical guide:
👉 **Read and follow [CLAUDE.md](CLAUDE.md) before performing any work.**

## Content and Launch Law

Company facts only in `src/content/company.ts` (null hides the element; never invent a fact). No guarantee-style claims (`src/content/claims.ts`). One canonical URL in `src/config/site.json`. Sample contact details are flagged and listed in `docs/BEFORE-GOING-LIVE.md`. After a deploy run `node scripts/check-live.mjs`.

## Performance Law

GSAP, ScrollTrigger and Lenis load lazily through `src/lib/gsap.ts` after the first input; first paint is CSS only. Measure the production build with `node scripts/lh-median.mjs mobile 5` (see `docs/PERFORMANCE.md`). Targets: mobile performance >= 90, LCP <= 2.5 s, TBT <= 200 ms, CLS <= 0.01.

## Story Sync Law

Section order, the stage map and the sync rules live in `docs/BUILDING.md` section 3 and `src/data/stages.ts`. Never reorder sections or change an id without updating both and `e2e/phase-14.spec.ts`. Process steps 01-03 complete the foundation, 04 structure, 05 envelope, 06 fit-out; lit windows never appear before the Work delivered headline is centred. The building must never finish a part before its text is centred, and reverse scrolling must un-build exactly.

## Hero Model Law

The hero 3D house is our own projection code (`src/lib/model3d/`) in a lazy chunk (`src/components/HeroModel/`); never add a 3D or animation library. It must stay at the front elevation at the end of the hero scroll, keep ink text at 4.5:1 over every fill when it is the hero background (below 1024 px), keep the morph (`src/lib/morph.ts`) a pure function of the scroll so it reverses exactly, keep the muted background (below 1024 px) at 4.5:1 for text, draw the house from its BSP (`pnpm model:bsp`; see `docs/BUILDING.md` section 6) and never by sorting faces by depth, keep its orientation a quaternion with the tilt limit on elevation, keep 44 px control targets and 2 px ink focus rings, and snap (no easing) under reduced motion.

## The Three Rules That Matter Most

1. **Never Start Unrequested Phases**: Only implement the current, explicitly requested phase. Do not build forward into upcoming milestones.
2. **Strict Design Token Discipline**: Never use Tailwind, UI component libraries, inline design styles, or raw hex colors. All visual attributes must reference design tokens in `src/styles/tokens.css` per `docs/DESIGN.md`.
3. **Flawless Quality Gates**: Every task must pass `pnpm check` and `pnpm test:e2e` with zero errors and zero warnings before completion. Never disable lint or type checks.
