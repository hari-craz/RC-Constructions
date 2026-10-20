# Placeholder audit (`docs/PLACEHOLDERS.md`)

Every value that is not a verified company fact. Rule: **no placeholder text is shown in body copy.** A missing fact is `null` in `src/content/company.ts` and the element is hidden (`hasContent`). Photo slots use one plain sentence-case line.

## 1. Facts held in `src/content/company.ts`

| Field                                                                                                                          | Value now                                                          | Effect when empty                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `contact.*` (phone, WhatsApp, email, address, hours)                                                                           | **Sample values**, `isSample: true`                                | Cannot be empty; must be replaced before launch (`docs/BEFORE-GOING-LIVE.md` section 0) |
| `legalName`                                                                                                                    | `null`                                                             | Falls back to "RC Constructions"                                                        |
| `facts.foundedYear`, `licenceOrRegistration`, `yearsInBusiness`, `projectsCompleted`, `areaBuiltSqFt`, `onTimeHandoverPercent` | `null`                                                             | Not shown; the "Work delivered" figures band is hidden                                  |
| `founder.surname`, `quote`, `experienceNote`                                                                                   | `null`                                                             | Name shows "Gokul" only; quote block and the Experience fact are hidden                 |
| `founder.photoAvailable`                                                                                                       | `false`                                                            | Quiet block with "Photo to come, 1200 by 1500"; no `<img>`                              |
| `legal.retentionPeriod`                                                                                                        | `12 months after the enquiry is closed`, `retentionIsSample: true` | Shown in `/privacy`; must be confirmed                                                  |
| `legal.governingLaw`                                                                                                           | `null`                                                             | Governing-law paragraph hidden in `/terms`                                              |

## 2. Sample content

| Item                                      | Where                                       | Note                                                                                             |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Six projects                              | `src/content/projects.ts`                   | Labelled once on the page: "Sample projects for this demo." No real client or brand.             |
| Project and image slots                   | `Projects` image slot, overlay gallery      | "Elevation drawing to come" and "Drawing to come" (image slots only)                             |
| House model dimensions                    | `src/lib/model3d/house.ts`, building labels | Illustrative drawing figures (14.8 m, 8.6 m, 15.40 m, 17.40 m); not claims about a real building |
| Tagline, call to action, navigation label | `src/content/site.ts`                       | Wording the client may replace                                                                   |
| Services list                             | `src/content/services.ts`                   | General trades; confirm with the company                                                         |
| Process steps                             | `src/content/process.ts`                    | Describe a typical order of work; confirm with the company                                       |

## 3. Technical placeholders

| Item                            | Where                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| `VITE_FORMSPREE_ID`             | Vercel environment and local `.env`; the form is disabled without it |
| Site URL                        | `src/config/site.json` (one place)                                   |
| `public/og-image.png`, favicons | Script-generated; replace with brand artwork                         |

## 4. Tests that guard this

- `src/content/content.test.ts`: no `20XX`, `XX`, "to come" or `PLACEHOLDER` in founder and other content.
- `e2e/phase-13.spec.ts`: no placeholder text or banned claim anywhere visible; no broken image.
- `e2e/phase-12.spec.ts`: no visible `//`, no `<img>` with `naturalWidth` 0.
