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
  - Scroll past the hero into Section 02. Verify the outgoing hero sheet rounds to 32px smoothly while the dimming overlay darkens without stutter.

---

## 2. Android Chrome (Modern Pixel / Galaxy)

**Target**: Android Blink address bar resizing, hardware layer rasterization.

- [ ] **Address Bar Collapse**:
  - Scroll down: confirm the dynamic toolbar hides smoothly without jumpy recalculation.
- [ ] **SVG Line Drawing Performance**:
  - Reload page at top: verify the initial survey plot draw (boundary, setback, footprint, stakes, dimension ticks) renders at 60 FPS without dropped frames.
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
