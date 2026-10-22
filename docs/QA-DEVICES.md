# RC Constructions — Physical Device QA Script

This protocol validates scroll physics, dynamic viewports, and visual stability on actual physical hardware. Test each scenario and check off results.

---

## 1. iPhone Safari (iOS 17+)

**Target**: Mobile WebKit dynamic viewport (`100dvh`), address bar collapse/expand, and touch flick inertia.

- [ ] **Address Bar Retraction**:
  - Load the page in Safari portrait mode. Observe full hero viewport.
  - Slowly scroll down: as the URL bar collapses into the bottom bar, verify there is **zero vertical content jumping or jitter**. The hero remains pinned and survey lines maintain coordinate positions.
- [ ] **Address Bar Re-expansion**:
  - Scroll back to the top: as the URL bar expands to full height, verify the headline remains fully within the viewport without clipping.
- [ ] **Fast Inertial Flicks**:
  - Rapidly flick up and down. Verify Lenis / GSAP smooth scroll dampens cleanly with zero blank tile gaps, zero white flickering, and zero horizontal drift.
- [ ] **Sticky Sheet Rounding**:
  - Scroll past the hero into the About section. Verify the incoming sheet's top corners start at 32px and square off as it covers the hero, the hero dims (formwork at 10%), and there are no dark side bars or grey strips.

---

## 2. Android Chrome (Modern Pixel / Galaxy)

**Target**: Android Blink address bar resizing, hardware layer rasterization.

- [ ] **Address Bar Collapse**:
  - Scroll down: confirm the dynamic toolbar hides smoothly without jumpy recalculation.
- [ ] **SVG Line Drawing Performance**:
  - Reload page at top: verify the 3D house fades in and turns smoothly without dropped frames (it redraws about 30 times a second while auto-rotating).
- [ ] **No Horizontal Overflow**:
  - Attempt horizontal dragging anywhere across the page. Confirm `overflow-x: clip` prevents any sideways panning.

---

## 3. macOS / Windows Precision Trackpad

**Target**: Sub-pixel touchpad delta interpolation and smooth gesture handling.

- [ ] **Slow Inertial Scrolling**:
  - Lightly drag with two fingers. Verify Lenis provides frictionless momentum scrolling.
- [ ] **Sudden Direction Reversal**:
  - Scroll down and immediately reverse upward mid-transition. Verify ScrollTrigger handles velocity inversion smoothly with no visual jumping.

---

## 4. Physical Stepped Mouse Wheel

**Target**: Discrete notched wheel events (standard 100px stepped notches).

- [ ] **Stepped Interpolation**:
  - Scroll down one notch at a time. Verify discrete wheel events are smoothed into continuous fluid translation rather than jarring discrete jumps.
- [ ] **Rapid Wheel Spins**:
  - Spin the wheel rapidly. Confirm lag smoothing caps velocity gracefully and prevents uncontrolled runaway scrolling.

---

## 5. 120 Hz Display (ProMotion / Gaming Monitor)

**Target**: High-refresh frame synchronization and GSAP ticker alignment.

- [ ] **Ticker Cadence**:
  - Verify animations render at a buttery 120 FPS without frame tearing or micro-stutters.
- [ ] **Scroll Synchronization**:
  - Confirm Lenis and GSAP ScrollTrigger tick in lockstep on the native 120 Hz refresh rate.

---

## 6. Landscape Mobile / Tablet Orientation

**Target**: Vertical headroom constraint and responsive text wrapping.

- [ ] **Headline Visibility**:
  - Rotate iPhone or Android phone to landscape mode.
  - Verify "RC Constructions" headline shrinks gracefully via clamp fluid typography and remains fully readable without overlapping the navigation bar.
- [ ] **Survey Plot Headroom**:
  - Ensure the SVG drawing scales responsively and dimension callouts do not collide with the headline block.

---

## 7. Browser Zoom (200% and 400% WCAG Scaling)

**Target**: Low vision accessibility and layout resilience under high magnification.

- [ ] **200% Zoom (Desktop Chrome/Firefox/Safari)**:
  - Zoom to 200%. Verify text reflows cleanly without overlapping, buttons remain clickable, and no horizontal scrollbar appears.
- [ ] **400% Zoom (WCAG 1.4.10 Reflow Requirement)**:
  - Zoom to 400%. Ensure headline stacks properly, interactive links are accessible via keyboard Tab key, and skip link remains operational.

---

## 8. Polish & Interactive Systems QA (Phase 8 & 9)

### A. Loading Sequence (Non-blocking Dimension Line)

- [ ] **First Visit**: Reload in an incognito window. Verify hairline amber dimension line draws left-to-right along the viewport baseline (capped at 1.2s max), fading out cleanly without obscuring content or blocking clicks.
- [ ] **Session Skip**: Refresh the tab within the same browser session. Confirm the loading line is immediately skipped (`sessionStorage` check `rc_intro_seen`).
- [ ] **Storage Exception Resilience**: Disable cookies/storage in browser settings. Confirm the page mounts normally without throwing unhandled exceptions.

### B. Survey-Marker Cursor

- [ ] **Fine-Pointer Only**: On a desktop with mouse or trackpad, verify the optical survey marker crosshair tracks pointer movement smoothly.
- [ ] **Touch Device Isolation**: On touch devices (iPhone, iPad, Android phone), verify the custom cursor is **never instantiated** (`(hover: hover) and (pointer: fine)`).
- [ ] **Text Input Protection**: Move pointer over form inputs (`input[name="name"]`, `textarea`). Verify marker fades out completely and the native I-beam caret operates cleanly.
- [ ] **Contextual State Morphing**:
  - Hovering over buttons/links opens the crosshair into a 28px square bracket frame.
  - Hovering over project register rows expands the frame and shows the Newsreader "Open" label.
  - Tone shifts automatically between Ink on light sheets and Limewash on dark panels.

### C. Project Detail Overlays

- [ ] **Activation & Rise Animation**: Click any project row in Section 04. Verify the detail sheet rises from the bottom (0.7s `power2.out`, 32px top-corner radius), while the background dims 40% and scales down to 0.94.
- [ ] **Focus Management**: Verify focus immediately moves to the visible "Close" button. Press Tab repeatedly to confirm focus remains strictly trapped within the dialog.
- [ ] **URL Hash Syncing & History**:
  - Verify URL updates to `#project-<slug>`.
  - Press browser Back button: verify overlay closes and URL returns to `#envelope`.
  - Reload page directly on `#project-<slug>`: verify overlay opens once ready with Projects section scrolled into place behind it.
- [ ] **Dismissal & Focus Return**: Press `Escape` or click "Close". Verify background `inert` attribute is removed and focus cleanly returns to the triggering project row button.

- [ ] **Adjacent Project Navigation**: Click "Next: [Project Name]" or "Previous: [Project Name]". Verify content transitions and hash updates without closing the sheet.

### D. Contact Form & Security Gates

- [ ] **Validation & Announcement**: Submit form empty. Verify focus jumps to the first invalid field and screen-reader error alerts trigger.
- [ ] **Honeypot Bot Defense**: Submit form with hidden `_gotcha` field populated. Confirm submission is dropped silently without initiating a network request.
- [ ] **Double-Submit Lockout**: Rapidly double-click "Send enquiry". Confirm only one network submission occurs and button enters disabled state.
- [ ] **Network Fallback**: Disconnect network and submit. Confirm user-entered values are preserved and direct phone/email fallback channels display.

---

## Phase 12 additions

- **Motion starts on first input.** The building mounts and Lenis starts on the first pointer, wheel, touch, key or scroll event (or immediately for an anchor URL). On every device: load the page, wait, then scroll once; the first scroll must not stutter and the building must appear by the About section.
- **WebKit variable fonts.** Playwright's WebKit build on Windows renders Big Shoulders Display (variable) at a hairline weight with wide tracking. This is a limitation of that test build, not seen in Chromium or Firefox; confirm on a real iPhone that headings are bold and condensed.
- **Phone layer.** (Phase 14D replaced the Phase 12 band.) Check the building fills at least 80% of the screen width at 360, 390 and 412 px wide and is centred in the screen; see Phase 14D additions.
- **Native cursor.** On a touch laptop with a mouse, the Windows arrow must be hidden and the survey crosshair shown.
- **Font preload warning in WebKit (Windows test build).** The console test ignores one message there: the two font preloads reported as "not used". The fonts are loaded and used; check on a real iPhone that no such warning appears and that the fonts are not downloaded twice (Network tab).

---

## Phase 14 additions

- **Story sync.** Scroll slowly from the top. The window slides in only after the hero house has faded out. Through About the foundation is drawn; through each of the six Process steps the building advances in parts (structure, envelope, fit-out) and each part is complete when that step's text is centred. Scroll back up: the building un-builds exactly. Tap an anchor in the header: the building lands on the same state as scrolling there.
- **Header indicator.** At 1024 px and below 1280 px, and on a phone, the button names the current section; the list opens full width, Escape closes it, focus returns to the button. At 1280 px and above, check the six links never touch the logo or Enquire. Targets are at least 44 px.
- **Projects preview.** Hover a row on a laptop and tab through them on a phone with a keyboard or switch: the drawing in the window changes with a soft fade; leaving the list returns to the finished building. On a phone, check the drawer is a full-screen sheet and Previous and Next scroll the row into view behind it.
- **Form focus.** Tab through the enquiry form: each field shows a dark outline and a thicker bottom edge, never amber, and nothing jumps.
- **Reduced motion.** With reduce motion on, the building changes state when a section or step comes into view, with no scrubbing and no cross-fade.

---

## Phase 14C additions

- **The 3D house.** On a laptop: it turns by itself, pauses under the pointer and resumes about three seconds after you leave; drag turns and tilts it, Shift + drag rolls it, the buttons and keys (arrows, Q, E, 0, Space) work. On a phone: horizontal drag turns it, a vertical swipe on it scrolls the page, a two-finger twist rolls it, and every button is easy to hit.
- **Hand-off.** Scroll slowly out of the hero: the house settles to a straight-on elevation, fades, then the window arrives; scroll back and it returns to the pose it had.
- **Reduced motion.** The house does not turn by itself and buttons snap with no easing.

## Phase 14D additions

- **Detail.** Turn the house to six angles (front, side, back, above, below, rolled): windows have frames, sills and head trim, the garage doors show their panels, the gables show shingle rows, the porch has posts on stone bases and three steps. Nothing flickers while it turns.
- **Intro.** Load the hero: the house is raised stage by stage in about three seconds, then starts to turn. With reduce motion on it is already finished.
- **Morph (desktop).** Scroll slowly out of the hero: the house settles to a front elevation, moves and scales onto the building window's ground line and width as the window slides in, then dissolves roof first, then upper storey, ground storey and porch, leaving its plinth; the foundation is dug where it stood. Scroll back up: it reassembles exactly. Tap Principles in the header: the building is at the foundation.
- **Phone and tablet.** The house is the background of the hero with the text over it (it can be dragged, swiped past, and rolled with two fingers). Scroll on: the text fades, the page turns dark, the house lands low on the screen and dissolves, then the building is built behind the text as each section is read. Check at 360x640, 390x844 and 768x1024 that text is legible everywhere (the muted drawing is faint by design; Work delivered has lit windows and plates), that nothing scrolls sideways, and that a turn from portrait to landscape at 1024 px switches cleanly to the desktop layout.
- **Reduced motion.** The house stays finished and still while the hero is in view and is swapped for the building, with no animation, once the hero has left.
- **Performance.** On a mid-range phone, drag the house: it follows the finger (hairlines return when you let go).

---

## Phase 15A manual pass (done on a laptop with browser emulation; real devices still to do)

Checked by hand or script in Chromium at 360x640, 390x844, 412x915 (Pixel 7), 768x1024 and 1440x900, in WebKit and Firefox at desktop size, and in a container (`docs/review/phase-15a/`). Items that only a real device can confirm are marked **needs real device**.

| Check                                                                                                     | Result                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| No sideways scroll at 360, 390, 768 and 1440 px, every section                                            | Pass (`e2e/phase-14d.spec.ts`, `e2e/phase-15a.spec.ts`)                                        |
| Phone control strip: Turn, Tilt, Reset, Auto-rotate, More; 44 px targets; no wrapping at 360 px           | Pass (`e2e/phase-15a.spec.ts`)                                                                 |
| Text legible over the building at every scroll position (390 and 768)                                     | Pass (pixel sampling, `e2e/phase-14d.spec.ts`)                                                 |
| Detail under text cleared by region; none cleared at 1440 px                                              | Pass (`e2e/phase-15a.spec.ts`); frames in `docs/review/phase-15a/after/`                       |
| No JavaScript: static house, then the finished building, desktop and phone width                          | Pass (`e2e/phase-15a.spec.ts`)                                                                 |
| Reduced motion: no morph, no auto-rotate, snap on buttons                                                 | Pass (`chromium-reduced-motion` project)                                                       |
| Keyboard only: tab through the hero controls, the header and the form                                     | Pass (existing specs); focus rings are 2 px ink                                                |
| Form with a mocked endpoint, the spam trap, the "sending is switched off" sentence only without a form ID | Pass (`e2e/contact.spec.ts`, `src/sections/Contact/Contact.test.tsx`, a no-ID container build) |
| Two-finger twist rolls the house                                                                          | **Needs real device** (Playwright cannot make a two-finger gesture)                            |
| iOS Safari and Android Chrome address bar showing and hiding without the page jumping (`100svh` layer)    | **Needs real device**                                                                          |
| Touch flick inertia, trackpad, stepped mouse wheel, 120 Hz smoothness                                     | **Needs real device**                                                                          |
| Real font rendering and text sharpness on a phone; dark-mode or forced-colours settings                   | **Needs real device**                                                                          |
| House frame rate on a mid-range phone (laptop measurement: about 3.5 ms a frame at 4x slowdown)           | **Needs real device**                                                                          |
