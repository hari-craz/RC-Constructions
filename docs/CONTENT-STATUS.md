# Content status (`docs/CONTENT-STATUS.md`)

What on the site is real, what is a placeholder, and what NEXISARC (or the company) must supply. Every company fact lives in `src/content/company.ts`; a fact that is `null` hides its element instead of showing a placeholder. Sample content is marked on the page itself:

- Contact details: "Sample contact details for this demo." under the channels in the Contact section, shown only while `contact.isSample` is `true` (it is `false` now that the card's details are in).
- Projects: "Sample projects for this demo." under the Projects headline.
- Privacy and terms: "Draft, pending legal review." under each heading; the privacy retention period is marked as a sample.

Nothing in this file is a fact about the company. Questions to ask the company are in `docs/CONTENT-INTAKE.md`; the order of work is in `docs/BEFORE-GOING-LIVE.md`.

## 1. Placeholder and supplied values that are visible on the site

Supplied by the company on its business card (2026-10-25) and now in `src/content/company.ts`: `contact.phoneDisplay` / `phoneRaw` (`+91 99658 79171`), `contact.phoneSecondaryDisplay` / `phoneSecondaryRaw` (`+91 97906 77767`), `contact.email` (`rcconstructions2016@gmail.com`), `contact.address` (`6/161, Poomandanvalasu, Mangalapatti (Po.), Muthur Via, Tiruppur - 638105`), `founder.surname` (`Kumar`). `contact.isSample` is `false`.

| Field (`src/content/company.ts` unless stated)            | Current placeholder                                       | What NEXISARC must supply                                                                             |
| --------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `contact.whatsappRaw`                                     | `null` (the WhatsApp channel is hidden)                   | The WhatsApp number, if the company uses one. The card does not say.                                  |
| `contact.workingHours`                                    | `null` (the row is hidden)                                | The real hours. Not on the card.                                                                      |
| `contact.email`                                           | the card's Gmail address (real, but not a company domain) | A company-domain address when the domain is final; it is also the `security.txt` and privacy contact. |
| `legal.retentionPeriod`, `legal.retentionIsSample`        | `12 months after the enquiry is closed`, `true`           | The period the company decides, then `retentionIsSample: false`.                                      |
| `src/content/projects.ts` (all six records, `sampleNote`) | Six sample projects written for the demo, no real client  | Real projects from the company's records, three photos each, a client's permission where named.       |

## 2. Facts that are `null` (hidden until supplied)

| Field                         | Effect while `null`                            | What NEXISARC must supply                                   |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| `legalName`                   | The site says "RC Constructions" only          | The registered name, if it should be shown.                 |
| `facts.foundedYear`           | No founding year                               | The year (only if provable).                                |
| `facts.licenceOrRegistration` | No licence or registration line anywhere       | The licence or registration text, with paperwork on file.   |
| `facts.yearsInBusiness`       | Hidden                                         | A number the company can stand behind.                      |
| `facts.projectsCompleted`     | The "Work delivered" figures band stays hidden | A number, with records.                                     |
| `facts.areaBuiltSqFt`         | Hidden                                         | A number, with records.                                     |
| `facts.onTimeHandoverPercent` | Hidden                                         | A number, with records.                                     |
| `founder.surname`             | "Gokul" only                                   | The founder's surname and title, if wanted.                 |
| `founder.quote`               | No quote is shown                              | A quotation the founder has approved.                       |
| `founder.experienceNote`      | Hidden                                         | A line such as "Site practice since ...", only if supplied. |
| `legal.governingLaw`          | The terms have no governing-law section        | The governing law and courts, from the company's adviser.   |
| `legal.privacyContactEmail`   | Privacy requests go to `contact.email`         | A separate privacy address, if the company has one.         |

## 3. Assets and settings that are not in the repository

| Item                       | Where                                                      | State and what is needed                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder portrait           | `public/images/founder-gokul.webp` and `.jpg`              | Not committed. The page shows a quiet placeholder. Commit both files (1200 by 1500), then `founder.photoAvailable = true`.                                                                                                                                                                                                                                                         |
| Project photographs        | `src/content/projects.ts` gallery slots                    | Placeholders ("Site photo to come"). Three real photos per project.                                                                                                                                                                                                                                                                                                                |
| Logo, favicon, social card | `src/components/Logo/markGeometry.ts`, `public/`           | Redrawn from the company's own logo (house with R and C blocks, blue and grey; supplied 2026-10-25): one colour in the header, its own colours in the favicon, app icons and social card. If the company has vector artwork, replace the geometry (`pnpm generate:favicons` and `pnpm generate:og` rebuild the files). The logo's line "Build Your Hopes" is not used on the page. |
| Official tagline and CTA   | `src/content/site.ts`                                      | Demo wording. Replace if the company has official wording.                                                                                                                                                                                                                                                                                                                         |
| Form endpoint              | `VITE_FORMSPREE_ID` (Vercel, Production)                   | Not set: the form shows that sending is switched off. The owner creates the form and allows the live domain.                                                                                                                                                                                                                                                                       |
| Canonical domain           | `src/config/site.json` (and the `vercel.json` CORS origin) | Currently the demo host `https://rc.unitaryx.org`. Change both together when the final domain is known.                                                                                                                                                                                                                                                                            |
| `security.txt` expiry      | generated at build from the build date                     | Renew by redeploying before it expires (it is set a year ahead of each build).                                                                                                                                                                                                                                                                                                     |

## 4. Claims

All visible copy follows `docs/CLAIMS-REVIEW.md` (no absolute or guarantee-style wording; no licence, accreditation, award or test result unless supplied above). `src/content/claims.test.ts` and `e2e/phase-13.spec.ts` fail if such wording appears.
