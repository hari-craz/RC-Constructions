# Phase 14E: the house breaking while it rotates

Part A (what was broken, found before anything was fixed) is first. The independent review and its
responses follow. Frames are in `docs/review/phase-14e/before/` (the 14D build, commit `acc6cf5`)
and `docs/review/phase-14e/after/` (same names). Each contact sheet is one roll (z) of the grid:
24 turns (y, every 15 degrees) across, 9 tilts (x, -80 to +80 in steps of 20) down. The examples in
`before/examples/` and `after/examples/` are single frames at both sizes.

## Part A: findings before the fix

Method: the real SVG of the 14D build was rendered at 1440x900 and 390x844 over the whole grid
(24 turns x 9 tilts x 7 rolls = 1,512 orientations at each size) and compared pixel by pixel with an
independent z-buffer renderer working from the source polygons (`reference.ts`). Of the 216
orientations at roll -45 / 0 / +45 that were analysed in detail, **161 of 216 (390x844) and 172 of
216 (1440x900) were more than 0.3% different from the reference**; the worst was 35.3% (390x844)
and 38.1% (1440x900), at x -40, y 75, z -45. The kinds of break, with the evidence for each:

1. **Wrong draw order (the main cause).** Solids were sorted by average depth and faces inside a
   solid kept a fixed order, which is not a valid painter's order for a house with a projecting bay,
   a porch and a wing. The face pairs that were painted the wrong way round, by area, were the stone
   plinth against the ground-storey wall (`stone#0` / `wall#5`, by far the largest), wall against
   wall at the re-entrant corner of the bay (`wall#5` / `wall#6`), the porch roof against the wall
   behind it (`wall#7` / `roof#20`) and the roof planes against each other (`roof#10`, `roof#11`,
   `roof#12`). Example frames: `examples/order-plinth-over-wall-*`, `order-roof-planes-*`,
   `order-wing-and-roof-*`, `order-wall-through-roof-*`.
2. **Faces cutting through each other.** The solids overlap in the source (the plinth runs into the
   walls, the porch roof into the bay wall, the roof planes cross at the valleys). No ordering of
   whole faces is correct there, so a sort cannot fix it. 36 of the 117 faces of solids were cut by
   another solid and 21 lay wholly inside one.
3. **Faces that are not flat or not convex: none.** All 474 source faces are planar (within 2 mm),
   convex and non-degenerate, and every solid's faces wind outward. This was checked and is not a
   cause.
4. **Detail lines and decals out of order.** Decals and hairlines were painted with their solid, in a
   fixed rank, so wherever the host face was in the wrong place the window, the siding or the
   mullions followed it (and could show through a wall in front). They are not a separate cause;
   they are counted in the pairs above.
5. **Anti-aliasing cracks.** Neighbouring flat fills with their own edge strokes left light seams
   on shared edges at some angles and at 2x (see "Part C check" below for the measurement).
6. **Perspective in culling.** Back faces were culled by the view direction, not by the position of
   the eye, so near-edge-on faces were kept or dropped wrongly (the porch roof slope that faces the
   middle of the picture is visible from the front elevation by perspective, and was dropped).
7. **Gimbal and flips.** Orientation was three Euler angles composed in a fixed order. Dragging
   and then rolling or resetting made the house take a long way round: over 2,000 random drag and
   reset paths, **117 took more than 1.5 times the shortest way** (worst 3.1 times), and the
   largest single-frame step was 5.9 degrees for the same input where the quaternion path's is 3.
8. **Container clipping.** The house was fitted to the stage by its size at the rest angle, so
   turning it and tilting it ran it into the edge of the stage. On a phone **807 of the 1,512 grid
   orientations touched the left or right edge of the screen** (the overlay fill was 1.15 of the
   width); with the fit by bounding sphere it is 0 of 1,512.

Not seen: a wrong-winding face (every face is wound outward), gimbal lock at the poles under the new
limit, or fills that were wrong-sided. Evidence files: `analysis-before.json`, `analysis-bsp.json`,
`analysis-euler.json`.

## What was done about each (Parts B to D)

| Cause                                | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1, 2 Draw order and interpenetration | A BSP built at build time (`pnpm model:bsp`, `scripts/build-model-bsp.mjs`, Node built-ins only) and shipped as `house.bsp.json` (about 39 kB, in the lazy chunk). Solids are trimmed where they overlap; the runtime walks the tree from the eye. A unit test rebuilds the tree and compares it with the JSON. Face counts: 117 faces of solids become 153 pieces (36 trimmed, 21 dropped, 6 splits by the partition); detail items 357 to 398. |
| 3                                    | Not a cause. Unit tests now check every face is flat, convex and wound outward.                                                                                                                                                                                                                                                                                                                                                                  |
| 4                                    | Each decal and hairline is attached to a face of its own solid, clipped to it, and painted straight after it.                                                                                                                                                                                                                                                                                                                                    |
| 5                                    | A piece cut by the partition is painted with its own colour as its stroke (`hm-seam`); its real edges are a separate stroke-only path (`hm-open`).                                                                                                                                                                                                                                                                                               |
| 6                                    | Culling uses the eye position.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7                                    | The orientation is a quaternion (`orientation.ts`): small rotations about screen and world axes, the tilt limited by the elevation of the vertical axis, slerp for reset and the morph. 360 degrees returns the same matrix within 1e-9 and the tilt limit holds after 10,000 random drags (unit tests).                                                                                                                                         |
| 8                                    | The fit is by bounding sphere, with the eye kept at least 1.5 radii from any vertex.                                                                                                                                                                                                                                                                                                                                                             |

## Results

Pixel comparison with the z-buffer reference (Part E), on the real SVG painted in unique face
colours (`e2e/phase-14e.spec.ts`): all 1,512 grid orientations and 50 random ones at each of 390x844
and 1440x900, worst mismatch 0.000% (the threshold is 0.3%, with a 1 px edge band ignored).
Phone edge clipping on the grid: 807 of 1,512 before, 0 of 1,512 after. `e2e/phase-14e-behaviour.spec.ts`
covers containment, the phone morph, no flips on drag and roll, the fling cap and a monotone reset.

| Measure                                                | Before (14D)    | After                                                         |
| ------------------------------------------------------ | --------------- | ------------------------------------------------------------- |
| `pnpm size` (brotli, all JS)                           | 137.95 kB       | 144.69 kB (budget 180 kB)                                     |
| Lighthouse mobile, median of 5                         | 99, LCP 2115 ms | 99, LCP 2102 ms (a later run of 3: 99, LCP 2115 ms, TBT 1 ms) |
| Lighthouse desktop, median of 5                        | 100             | 100                                                           |
| Frame cost at 4x slowdown, auto-rotate, 1440x900       | 3.55 ms median  | 3.77 ms median                                                |
| Same, 390x844 (phone, hairlines dropped while turning) | 3.63 ms         | 3.47 ms                                                       |

Frame costs are medians of per-second means taken in interleaved runs (`frame-cost-cmp.txt`) because
this machine was several times slower than on the day the 14D figure (3.5 ms) was taken, with other
programs running. Both builds were measured side by side in the same session.

Full `pnpm test:e2e` (`e2e-baseline.log` for 14D, `e2e-after.log` for this phase, 1,095 tests on five
projects): the baseline had 3 failures (the model-chunk timing test on Mobile Chrome and
reduced-motion, and the WebKit drag test). The first run after the change failed 22 tests: the
WebKit drag again, and 21 in `phase-14d.spec.ts` that assumed things that changed on purpose (see
below). Those were fixed and `phase-14c`, `phase-14d` and `phase-14e-behaviour` were rerun on all
five projects and pass. The full suite was not run again after those last fixes.

Changes made to existing tests, and why (none loosens what it checks):

- The 14D morph test looked for no `hm-roof` path at morph 0.7. The porch roof belongs to the porch,
  which is taken down later, and its slope is correctly visible from the front by perspective (the
  old culling dropped it). The test now counts roof pieces that are part way through dissolving
  (they carry an opacity): some at 0.55, none at 0.7.
- The 14D phone contrast test read `fill`; face colour is now carried by `color` (fill is
  `currentcolor`) and stroke-only paths have no fill.
- The 14D phone layout test needs the house to run behind the headline. The house is now fitted
  inside the screen by bounding sphere (overlay fill 0.96 instead of 1.15), so it is smaller, and
  `overlayCentreY` moved from 0.46 to 0.49 so its ground line still runs behind the headline.
- A fling is capped at 360 deg/s (it was unbounded); a WebKit drag with very fast pointer events
  used to spin the house through more than half a turn, which made the 14C drag test read a
  negative turn.
- The reset test no longer depends on the frame rate: it checks that every axis tip keeps coming
  nearer its final place.

## Independent review

Not done. The brief asks for a fresh-context reviewer given only the before and after frames, the
drag recordings and the brief's list, with its findings and the responses recorded here. It was not
run before this was committed, so nothing here should be read as reviewed.

## What is still weakest, and what was not finished

- **No independent review** (above).
- **Anti-aliasing cracks (Part C) are not measured.** Two attempts at counting enclosed background
  specks at 1x and 2x were not conclusive (the first counted wall tones close to the background; the
  second was interrupted). The `hm-seam` stroke is meant to close them, and the 14D to 14E frames
  show no visible seams, but there is no number.
- **Frame-cost peak.** The target is a 6 ms peak. At 4x slowdown on this machine the slowest frame in
  a second is 7 to 16 ms in auto-rotate for both builds (the unchanged 14D build as well), and the
  spikes are scattered rather than periodic, which points at the machine (garbage collection and other
  programs) rather than the drawing; this was not shown on a quiet machine. The median target of 4 ms
  is met.
- **The phone house is smaller** than in 14D (about 17% at rest) because it is now fitted by
  bounding sphere so it never touches the screen edge at any rotation. This is a visible change to
  the 14D look that the brief's "never clips" requirement forces; a rest-angle fit would bring it
  back at the cost of clipping at other angles.
- The drag recordings in `before/` and `after/` were made before the last centre and fling changes.
- The full end-to-end suite was not rerun after the last fixes.
