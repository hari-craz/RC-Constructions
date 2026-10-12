# Phase 11 — Design Review (building as protagonist)

Method: built the site, captured screenshots at 1904x1080, 1440x900, 768x1024 and 360x640 (settled section shots, building crops per stage, mid-transition frames), read them, fixed, then handed only the "after" screenshots and the issue list to a fresh subagent with no access to the code. This document records its findings and my response. It does not certify anything.

## Independent reviewer findings and responses

| #   | Finding (reviewer)                                                                                 | Response                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | Hero title clipped to "CONSTRUCT" at 360 wide.                                                     | Confirmed (text block capped at 58vw on mobile). Fixed: full width and `clamp(3rem, 14vw, 5rem)` headline on mobile.                                                  |
| 3   | "15.40 m" label runs to the window edge at 1440.                                                   | Confirmed. Dimension rail moved closer to the building and label set at 15 px; it now clears the edge by about 16 px at 1440. Still tight.                            |
| 4   | Survey plan runs under the header at 360/768.                                                      | Confirmed. Plan top now starts below the header on mobile and tablet. Desktop survey composition (plan top-right, title bottom-left) is unchanged; see weakest list.  |
| 1   | Projects image slot is a flat grey placeholder.                                                    | Accepted as a placeholder by brief ("Elevation drawing to come"); it is now a deliberate 16:9 slot, separate from the register. No imagery is generated.              |
| 5   | Foundation stage: large empty window, slab in bottom 10%.                                          | Valid. Foundation is below grade by nature. Not changed; listed as weakest.                                                                                           |
| 6   | Building about 40% of window width on large screens; 160 px wide on mobile.                        | Valid. Height meets the 60% rule; width and mobile scale are limited by the 4:3 viewBox. Not changed; listed as weakest.                                              |
| 7   | Dimension labels thin/tiny; some mobile dimension lines touch the band edge; label missing at 768. | Partly addressed (spacing). Labels are intentionally hidden below 1024 px because they would be about 5 px. Not fixed further.                                        |
| 8/9 | Dimmed outgoing sheet looks grey; text cut mid-line by header and next sheet in transition frames. | The dim is formwork at 10% over the sheet's own surface and the cut is the slide-over itself. I do not consider the cut a defect; the grey cast is real. Not changed. |
| 8   | Stats mid-count and amber labels half-faded in one transition frame.                               | Expected scrubbed motion mid-transition. Windows switch flat (no blend); the dimension labels fade by opacity.                                                        |
| 10  | Hard seam between the sheet header and the dark window header.                                     | By design (two grid zones). Kept.                                                                                                                                     |
| 11  | Founder and Contact: unanchored right side at 1904, contact left column shorter than the form.     | Valid, not changed (out of the requested scope beyond grid alignment).                                                                                                |
| 12  | Services/Process sub-copy small and low contrast.                                                  | Sub-copy is 14 px on `#454944` (about 6:1 on concrete). Left at 14 px; the label floor is met.                                                                        |

The reviewer did not open the building crops or 768 transitions, so those were reviewed by me only.

## Before / after index

Folder: `docs/review/phase-11/before/` and `docs/review/phase-11/after/`. File pattern `<viewport>-0N-<stage>.png` for sections, `<viewport>-building-0N-<stage>.png` for the window crop, `<viewport>-transition-*` for mid-transition frames (after only). The before set has no building crops or transitions.

| Path suffix     | What changed                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------- |
| `01-survey`     | Labels removed; plan stays below header on mobile; hero text aligned to the grid.             |
| `02-foundation` | Fixed 58% dark site window; excavation, footings, tie beam, slab drawn solid.                 |
| `03-structure`  | Concrete frame, four levels and stair core, drawn level by level; services as ruled rows.     |
| `04-envelope`   | Limewash walls, dark openings, parapet; Projects slot and register separated.                 |
| `05-fitout`     | Frames, mullions, doors, canopy, stair flights, railings.                                     |
| `06-completion` | Eleven flat amber windows, name plate, two dimension lines (was oversized translucent amber). |
| `07-founder`    | Eyebrow removed; left edge on the grid.                                                       |
| `08-contact`    | Eyebrow removed; required/optional tags darkened for contrast.                                |

## What is still weakest (my ranking)

1. Foundation stage: correct for a below-grade stage but the window is mostly empty dark.
2. Building width: about 40% of the window on wide screens and about 165 px on a 360 phone; the building could be wider or the viewBox tighter.
3. Hero survey on desktop: plan small at top-right with empty centre; thin strokes.
4. Founder and Contact: left-weighted, unanchored right side at 1904 and 2560; not rebalanced.
5. Mobile band: dimension labels and name plate hidden for size, so the drawing is less tied together.
6. Dimmed outgoing sheets read slightly grey on concrete.
7. Mobile Lighthouse performance does not reach the 93 target in this environment (same as baseline).
