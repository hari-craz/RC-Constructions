# Design review, Phase 14C (`docs/DESIGN-REVIEW-phase-14c.md`)

Method: a fresh subagent with no access to code or earlier versions saw only the screenshots in `docs/review/phase-14c/after/` (and the `before/` folder for comparison) and the Phase 14C goals. Its findings and my responses are below. This file records findings and what is still weak; it does not declare the work finished.

## Before and after index

| Subject                 | Before (`docs/review/phase-14c/before/`)      | After (`docs/review/phase-14c/after/`)                                                  |
| ----------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Hero at four widths     | `<vp>-01-hero.png` (survey plan)              | `<vp>-01-hero.png` (3D house, controls, gizmo, hint)                                    |
| The house at six angles | none                                          | `1440x900-model-1..6-*.png`, `390x844-model-1..6-*.png`                                 |
| Hero to window hand-off | `<vp>-transition-hero-window-80/60/40/20.png` | `<vp>-transition-hero-window-100/80/60/40/20/0.png` at 1904, 1440, 1280, 1024, 768, 390 |

The "before" frames are the Phase 14B build.

## What was built

- **Model**: `src/lib/model3d/` (plain data, about 110 vertices; rotation and projection maths; painter's sort by solid; back-face culling) rendered into one inline SVG by `src/components/HeroModel`. No dependency added. The lazy chunk is 17 kB (6 kB gzip); `pnpm size` went from 128.26 kB to 133.82 kB.
- **Controls**: auto-rotate (20 s a turn, 8 degree bob, redrawn at most 30 times a second), drag with inertia, Shift + drag and two-finger twist for roll, eight buttons, keyboard, axis gizmo, hint. Vertical swipes on the model scroll the page on touch (`touch-action: pan-y`; tested with real touch events).
- **Hand-off**: the house eases to its front elevation, then fades by opacity only; the controls and hint fade first.

## Reviewer findings and responses

| #   | Finding                                                                                        | Response                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Blocker: the garage roof reads as broken (a wall-coloured lid drawn over the roof slopes).     | **Fixed.** The wall boxes under a roof no longer have a top face (the roof closes them). See `1440x900-model-1-rest.png` and `-3-right-side.png`.                                                                                                                                                                                                             |
| 2   | Blocker: the dark window slices the house at 768 and 390 (frames 40 and 20).                   | **Fixed.** The house is gone before the sheet's edge reaches its base (phone 56%, desktop 30% of the hand-off). The frames now show the empty hero area instead.                                                                                                                                                                                              |
| 3   | The light sheet slices the faded house at 60% on desktop; controls sliced on tablet and phone. | **Fixed with 2.** The controls and hint fade first (first 10% of the hand-off), the house by 30%.                                                                                                                                                                                                                                                             |
| 4   | Dimension lines and labels run over the model; labels too small and heavy on small screens.    | **Partly fixed.** The height dimension moved to the back-right corner, the width label sits below the ground line, dimensions shorter than 70 units are hidden, and label text is enlarged so it is never under 12 px on screen. The ink label tags are kept (they carry the 8.5:1 contrast on concrete). At some angles a dimension still crosses the model. |
| 5   | The garage roof and porch are mis-ordered in side-on views (porch over the main wall).         | **Open.** Painter's sort by solid mean depth is ambiguous when solids sit side by side along the view axis. A per-pair separating-plane sort would fix it.                                                                                                                                                                                                    |
| 6   | Tilt and roll allow broken-looking below-the-ground views.                                     | **Not changed.** The brief asks for a tilt clamp of about 80 degrees and a free roll; the views are correct, if unusual.                                                                                                                                                                                                                                      |
| 7   | Eight equal buttons are heavy; crowding the headline on tablet and phone.                      | **Spacing fixed** (more room above the headline); weight not changed (ink outlines and 44 px targets are required by the brief).                                                                                                                                                                                                                              |
| 8   | The gizmo floats at the top of the page, detached from the house.                              | **Fixed.** It sits at the bottom-left corner of the model area, with larger letters.                                                                                                                                                                                                                                                                          |
| 9   | The first view is mid-rotation, not the rest angle.                                            | **Fixed.** The house holds the rest angle for 1.5 s before it starts turning.                                                                                                                                                                                                                                                                                 |
| 10  | On a phone the house spans about 65% of the width.                                             | **Open.** The fit is a bounding sphere so the house never clips at any rotation; a tighter fit would clip at some angles.                                                                                                                                                                                                                                     |
| 11  | The hero shows an empty grey area during the middle of the hand-off on tablet and phone.       | **Open.** The house must be gone before the sheet reaches it; the hero has no other content up there.                                                                                                                                                                                                                                                         |

## Measured cost

Per update (buildFrame plus DOM writes) at a 4x CPU slowdown, on a loaded Windows machine: about 3 to 4 ms when the machine is quiet, and up to about 12 ms while other programs were busy (about 0.1 ms for the maths alone in Node, warmed). Auto-rotate updates at most 30 times a second, so the amortised cost per displayed frame is about 1.5 to 2 ms. The per-update figure is above the 2 ms target.

## Weakest points still on the page

1. Depth ordering in side-on views (finding 5).
2. A per-update cost of 3 to 4 ms at 4x slowdown (above the 2 ms target per update).
3. On a phone the house fills about 65% of the width (finding 10).
4. Dimension lines still cross the model at some angles.
5. Eight outlined buttons are visually heavy next to the amber call to action.
6. The empty hero area mid hand-off on tablet and phone.
