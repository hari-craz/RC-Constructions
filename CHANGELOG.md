# Changelog

Release-please adds a section here for each tagged release. Until `v0.1.0` is tagged (Phase 15B), this is a plain summary of what each phase did, for people who do not read commit messages.

## Phases 1 to 15A: summary (unreleased)

- **1 to 3, foundation.** Project scaffold and tooling; GitHub Actions, Docker (non-root Nginx on port 8080) and Vercel hosting; design tokens, the smooth-scroll engine and the stack of sheets that slide over each other.
- **4 to 5, hero and first audit.** The opening survey drawing and headline, the navigation, and a first independent audit of code, security, accessibility and design.
- **6, the building.** A building drawn in stages (foundation, frame, walls, fit-out, completion) that follows the scroll.
- **7, real content.** About, Services, Projects, Process, Work delivered, Founder and a Contact form that sends through Formspree, with validation and a spam trap.
- **8, polish.** A loading line, a survey-marker cursor on pointer devices and project detail sheets with focus handling.
- **9, hardening.** Error screen, 404 page, social card and favicons, search metadata, a container with a read-only filesystem, and the handover documents.
- **10 to 12, speed and finish.** The building made the main character; the motion code moved out of the first load (mobile Lighthouse 78 to 98); wide-screen and phone layout fixes.
- **13, before launch.** Claims reviewed so nothing absolute or unprovable is stated, facts that nobody supplied removed, privacy and terms pages written (drafts), security headers and `security.txt`, a clean console.
- **14, one story.** The page order matches how a building is built; the building follows the text and un-builds exactly when scrolling back; the Projects section previews each project's drawing.
- **14B to 14E, the house.** A 3D house in the hero (our own projection code, no library) that turns on three axes, hands over to the building as the visitor scrolls, and is the background of the whole page on phones. 14E replaced the face ordering with a binary space partition built at build time and proved it against an independent z-buffer renderer on every orientation of a grid.
- **15A, release candidate.** Text over the building on phones is calmer (detail under text is cleared by region, wider gaps between blocks); the phone house keeps full tone until it dissolves; the phone control strip is Turn, Tilt, Reset, Auto-rotate and More; without JavaScript the page shows a still house and the finished building; sample contact details and draft legal pages are marked on the page; a link checker; the handover pack (`docs/handover/`) and the list of what the owner must do next (`docs/BEFORE-GOING-LIVE.md`, section 5).
