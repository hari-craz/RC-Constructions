# Phase 12 — Design Review (speed, scale, last visible defects)

Method: built the production site, captured screenshots at 2560x1080, 1904x1080, 1440x900, 768x1024, 360x640 (Chromium) and 390x844 (WebKit), read them, fixed, then gave only the "after" screenshots and the Part A list to a fresh subagent with no access to the code. This document records its findings and my responses. It does not certify anything.

## Independent reviewer findings and responses

| #    | Finding (reviewer)                                                                                      | Response                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2    | Overlay screenshots show the hero, not the overlay.                                                     | My capture used a wrong slug. Fixed in `scripts/capture.mjs`; the overlay shots now show the open detail sheet at all six sizes.                                                               |
| 4    | Large empty space above the headline on Founder and Contact at 360 and 768.                             | Confirmed: those sections reserved the building band although no window shows. Fixed (`.sheet-inner:has(> .sheet-wide)` uses nav height only on phones).                                       |
| 9    | At 2560 the "17.40 m" dimension is hidden under the header; the name plate text is small.               | Confirmed. The viewBox has 20 units of headroom, the width dimension line sits lower with its label below the line, and the plate text is 11.5 px on a wider plate. See remaining check below. |
| 1a   | Founder portrait is an empty outlined block with a caption.                                             | Intended by the brief (quiet block, one sentence, no `<img>`) until a real photo is committed; flip `portraitAvailable`.                                                                       |
| 1b-d | "20XX", "Elevation drawing to come", dummy phone and address read as unfinished.                        | These are content placeholders supplied before this phase; not changed.                                                                                                                        |
| 5    | Foundation stage: top half of the window is blank; rebar cages are hairlines.                           | Valid and still the weakest stage. Added excavation steps, pegs, profile string, level staff and reinforcement cages; it still reads bottom-weighted. Not solved.                              |
| 6    | Hero to Foundation: the dark window is absent until the transition completes and then appears.          | Valid. The window fades in when the Foundation section becomes active. Making it follow the sheet edge would cover the hero plan. Not changed.                                                 |
| 3    | 360: text clipped at the band edge mid-transition; incoming sheet starts with an empty band-height gap. | The cut is the slide-over; the gap is the reserved band. Left as is.                                                                                                                           |
| 7    | Text is small at 2560; Founder is sparse.                                                               | Valid. Body is capped at the 18 to 20 px token. Not changed.                                                                                                                                   |
| 8    | Send enquiry button looks enabled.                                                                      | The form ID is configured on this machine, so the button is enabled; the disabled state is covered by the unit-level style and e2e test when the ID is missing.                                |
| 10   | Mid-transition frames crop headings and stats.                                                          | Expected for a slide-over; there are no dark side bars, grey bars or square corners left.                                                                                                      |

The reviewer did not open the WebKit files or the building crops.

## Defects reproduced and fixed (Part A)

| #   | Cause and fix                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `public/images/` was never committed, so `/images/founder-gokul.*` 404ed and the alt text printed over the placeholder. Now no `<img>` renders until `portraitAvailable` is true; test fails on any image with `naturalWidth === 0`.           |
| 2   | Removed "// ..." and "ARCHITECTURAL DRAWING SLOT"; test fails on visible "//" or PLACEHOLDER text.                                                                                                                                             |
| 3   | Building is 78% of the window width on desktop and 80% or more of the band on phones (tests at 1440, 1904, 2560 and phones); Foundation gained a stepped excavation, pegs, profile string, level staff, reinforcement cages.                   |
| 4   | Founder and Contact use a centred 75rem grid; tests at 1904 and 2560.                                                                                                                                                                          |
| 5   | The dark side bars and the "dark block" were the page background showing beside a scaled-down sheet (`scale: 0.94`). Sheets no longer scale; dim and corner radius remain. Frame captures at three scroll positions per transition, all sizes. |
| 6   | Completion verified at rest: fifteen flat amber windows, name plate, dimension lines.                                                                                                                                                          |
| 7   | Contact spacing tightened; disabled button is flat with text at 4.5:1 or better and the sentence beside it.                                                                                                                                    |

## Before / after index

Folders: `docs/review/phase-12/before/` and `docs/review/phase-12/after/`. Patterns: `<viewport>-0N-<stage>.png` (sections), `<viewport>-building-0N-<stage>.png` (window crop, desktop and phone), `<viewport>-overlay.png`, `<viewport>-transition-<from>-<to>-<80|50|20>.png`; WebKit files are prefixed `webkit-390x844-`. The before set has no WebKit files.

| Path suffix                   | What changed                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `01-survey`                   | Plan intro is CSS; headline no longer clipped on phones.                                     |
| `02-foundation`               | Stepped excavation, pegs, string, level staff, reinforcement cages; building scale enlarged. |
| `03-structure` to `05-fitout` | Wider four-bay building; same scale as the other stages.                                     |
| `06-completion`               | Fifteen flat amber windows; dimension lines kept clear of the header.                        |
| `07-founder`, `08-contact`    | Centred grid; no broken image; plain sentences; tighter rhythm.                              |
| `overlay`                     | "Drawing to come" in place of the code-comment label.                                        |
| `transition-*`                | No dark side bars or grey strips.                                                            |

## Cross-browser

See the final report and `docs/QA-DEVICES.md`. Playwright's WebKit build on Windows renders the variable headline font at a hairline weight (also without my font preload); this is treated as a limitation of that build and needs a check on a real iPhone.

## What is still weakest (my ranking)

1. Foundation stage: bottom-weighted; the top half of the window is empty.
2. The window appears (fades in) once Foundation becomes active, not with the sheet edge.
3. Text sizes at 2560 are small relative to the screen; Founder and Contact are sparse there.
4. Content placeholders ("20XX", dummy contact data, "Elevation drawing to come") still read as unfinished.
5. WebKit headline weight is unverified on real Apple hardware.
6. The first interaction starts motion; a visitor who never interacts sees no building mount for 8 s (by design).
