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

## 2. Temporary Section Stubs (`src/sections/_stubs/`)

| Component / Section                                   | Purpose                                                            | Replacement Phase                  |
| :---------------------------------------------------- | :----------------------------------------------------------------- | :--------------------------------- |
| `AboutStub` (`src/sections/_stubs/AboutStub.tsx`)     | Minimal interim sheet to anchor SheetStack slide-over transitions. | Phase 6 (`Structural` & `Metrics`) |
| `ContactStub` (`src/sections/_stubs/ContactStub.tsx`) | Minimal interim sheet to resolve `#contact` navigation anchor.     | Phase 8 (`Contact` with Formspree) |

---

## 3. Survey Plot Drawing Dimensions (`src/components/HeroPlot/`)

| Metric / Dimension          | Placeholder Value | Significance                                            |
| :-------------------------- | :---------------- | :------------------------------------------------------ |
| Lateral North Dimension     | `18.40 m`         | Representative parcel front setback survey measurement. |
| Longitudinal East Dimension | `24.80 m`         | Representative parcel depth survey measurement.         |
| Setback Offset              | `3.00 m`          | Statutory municipal planning setback line.              |
| Grid Pitch                  | `6.00 m`          | Standard structural column center-to-center pitch.      |
