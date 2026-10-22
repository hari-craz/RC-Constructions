# Content status (`docs/CONTENT-STATUS.md`)

What on the site is real, what is a placeholder, and what NEXISARC (or the company) must supply. Every company fact lives in `src/content/company.ts`; a fact that is `null` hides its element instead of showing a placeholder. Sample content is marked on the page itself:

- Contact details: "Sample contact details for this demo." under the channels in the Contact section (shown while `contact.isSample` is `true`).
- Projects: "Sample projects for this demo." under the Projects headline.
- Privacy and terms: "Draft, pending legal review." under each heading; the privacy retention period is marked as a sample.

Nothing in this file is a fact about the company. Questions to ask the company are in `docs/CONTENT-INTAKE.md`; the order of work is in `docs/BEFORE-GOING-LIVE.md`.

## 1. Placeholder values that are visible on the site

| Field (`src/content/company.ts` unless stated)            | Current placeholder                                      | What NEXISARC must supply                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `contact.phoneDisplay`, `contact.phoneRaw`                | `+91 (0) 44 2847 0000`                                   | The company's real phone number (display form and digits for the `tel:` link).                  |
| `contact.whatsappRaw`                                     | the same sample number                                   | The WhatsApp number, or `null` to hide the channel.                                             |
| `contact.email`                                           | `build@rcconstructions.com`                              | The real enquiry address. It is also the `security.txt` and privacy contact.                    |
| `contact.address`                                         | `Survey Plot 104, Industrial Corridor, Chennai`          | The real office or yard address.                                                                |
| `contact.workingHours`                                    | `Monday to Saturday, 08:00 to 18:00 IST`                 | The real hours.                                                                                 |
| `contact.isSample`                                        | `true`                                                   | Set to `false` only after all five fields above are replaced (this removes the on-page note).   |
| `legal.retentionPeriod`, `legal.retentionIsSample`        | `12 months after the enquiry is closed`, `true`          | The period the company decides, then `retentionIsSample: false`.                                |
| `src/content/projects.ts` (all six records, `sampleNote`) | Six sample projects written for the demo, no real client | Real projects from the company's records, three photos each, a client's permission where named. |

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

| Item                       | Where                                                      | State and what is needed                                                                                                   |
| -------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Founder portrait           | `public/images/founder-gokul.webp` and `.jpg`              | Not committed. The page shows a quiet placeholder. Commit both files (1200 by 1500), then `founder.photoAvailable = true`. |
| Project photographs        | `src/content/projects.ts` gallery slots                    | Placeholders ("Site photo to come"). Three real photos per project.                                                        |
| Logo, favicon, social card | `src/components/Logo/Logo.tsx`, `public/`                  | Drawn for the demo. Replace with the company's artwork if it has any (social card 1200 by 630).                            |
| Official tagline and CTA   | `src/content/site.ts`                                      | Demo wording. Replace if the company has official wording.                                                                 |
| Form endpoint              | `VITE_FORMSPREE_ID` (Vercel, Production)                   | Not set: the form shows that sending is switched off. The owner creates the form and allows the live domain.               |
| Canonical domain           | `src/config/site.json` (and the `vercel.json` CORS origin) | Currently the demo host `https://rc.unitaryx.org`. Change both together when the final domain is known.                    |
| `security.txt` expiry      | generated at build from the build date                     | Renew by redeploying before it expires (it is set a year ahead of each build).                                             |

## 4. Claims

All visible copy follows `docs/CLAIMS-REVIEW.md` (no absolute or guarantee-style wording; no licence, accreditation, award or test result unless supplied above). `src/content/claims.test.ts` and `e2e/phase-13.spec.ts` fail if such wording appears.
