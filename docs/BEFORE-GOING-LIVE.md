# RC Constructions — Client Supply List Before Going Live (`docs/BEFORE-GOING-LIVE.md`)

This document is the authoritative checklist of verified commercial assets, legal records, and credentials the client must supply before taking the portfolio live. Every placeholder in the codebase is indexed directly to its replacement target.

---

## 1. Commercial Assets & Credentials Supply Matrix

| #      | Item to Supply                             | Format / Specification                                                                                                                   | Target File to Replace / Update                                                     | Current Placeholder Status                                                               |
| :----- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **01** | **Formspree Form ID**                      | 8-character Formspree endpoint key (`https://formspree.io/f/<ID>`)                                                                       | `.env` (`VITE_FORMSPREE_ID`) & Vercel Dashboard env variables                       | Staging test mock ID / environment fallback                                              |
| **02** | **Verified Custom Domain**                 | Registered apex domain (e.g. `rcconstructions.com`) with DNS access for A/CNAME records                                                  | `index.html` (canonical, OG tags), `public/sitemap.xml`, `public/robots.txt`        | `https://rcconstructions.com/`                                                           |
| **03** | **Corporate Logo & Monogram**              | Vector SVG (`viewBox="0 0 64 64"`) and favicon artwork                                                                                   | `src/components/Logo/Logo.tsx`, `public/favicon.svg`, `public/apple-touch-icon.png` | Monogram CAD drawing with amber datum tick                                               |
| **04** | **Brand Palette & Material Tokens**        | Verified architectural color tokens (HEX/HSL)                                                                                            | `src/styles/tokens.css`                                                             | Formwork Dark (`#232622`), Limewash (`#E9E7DF`), Concrete (`#C4C4BC`), Amber (`#E3B341`) |
| **05** | **Founder Portrait Photography**           | Studio or site portrait photo (1200×1500 px, 4:5 ratio, WebP & JPEG, monochrome/neutral)                                                 | `src/sections/Founder/Founder.tsx` (reserved portrait slot)                         | Architectural canvas placeholder slot (`// FOUNDER PORTRAIT RESERVED SLOT`)              |
| **06** | **Founder Legal Biography & Credentials**  | Full legal name, formal title, year founded, registration license serial                                                                 | `src/content/founder.ts`                                                            | `"Gokul"`, `"20XX"`, `"Licence ref 20XX"`                                                |
| **07** | **Portfolio Project Records (6 Projects)** | 6 completed project case studies: verified names, locations, gross areas, durations, outcomes, 60–90 word briefs, 3 scope sentences each | `src/content/projects.ts`                                                           | 6 typed case studies with marked `// PLACEHOLDER` metadata                               |
| **08** | **Project Construction Photography**       | 3 architectural record drawings or site photos per project (18 photos total, 16:9 or 3:2 ratio)                                          | `src/content/projects.ts` (gallery slots)                                           | 18 reserved architectural concrete drawing slots                                         |
| **09** | **Corporate Contact Records**              | Commercial site desk telephone, direct WhatsApp number, tender desk email, physical yard & registered office address                     | `src/content/contact.ts`, `src/content/site.ts`                                     | `+91 (0) 44 2847 0000`, `build@rcconstructions.com`, `Survey Plot 104, Chennai`          |
| **10** | **Social Sharing Open Graph Image**        | 1200×630 px PNG card featuring official brand marks                                                                                      | `public/og-image.png`                                                               | Script-generated architectural drawing token card                                        |
| **11** | **Legal Privacy Notice & Terms**           | Official regional privacy wording for construction tenders                                                                               | `src/content/contact.ts` (`privacyNotice`)                                          | Strict direct-enquiry plain privacy disclosure                                           |
| **12** | **Audited Track Record Metrics**           | Verified count of projects, years in practice, gross square footage built, and audited on-time handover rate                             | `src/content/completion.ts`                                                         | 4 metric counters with marked `"XX"` placeholders                                        |

---

## 2. Step-by-Step Replacement Instructions

### A. Configuring Formspree

1. Log into [formspree.io](https://formspree.io).
2. Create a form named **RC Constructions Site Tenders**.
3. Set the recipient email to the client's verified commercial bid desk.
4. Copy the form ID (e.g., `xpzvbnoq`).
5. Update your local `.env`:
   ```bash
   VITE_FORMSPREE_ID=xpzvbnoq
   ```
6. Add the environment variable in the Vercel Project Settings under **Environment Variables**.

### B. Supplying Founder & Project Media

1. Export high-resolution photography as optimized WebP and fallback JPEG formats.
2. For the Founder portrait: Place images in `src/assets/founder/` or configure direct CDN URLs in `src/content/founder.ts`.
3. For project gallery slots: Add photography into `src/assets/projects/` and reference them in `src/content/projects.ts`.

### C. Final Domain DNS Configuration

When deploying to Vercel:

1. In Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Add your custom domain (e.g., `rcconstructions.com` and `www.rcconstructions.com`).
3. Configure your DNS provider with the assigned `A` record (`76.76.21.21`) and `CNAME` record (`cname.vercel-dns.com`).
