# Performance (`docs/PERFORMANCE.md`)

## How to measure (use this everywhere)

Always measure the **production build** served by `vite preview` (or the Docker image), never the dev server (`localhost:5173` serves unbundled modules and React dev mode, so its numbers say nothing about users).

```bash
pnpm build
pnpm preview            # serves dist on http://localhost:4173
CHROME_PATH="<path to chrome>" node scripts/lh-median.mjs mobile 5     # Lighthouse mobile defaults
CHROME_PATH="<path to chrome>" node scripts/lh-median.mjs desktop 5    # Lighthouse desktop preset
```

`scripts/lh-median.mjs` runs `lhci collect` with Lighthouse defaults (mobile: simulated Slow 4G and 4x CPU slowdown; desktop: the desktop preset), headless Chrome, five runs, and prints the **median** of performance, accessibility, best practices, SEO, FCP, LCP, TBT and CLS. CI uses `pnpm exec lhci autorun` with the same five-run, median-run assertions in `lighthouserc.json`.

`scripts/trace-scroll.mjs` records a Chrome trace around the first scroll and prints the heaviest main-thread events (set `CPU=4` for throttling).

## Results (production build, median of five, this machine)

| Metric         | Phase 11 mobile | Now mobile   | Phase 11 desktop | Now desktop |
| -------------- | --------------- | ------------ | ---------------- | ----------- |
| Performance    | 78              | 98           | 99 to 100        | 100         |
| Accessibility  | 100             | 100          | 100              | 100         |
| Best practices | 100             | 100          | 100              | 100         |
| SEO            | 100             | 100          | 100              | 100         |
| LCP            | 3.15 s          | 2.0 s        | 0.7 s            | 0.5 s       |
| TBT            | 450 ms          | about 100 ms | 49 ms            | 0 ms        |
| CLS            | 0.002           | 0.000        | 0.001            | 0.000       |

Targets: mobile performance >= 90, LCP <= 2.5 s, TBT <= 200 ms, CLS <= 0.01, other categories 100, desktop >= 97. All met.

## Why an earlier phase reported 95 and Phase 11 measured 78

I could not reproduce 95 on the Phase 11 build in any configuration: mobile defaults gave 78 and the desktop preset gave 99 to 100. The likely explanations, none provable after the fact: (a) the desktop preset or unthrottled ("provided") throttling was used, which scores this page 95 to 100; (b) the bundle was smaller then (the Phase 11 build executed 428 kB of JavaScript, 140 kB gzipped, before first paint); (c) a single run instead of a median of five (runs here vary by up to 10 points). The rule above removes the ambiguity: mobile defaults, production build, median of five.

## What the trace showed (Phase 11 build, mobile, 4x CPU)

1. **LCP element and timeline.** The LCP element was the hero tagline paragraph (the headline lines were hidden at first by a GSAP `yPercent: 100`). Time to first byte was 20 ms and there was no resource load delay or load duration: the whole LCP was **element render delay** (about 0.7 s after the JavaScript arrived), because nothing paints until React has executed. FCP was 2.65 s.
2. **Where main-thread time went.** About 428 kB of JavaScript (140 kB gzipped) executed before first paint: React DOM, all sections, and GSAP, ScrollTrigger, CSSPlugin, Observer and Lenis (about a third of the bytes). Style and layout was the largest bucket (2.5 s simulated), driven by ScrollTrigger measuring every section, the building mounting about 300 SVG elements, and a second layout when the web fonts swapped in. Long tasks: 596 ms (JavaScript evaluation and first render) and 429 ms (building mount and refresh).
3. **Fonts.** Both fonts arrived about 400 ms after the first request (no preload), so text first painted in the fallback and re-laid out on swap.

## Fixes

1. **Motion layer moved off the critical path.** GSAP, ScrollTrigger and Lenis load in their own chunks (`gsapCore`, `lenis`) through `src/lib/gsap.ts`. `gsap` and `ScrollTrigger` there are forwards to the loaded module; `useGSAP` is a local hook that runs its callback in a gsap context after the chunk loads. Main chunk: 140 kB to 91 kB gzipped.
2. **`motionGate()`**: scroll-driven setup (Lenis, ScrollTrigger timelines, building mount, cursor) waits for the first input (pointer, wheel, touch, key, scroll), an anchor in the URL, or 8 s of idle. Nothing visible depends on it before then. Each setup step runs in its own task (`inOwnTask`) and each building stage builds its timeline in its own task, so the first scroll produces no task over about 20 ms (the module evaluation of the motion chunk itself is about 45 ms).
3. **Hero intro and loading line are pure CSS** (keyframes with `backwards` fill, so GSAP can take over for the scroll-linked layer without a conflict). The headline is plain HTML text in the first paint and the LCP text is never hidden.
4. **Fonts**: the two latin variable woff2 files are preloaded (`vite.config.ts` plugin, only those two), so first paint uses the real fonts and the swap relayout disappears.
5. **ProjectOverlay chunk** is requested only when a project is opened (it was loading at startup).
6. Vercel Web Analytics loads after `load` and idle, and not on localhost (the local `/_vercel/insights` request 404 made 29 e2e tests fail on `main`).

Size: `pnpm size` about 124.8 kB brotlied across all chunks (limit 180 kB).

## Not done / notes

- No `content-visibility` on sheets: the sheet stack and ScrollTrigger depend on exact section heights.
- Lighthouse numbers vary by machine; CI asserts the median of five against the targets in `lighthouserc.json`.
- The gate means a visitor who never interacts sees no building mount for 8 s. That is intentional: the window is hidden on the hero.

## Phase 14

Mobile median of five: performance 98, LCP 2256 ms, TBT 6 ms, CLS 0 (Phase 13: 98, about 2.26 s, 20 ms, 0). Desktop median of three: 100. `pnpm size`: 128.08 kB brotlied (124.8 kB before; limit 180 kB). The six project drawings are one lazy chunk (about 2 kB gzipped) fetched on the first hover or focus of a project row.
