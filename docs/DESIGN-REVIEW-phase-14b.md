# Design review, Phase 14B (`docs/DESIGN-REVIEW-phase-14b.md`)

Method: a fresh subagent with no access to code or earlier versions saw only the "after" screenshots (`docs/review/phase-14b/after/`) and the Phase 14B checklist. Its findings and my responses are below. This file records findings and what is still weak; it does not declare the work finished.

## Before and after index

Folders: `docs/review/phase-14b/before/` (the Phase 14 build) and `docs/review/phase-14b/after/`. Viewports 1904x1080, 1440x900, 768x1024, 390x844 (plus 1280x800 and 1024x768 for the header and hand-off).

| Subject                      | Before                                         | After                                                               |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| About (foundation frame)     | `<vp>-02-foundation.png`                       | `<vp>-02-about.png`                                                 |
| Process steps (new map)      | `<vp>-05-fitout.png`, `<vp>-process-step-1..6` | `<vp>-process-step-1..6.png`                                        |
| Work delivered (lit windows) | `<vp>-04-work-delivered.png`                   | `<vp>-04-work-delivered.png`                                        |
| Phone and tablet hand-off    | `<vp>-transition-hero-window-*` (390, 768)     | same names (390, 768, 1024), plus `after/partD/touch-hero-window-*` |
| Sheet boundaries on a phone  | not captured                                   | `after/partD/390-<from>-<to>-<20                                    | 40  | 70>.png` |
| Founder and Contact, wide    | `1904x1080-07-founder.png`, `-08-contact.png`  | `after/partD/2560-founder.png`, `2560-contact.png`                  |
| Services heading on a phone  | `390x844-05-services.png`                      | `390x844-05-services.png`                                           |

## What changed (answers to the brief)

- **A. Map.** Steps 01 to 03 complete the foundation (`foundation:1`), 04 structure, 05 envelope, 06 fit-out; Work delivered is two parts. Copy untouched.
- **B. Phone and tablet hand-off.** Cause: the arriving sheet reserves space for the band, but the band slid in from above the viewport, so the reserved space showed as an empty slab. The band now rides up with the sheet's top edge, the plot fades over the whole hand-off, and the foundation starts drawing as the hand-off begins (`windowEnterViewport` 1). Test: no run of sheet-coloured rows taller than 20% of the viewport at 390, 768, 1024 and 1440.
- **C. Lit windows.** Completion was split: the plate and dimension lines run until the headline is centred, and the windows light only after. Test at 390, 768 and 1440 asserts no lit window while the headline is below the reading centre. Phone sync now uses the area below the band.
- **D1** not reproduced at an anchor (sheet top 0, limewash under the header, tested at four widths); the grey seen is the hero during the hand-off. **D2** fixed: a site camera lifts the foundation frame (270 units desktop, 190 phone) and settles during step 04. **D3** not reproduced as stated (the content is centred, not left-aligned; see 2560 shots), but see weakest point 4. **D4** not reproduced (no foreign sheet shows through Founder; tested by `elementFromPoint` at 390 and 1440). **D5** not reproduced (heading is below the band after an anchor jump and after the indicator; tested at 390 and 768). **D6** the "dot" is the "18.40 m" dimension label chip and the four corner survey pegs of the plot; no stray element in the plot container. It greys because the plot fades over a dimmed hero. Kept as part of the drawing. **D7** nothing in `src` references the images except the Founder portrait, which only renders when `photoAvailable` is true; it is false. A load failure now falls back to the placeholder (`onError`), and `portrait.test.ts` requires real files of the right type before the flag can be switched on. `public/images/` is not committed: the `.webp` is a JPEG renamed.

## Reviewer findings and responses

| #   | Finding                                                                                                        | Response                                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hand-off leaves 30 to 42% blank grey and an empty dark band at touch widths.                                   | **Fixed in the last pass.** The plot now fades over the whole hand-off and the foundation draws from the start of it (`390x844-transition-hero-window-60.png`). The pixel test measures sheet-coloured rows only; grey hero or dark band rows were not counted as empty before this change, which is why the first test passed. |
| 2   | Phone sheet arrivals show about 44% blank sheet under the band.                                                | **Open.** The sheet's top padding clears the band's final position. Not changed in this phase.                                                                                                                                                                                                                                  |
| 3   | Tablet and phone building runs about a step ahead.                                                             | **Partly.** Sync uses the reading area below the band. The capture script still centres each step in the full viewport, so phone and tablet step shots look ahead; the sync test measures the reading area.                                                                                                                     |
| 4   | Desktop About frame low in a mostly empty window.                                                              | **Improved** (lift raised from 230 to 270 units); ground line is near 53% of the window height. Zoom is kept at 1 because the level labels at the left edge clip when enlarged.                                                                                                                                                 |
| 5   | Outgoing About strip with sliced headline at the top of step 1; grey slabs during transitions.                 | **Open.** It is the sheet stack's dimmed outgoing sheet (Phase 3 design).                                                                                                                                                                                                                                                       |
| 6   | Founder placeholder reads "Photo to come, 1200 by 1500"; Founder grid differs from other sheets; double frame. | **Placeholder fixed** ("Portrait of Gokul, founder"). Grid alignment and the border-plus-crop-marks frame are open.                                                                                                                                                                                                             |
| 7   | 768 camera has no headroom; parapet touches the header; width dimension missing; ruler hugs edge.              | **Open.** Pre-existing band geometry at 768.                                                                                                                                                                                                                                                                                    |
| 8   | Dimension chip "dot" on the mobile hero; chip missing from the static hero; survey cursor marks on touch.      | Chip is part of the drawing (D6). The cursor marks were seen only in a desktop-pointer capture; the cursor does not mount on touch devices (`hover: hover` and `pointer: fine`). The chip appearing after first input is the hero reveal, unchanged.                                                                            |
| 9   | Sample note, services table header, phone header says "Sections" on Founder, projects meta wrapping.           | **Not changed.** Sample note is required content until real projects exist; the rest are earlier-phase layouts.                                                                                                                                                                                                                 |

Assertions changed because they asserted the old behaviour: the Founder note text (`completion-founder.spec.ts`, `phase-12.spec.ts`), `PARTS` and step-end ratios in `phase-14.spec.ts`, part indexes in `phase-11.spec.ts`, and the ground-slab ratio skipping the `#fitout` anchor (the slab is now drawn across About and steps 1 to 3).

## Weakest points still on the page

1. Sheet arrivals on phones still reserve about 40% of the screen below the band (finding 2).
2. The outgoing sheet's dimmed strip with a headline cut through it at the top of step 1 (finding 5).
3. The 768 band geometry: parapet against the header, missing width dimension (finding 7).
4. Founder and Contact sit on a different grid and left edge from the other sheets, with large side margins at 2560.
5. The level ruler hugs the window edge and reads as noise on phones.
6. Rounded top corners on arriving sheets against a drafting aesthetic.
7. All lit windows are solid amber, and the name plate text is too small to read.
8. "Sample projects for this demo." is visible to the public.
