# Content intake: what the company needs to tell us

Fill in one line per item. Plain answers are fine. Leave an item blank if it does not apply; the website hides that element instead of showing a placeholder. Each item names the exact field it goes into. Everything lives in `src/content/company.ts` unless another file is named.

**Read this first: the phone number, email, address and hours currently on the site are made-up samples.** They must be replaced before real visitors see the site (items 1 to 5).

## A. Contact details (replace first)

| #   | Question                                             | Example                                      | Field in `company.ts`                                        |
| --- | ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| 1   | Main phone number, as people should read it          | `+91 98765 43210`                            | `contact.phoneDisplay`                                       |
| 2   | The same number as digits with country code          | `+919876543210`                              | `contact.phoneRaw`                                           |
| 3   | WhatsApp number (leave blank if none)                | `+919876543210`                              | `contact.whatsappRaw` (use `null` to hide the WhatsApp line) |
| 4   | Email address that should receive and show enquiries | `info@yourcompany.in`                        | `contact.email`                                              |
| 5   | Office and yard address                              | `12 Industrial Estate Road, Chennai 600 000` | `contact.address`                                            |
| 6   | Working hours                                        | `Monday to Saturday, 9:00 to 18:00 IST`      | `contact.workingHours`                                       |

After replacing 1 to 6, set `contact.isSample` to `false`.

## B. The company

| #   | Question                                                                         | Example                                | Field                         |
| --- | -------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------- |
| 7   | Full legal name of the company                                                   | `RC Constructions Private Limited`     | `legalName`                   |
| 8   | Year the company was founded                                                     | `2009`                                 | `facts.foundedYear`           |
| 9   | Licence or registration (class, number, issuing body), only if you want it shown | `Class I contractor, licence no. 1234` | `facts.licenceOrRegistration` |
| 10  | Years in business                                                                | `15`                                   | `facts.yearsInBusiness`       |
| 11  | Number of projects completed                                                     | `120`                                  | `facts.projectsCompleted`     |
| 12  | Total area built, in square feet                                                 | `850000`                               | `facts.areaBuiltSqFt`         |
| 13  | Share of projects handed over on the agreed date, as a number                    | `92`                                   | `facts.onTimeHandoverPercent` |

Items 10 to 13 appear as figures in the "Work delivered" section only when you give a number you can back up with records. Do not estimate.

## C. The founder

| #   | Question                                                                                                                       | Example                                           | Field                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 14  | Founder's surname                                                                                                              | `Kumar`                                           | `founder.surname`                                                                            |
| 15  | Title                                                                                                                          | `Founder and Managing Director`                   | `founder.role`                                                                               |
| 16  | A short quote the founder has approved (blank to hide)                                                                         | `We stay on site until the keys are handed over.` | `founder.quote`                                                                              |
| 17  | One line about experience, only if true and provable                                                                           | `Site practice since 2005`                        | `founder.experienceNote`                                                                     |
| 18  | Portrait photo, 1200 by 1500 pixels, portrait orientation, as WebP and JPEG named `founder-gokul.webp` and `founder-gokul.jpg` | (files)                                           | put both files in `public/images/`, commit them, then set `founder.photoAvailable` to `true` |

The founder's biography sentences are in `src/content/founder.ts`; send changes in plain text.

## D. Legal and privacy

| #   | Question                                              | Example                                                             | Field                                                                  |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 19  | How long do you keep enquiry details?                 | `12 months after the enquiry is closed`                             | `legal.retentionPeriod`, then set `legal.retentionIsSample` to `false` |
| 20  | Which law and courts should govern the website terms? | `the laws of India, with the courts at Chennai having jurisdiction` | `legal.governingLaw` (blank hides the line)                            |
| 21  | Email for privacy requests, if different from item 4  | `privacy@yourcompany.in`                                            | `legal.privacyContactEmail`                                            |

The privacy notice and terms are drafts marked `REVIEW BY COMPANY ADVISER`: please have your adviser read `/privacy` and `/terms` before launch. The questions for them are in `docs/FORM-AND-DOMAIN.md`.

## E. Projects (replace the six sample projects)

The six projects on the site are samples ("Sample projects for this demo"). To replace them, edit `src/content/projects.ts`: one entry per project, with these fields. Send each project as one short form:

| Field        | What to write                                                                    | Example                                                    |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `name`       | Project name                                                                     | `Riverside Primary School Block`                           |
| `type`       | Residential, Commercial, Industrial, Institutional, Infrastructure or Renovation | `Institutional`                                            |
| `location`   | Area and city                                                                    | `Anna Nagar, Chennai`                                      |
| `year`       | Year completed                                                                   | `2023`                                                     |
| `builtArea`  | Built area, with unit                                                            | `22,000 sq ft`                                             |
| `duration`   | Contract time                                                                    | `12 months`                                                |
| `clientType` | Kind of client (no private names unless they agree)                              | `Trust-run school`                                         |
| `challenge`  | The one specific problem the site presented, one or two sentences                | `The block went up inside a working school.`               |
| `response`   | What you did about it, one or two sentences                                      | `We fenced the works and kept noisy work to agreed hours.` |
| `outcome`    | What came out of it, in plain terms, no guarantees                               | `Sixteen classrooms, in use from the next school year.`    |
| `gallery`    | Three photo captions                                                             | `Hoarding between site and playground`                     |

Photos: three per project, 16:9 or 3:2, named by the gallery id (for example `gallery-res-1.webp`). Photo files are not yet wired into the layout (the slots show "Drawing to come"); send them with the project and they will be added.

Rules for wording: use facts you can document, no "never", "always", "guaranteed", "zero defects", awards or certificates unless you can show the paper (see `docs/CLAIMS-REVIEW.md`).

## F. Domain, email and form (owner tasks, not content)

Formspree form ID, allowed domain, DNS records and SPF, DKIM, DMARC are in `docs/FORM-AND-DOMAIN.md`.
