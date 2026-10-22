# Demo script: two minutes with the RC Constructions site

For presenting the demo to NEXISARC. Use a laptop (1440 px wide or more) first, then show a phone for the last ten seconds. The site is a demo: say so once at the start. The phone number, address, email and the six projects are samples, and the page says so ("Sample contact details for this demo." under the contact channels; "Sample projects for this demo." under the Projects heading).

Before you start: open the site in a fresh tab and wait for the thin loading line at the top of the page to finish. Let the house turn once. Keep the mouse over the house and do not scroll yet. The header links are named Principles, Process, Track record, Services, Projects and Contact: they are the About, Construction process, Work delivered, Services, Projects and Contact sections.

The pictures that go with each step are in `docs/handover/screens/` (file names are given below).

## 0:00 to 0:20, the first screen (`01-hero`)

**Show:** the house in the hero. Drag it left and right. Click "Tilt up" once. On the desktop there are eight small buttons; on a phone there are four plus "More".

**Say:** "This is the first thing a visitor sees: a house we can turn with a finger or a mouse. It is drawn live in the browser, with no 3D library, so the page stays light. The dimensions in amber are part of the drawing. Under the headline it says what the company does in one line: homes, offices, factories and roads." (Other angles: `house-*`.)

## 0:20 to 0:45, the house becomes the building (`morph-1` to `morph-4`)

**Show:** scroll slowly down one screen. The house settles to its front view, lands on the ground line, then fades from the roof down while the foundation of the real building starts where it stood.

**Say:** "As you scroll, the house is taken down from the roof and the building starts from the ground. The scroll is the construction programme. Scroll back up and it goes back exactly, so a visitor can never get it out of step."

## 0:45 to 1:15, the story in order (`02-about`, `03-construction-process`, `stage-1` to `stage-5`)

**Show:** keep scrolling through "We work from the ground up", then the six steps of the construction process. The building grows as you read: the site and foundation first, then the frame, then walls and openings, then the fit-out.

**Say:** "The drawing advances with the text: foundation through the early steps, the frame, the walls, then windows and the entrance. The first three steps are planning work, so the drawing holds the site and foundation while you read them. The exact moment each part appears is tied to where the text is on screen, so it cannot get ahead of the reader on any screen size."

## 1:15 to 1:35, work delivered, services, projects (`04-work-delivered` to `06-projects`)

**Show:** pause at "Work delivered", where the windows light. Scroll through Services to Projects. Hover or tab to a project row: the drawing on the right changes to that project's drawing, and goes back when you leave the list.

**Say:** "When the work is delivered, the windows are lit. Services lists the kinds of building the company works on. In Projects, hovering a row previews a drawing of that project. These six projects are samples written for the demo, and the page says so; the company's real ones go in later."

## 1:35 to 1:50, founder and contact (`07-founder`, `08-contact`)

**Show:** scroll to the founder sheet, then Contact. Point at the sample-details line under the contact channels. Do not submit the form.

**Say:** "The founder has a short page with a place for a portrait. The enquiry form is ready; it sends by email once the form service is switched on for the live address. The contact details here are samples until the company gives us the real ones."

## 1:50 to 2:00, the phone

**Show:** open the site on a phone, or make the window 390 px wide. Show the hero strip (Turn, Tilt, Reset, Auto-rotate, More) and scroll a few screens. On a phone the building is behind the text, so the drawing is drawn quietly and clears itself where words are over it.

**Say:** "On a phone the building is the background of the whole page, and the buttons are big enough to tap. Turning the house is a swipe, and a two-finger twist rolls it."

## If something goes wrong

- The house does not turn: reload the page and wait for the loading line to finish.
- Someone asks about speed: mobile Lighthouse scores 98 to 99 and desktop 100 (`docs/PERFORMANCE.md`).
- Someone asks "is this live": it is a demo on a demo address. What still has to happen before real visitors is in `docs/BEFORE-GOING-LIVE.md`.
- Someone asks about no JavaScript: the page then shows a still drawing of the house and of the finished building, with the phone number and email (`no-javascript` pictures).
- Someone notices the drawing and the text do not always match: the process steps are written as business steps (visit, estimate, approvals) while the drawing shows the building; the match is by order and by place on the screen, not word for word. The company may want the step wording and the drawing stages lined up when its own words go in.
