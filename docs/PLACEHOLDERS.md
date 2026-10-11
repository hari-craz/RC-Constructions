# RC Constructions — Repository Placeholder Audit

This document catalogues all placeholder values and temporary fixtures across the repository.
Every item listed here must be replaced with verified client material before final deployment and client pitch.

---

## 1. Content Placeholders (`src/content/site.ts`)

| Key                    | Current Placeholder Value                         | Source File           | Replacement Target / Action                                                    |
| :--------------------- | :------------------------------------------------ | :-------------------- | :----------------------------------------------------------------------------- |
| `SITE.tagline`         | `"We build homes, offices, factories and roads."` | `src/content/site.ts` | Official client positioning statement / value proposition.                     |
| `SITE.cta.label`       | `"Request a quote"`                               | `src/content/site.ts` | Finalized commercial CTA text (e.g. "Initiate Tender", "Consult Engineering"). |
| `SITE.cta.href`        | `"#contact"`                                      | `src/content/site.ts` | Resolves to `#contact` section anchor.                                         |
| `SITE.nav[0].label`    | `"Enquire"`                                       | `src/content/site.ts` | Final nav items approved by client.                                            |
| `SITE.contact.email`   | `"build@rcconstructions.com"`                     | `src/content/site.ts` | Verified Formspree recipient / domain mail.                                    |
| `SITE.contact.phone`   | `"+91 (0) 44 2847 0000"`                          | `src/content/site.ts` | Verified regional commercial office telephone.                                 |
| `SITE.contact.address` | `"Survey Plot 104, Industrial Corridor, Chennai"` | `src/content/site.ts` | Verified corporate registration headquarters.                                  |

---

## 2. Temporary Section Stubs (`src/sections/_stubs/` & `src/sections/_stages/`)

| Component / Section                                   | Purpose                                                        | Replacement Phase                  |
| :---------------------------------------------------- | :------------------------------------------------------------- | :--------------------------------- |
| `ContactStub` (`src/sections/_stubs/ContactStub.tsx`) | Minimal interim sheet to resolve `#contact` navigation anchor. | Phase 8 (`Contact` with Formspree) |

---

## 3. Survey Plot Drawing Dimensions (`src/components/HeroPlot/`)

| Metric / Dimension          | Placeholder Value | Significance                                            |
| :-------------------------- | :---------------- | :------------------------------------------------------ |
| Lateral North Dimension     | `18.40 m`         | Representative parcel front setback survey measurement. |
| Longitudinal East Dimension | `24.80 m`         | Representative parcel depth survey measurement.         |
| Setback Offset              | `3.00 m`          | Statutory municipal planning setback line.              |
| Grid Pitch                  | `6.00 m`          | Standard structural column center-to-center pitch.      |

---

## 4. Phase 7A Content Placeholders (`src/content/about.ts`)

| Key                           | Current Placeholder Value            | Source File            | Replacement Target / Action                       |
| :---------------------------- | :----------------------------------- | :--------------------- | :------------------------------------------------ |
| `ABOUT_CONTENT.paragraphs[0]` | `"founded by Gokul in 20XX"`         | `src/content/about.ts` | Verified incorporation / founding year.           |
| `ABOUT_CONTENT.paragraphs[0]` | `"across the region"`                | `src/content/about.ts` | Verified primary state / district jurisdiction.   |
| `ABOUT_CONTENT.principles`    | 3 engineering rules and consequences | `src/content/about.ts` | Verified operational quality assurance protocols. |

---

## 5. Phase 7B Content Placeholders (`src/content/projects.ts`)

| Key                            | Current Placeholder Value                    | Source File               | Replacement Target / Action                         |
| :----------------------------- | :------------------------------------------- | :------------------------ | :-------------------------------------------------- |
| `PROJECTS_CONTENT.projects[*]` | Location, year ("20XX"), built area, outcome | `src/content/projects.ts` | Verified portfolio project records and photography. |
| `Projects.preview-slot`        | Elevation drawing preview slot (1200×675)    | `src/sections/Projects`   | High-resolution CAD elevation rendering or photo.   |

---

## 6. Phase 7C Completion Placeholders (`src/content/completion.ts`)

| Key                           | Current Placeholder Value | Source File                 | Replacement Target / Action                          |
| :---------------------------- | :------------------------ | :-------------------------- | :--------------------------------------------------- |
| `COMPLETION_CONTENT.stats[0]` | `"XX"`                    | `src/content/completion.ts` | Verified total projects completed.                   |
| `COMPLETION_CONTENT.stats[1]` | `"XX"`                    | `src/content/completion.ts` | Verified years of practice in regional construction. |
| `COMPLETION_CONTENT.stats[2]` | `"XX"`                    | `src/content/completion.ts` | Verified gross square feet built.                    |
| `COMPLETION_CONTENT.stats[3]` | `"XX"`                    | `src/content/completion.ts` | Verified audited on-time handover rate percentage.   |

---

## 7. Phase 7C Founder Placeholders (`src/content/founder.ts`)

| Key                                | Current Placeholder Value                      | Source File              | Replacement Target / Action                                                        |
| :--------------------------------- | :--------------------------------------------- | :----------------------- | :--------------------------------------------------------------------------------- |
| `FOUNDER_CONTENT.name`             | `"Gokul"`                                      | `src/content/founder.ts` | Full legal name and verified titles.                                               |
| `FOUNDER_CONTENT.bioParagraphs[0]` | `"founded RC Constructions in 20XX"`           | `src/content/founder.ts` | Verified incorporation year.                                                       |
| `FOUNDER_CONTENT.facts[0]`         | `"Site practice since 20XX"`                   | `src/content/founder.ts` | Verified career start year.                                                        |
| `FOUNDER_CONTENT.facts[2]`         | `"Registered body to come (Licence ref 20XX)"` | `src/content/founder.ts` | Verified contractor registration body and licence serial.                          |
| `Founder.portrait-slot`            | 1200 × 1500 px (4:5 ratio) WebP / JPEG         | `src/sections/Founder`   | Supply professional portrait photo (WebP and JPEG, 1200×1500 px, monochrome/tint). |
