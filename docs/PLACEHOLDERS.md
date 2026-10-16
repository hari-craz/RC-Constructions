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

## 2. Section Stubs Status

All temporary section stubs have been completely replaced with real content as of Phase 7D (`About`, `Services`, `Projects`, `Process`, `Completion`, `Founder`, `Contact`). Zero stub sections remain in the repository.

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

| Key                     | Current Placeholder Value              | Source File              | Replacement Target / Action                                                        |
| :---------------------- | :------------------------------------- | :----------------------- | :--------------------------------------------------------------------------------- |
| `FOUNDER_CONTENT.name`  | `"Gokul"`                              | `src/content/founder.ts` | Full legal name and verified titles.                                               |
| `Founder.portrait-slot` | 1200 × 1500 px (4:5 ratio) WebP / JPEG | `src/sections/Founder`   | Supply professional portrait photo (WebP and JPEG, 1200×1500 px, monochrome/tint). |

---

## 8. Phase 7D Contact Placeholders (`src/content/contact.ts`)

| Key                           | Current Placeholder Value                         | Source File              | Replacement Target / Action                |
| :---------------------------- | :------------------------------------------------ | :----------------------- | :----------------------------------------- |
| `CONTACT_CONFIG.rawPhone`     | `"+914428470000"`                                 | `src/content/contact.ts` | Verified primary commercial phone number.  |
| `CONTACT_CONFIG.displayPhone` | `"+91 (0) 44 2847 0000"`                          | `src/content/contact.ts` | Verified formatted display phone number.   |
| `CONTACT_CONFIG.email`        | `"build@rcconstructions.com"`                     | `src/content/contact.ts` | Verified direct inquiry recipient address. |
| `CONTACT_CONFIG.address`      | `"Survey Plot 104, Industrial Corridor, Chennai"` | `src/content/contact.ts` | Verified site office & yard address.       |
| `CONTACT_CONFIG.workingHours` | `"Monday to Saturday, 08:00 – 18:00 IST"`         | `src/content/contact.ts` | Official client site working hours.        |
| `VITE_FORMSPREE_ID`           | Environment variable                              | `.env` / `vercel.json`   | Production Formspree form endpoint ID.     |

---

## 9. Phase 8 Project Overlays Placeholders (`src/content/projects.ts`)

| Key                                    | Current Placeholder Value                                | Source File               | Replacement Target / Action                                |
| :------------------------------------- | :------------------------------------------------------- | :------------------------ | :--------------------------------------------------------- |
| `PROJECTS_CONTENT.projects[*].role`    | `"Main contractor // PLACEHOLDER"`                       | `src/content/projects.ts` | Verified contractual project role per tender.              |
| `PROJECTS_CONTENT.projects[*].brief`   | Architectural summary brief (60–90 words)                | `src/content/projects.ts` | Approved client project brief and case study narrative.    |
| `PROJECTS_CONTENT.projects[*].scope`   | 3 complete scope sentences                               | `src/content/projects.ts` | Detailed bills of quantities and work package scope.       |
| `PROJECTS_CONTENT.projects[*].gallery` | 3 reserved concrete slots with captions (18 total slots) | `src/content/projects.ts` | High-resolution architectural on-site construction photos. |

---

## 10. Phase 9 Launch Hardening & Branding Placeholders

| Asset / Metadata              | Current Placeholder Value                           | Source File                                             | Replacement Target / Action                                                                          |
| :---------------------------- | :-------------------------------------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| Open Graph image              | Generated SVG-backed card (1200×630)                | `public/og-image.png`                                   | Official high-res branded portfolio graphic or hero photograph.                                      |
| Favicons & App Icons          | Architectural geometric monogram (180, 192, 512 px) | `public/`                                               | Final client company trademark icon set.                                                             |
| JSON-LD structured data       | Schema.org `GeneralContractor` placeholder data     | `index.html`                                            | Official verified business legal name, headquarters coordinates, official telephone, and web domain. |
| Production Domain & Canonical | `https://rc-constructions.example.com`              | `index.html`, `public/robots.txt`, `public/sitemap.xml` | Registered public primary production domain.                                                         |

## Resolved in the site-hardening pass

- Founder portrait slot removed (no image asset exists). Re-add a `<picture>` to `Founder.tsx` once a real photo is supplied.
- Founding year and licence reference ("20XX", "to come") removed from copy. Add them back to `about.ts` / `founder.ts` once verified.
- Still unverified and must be confirmed by the client: Completion stats (`completion.ts`), all project records (`projects.ts`), phone, address and email (`site.ts`).
