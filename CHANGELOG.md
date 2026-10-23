# Changelog

## [0.2.0](https://github.com/hari-craz/RC-Constructions/compare/v0.1.0...v0.2.0) (2026-10-23)


### Features

* add Contact section component with form validation and Formspree integration ([ff3b3a6](https://github.com/hari-craz/RC-Constructions/commit/ff3b3a66e4fdd7b4b68f9967a2cc29909591131d))
* add contact section, form validation, tests, and documentation ([0fb0c53](https://github.com/hari-craz/RC-Constructions/commit/0fb0c53987de71ca4c3dc6c67ad5651a09f36799))
* add core components, content models, testing suite, and Lenis scroll provider ([1319d99](https://github.com/hari-craz/RC-Constructions/commit/1319d998213841816d6d8160722c40904a87dc94))
* add core UI components and content infrastructure ([12ac3d9](https://github.com/hari-craz/RC-Constructions/commit/12ac3d9dbd0f31c73bc3f63d4eb348609e2ce3f9))
* add core UI components, scroll management, and stage architecture for the building experience ([0ee9df7](https://github.com/hari-craz/RC-Constructions/commit/0ee9df7cc2101f4e60416949e0dcb487475f1ccd))
* add docker, ci-cd, vercel, and repo automation ([2ff93ab](https://github.com/hari-craz/RC-Constructions/commit/2ff93abf9c8f04388cf97c32a5a8688506e71e96))
* add hero section and plot component with interactive GSAP animations ([bb6b8e6](https://github.com/hari-craz/RC-Constructions/commit/bb6b8e624aaee82a43d7cfc4d84ee59edce29bdd))
* add ScrollProvider component and Playwright end-to-end tests for building stages ([61a702c](https://github.com/hari-craz/RC-Constructions/commit/61a702c82641ca5ab2dc074e597fbb3b14c0ef6d))
* **building:** recompose page so the building carries it (phase 11) ([2195268](https://github.com/hari-craz/RC-Constructions/commit/2195268f834fb97ee86032ff8f69b3370fc116b7))
* **building:** recompose page so the building carries it (phase 11) ([4eda71c](https://github.com/hari-craz/RC-Constructions/commit/4eda71cb7557863fff6238cb4dae475ab3d41226))
* **final:** complete visual refinement and accessibility contrast gates ([468509d](https://github.com/hari-craz/RC-Constructions/commit/468509dc68cc3f88f0fc9b0ff8b991a391248059))
* **hardening:** complete phase 9 hardening and launch ([4258ea4](https://github.com/hari-craz/RC-Constructions/commit/4258ea4a7bd3e3f741ad2f74a2758c7873707ff4))
* implement Phase 5 audit fixes, Hero section, and Nav components ([74c0efb](https://github.com/hari-craz/RC-Constructions/commit/74c0efb158bf1fa467938bf5d8c0736106f0fd13))
* implement real contact section with Formspree integration, validation, and E2E tests ([5cc8741](https://github.com/hari-craz/RC-Constructions/commit/5cc87414534aa7b9738b11fa3bf005ec4ee4a6f4))
* implement scroll provider, sheet stack components, and motion management utilities ([ee890cf](https://github.com/hari-craz/RC-Constructions/commit/ee890cff90af91be1dca8df38469165a81728ff9))
* phase 12 speed, scale and last visible defects ([d335795](https://github.com/hari-craz/RC-Constructions/commit/d3357957e025b120e51c067ee70ccf0b0f39ccce))
* phase 13 pre-launch fixes (content, legal pages, security, cursor) ([9455dbd](https://github.com/hari-craz/RC-Constructions/commit/9455dbd7ceada7fda253faba7402fd3b91ef5265))
* phase 14 one story: section order, stage sync, projects preview, header indicator ([2030f74](https://github.com/hari-craz/RC-Constructions/commit/2030f744cf4df7f575ab4d7076c7c17c1b45074e))
* phase 14B step map, phone hand-off, lit-window gating, site camera ([4523b4e](https://github.com/hari-craz/RC-Constructions/commit/4523b4e874fbfaede339058ddd34b0ebbf0c1f10))
* phase 14C interactive 3D house replaces the hero survey plot ([c553094](https://github.com/hari-craz/RC-Constructions/commit/c55309481dfad0bfb39f8e9b5a7be067b5a3f18b))
* phase 14D detailed house, morph into the building, full-bleed background below 1024 px ([ee8bf5b](https://github.com/hari-craz/RC-Constructions/commit/ee8bf5b88404946ab3758780ae19de59a960e568))
* phase 14E fix the 3D house breaking while it rotates ([38ce6e7](https://github.com/hari-craz/RC-Constructions/commit/38ce6e7c22d048f282aef37254ef5d6281818d5c))
* phase 15A release candidate, leftovers closed and handover pack ([ed592e5](https://github.com/hari-craz/RC-Constructions/commit/ed592e56c713397683e1497374ef8beeb963ebdd))
* **phase-7c:** implement Completion stats and Founder monograph section ([3453383](https://github.com/hari-craz/RC-Constructions/commit/3453383e7253b75a695a24ccba0d6db5bd4c87e7))
* **polish:** complete phase 8 polish suite ([76ff6c0](https://github.com/hari-craz/RC-Constructions/commit/76ff6c08447cb1c066e02d30988e597094b49051))
* scaffold project foundation and tooling ([923df65](https://github.com/hari-craz/RC-Constructions/commit/923df657be8185d2b9ecd9009a8c685f8455130b))


### Bug Fixes

* drop an unused global comment from the frame-cost script ([acc6cf5](https://github.com/hari-craz/RC-Constructions/commit/acc6cf54fa04ca9705c6b4a86cb4a2872dad5719))
* phase 15A follow-up, clear wall fills under text and fit the founder portrait ([8f91cd2](https://github.com/hari-craz/RC-Constructions/commit/8f91cd26dfc60f391b642bab3b2d569612e792aa))

## Changelog

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
