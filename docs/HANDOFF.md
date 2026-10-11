# RC Constructions — Client Developer Handoff Manual (`docs/HANDOFF.md`)

This guide is written for the incoming software engineer or webmaster managing the RC Constructions portfolio codebase. It explains how to update content, photos, design tokens, endpoints, and deployment targets without breaking architectural constraints.

---

## 1. Codebase Architecture & File System Map

The codebase is engineered strictly with React 19, TypeScript strict mode, Vite, GSAP ScrollTrigger, and Lenis smooth scroll. It utilizes zero CSS utility frameworks (Tailwind is prohibited).

- `src/content/`: All textual and quantitative content lives in typed TypeScript constants. Never hardcode content strings in React components.
  - `site.ts`: Global brand name, default CTA, navigation links.
  - `about.ts`: Section 02 narrative, engineering principles, company background.
  - `services.ts`: Section 03 trade categories, drawing schedule, deliverables.
  - `projects.ts`: Section 04 portfolio register, project briefs, specifications, gallery records.
  - `process.ts`: Section 05 sequence of works and contractor milestones.
  - `completion.ts`: Section 06 audited statistical metrics and count-up values.
  - `founder.ts`: Founder monograph, biography paragraphs, verified site facts.
  - `contact.ts`: Direct enquiry channels (phone, WhatsApp, email, yard address), working hours.
- `src/styles/`:
  - `tokens.css`: Authoritative design system tokens (colors, typography scales, spacing, layer indices, radiuses).
  - `base.css`: Global baseline reset, CSS custom property bindings, focus-visible indicators.
- `src/components/`: Shared UI primitives (Building, SheetStack, Nav, Logo, LoadingLine, SurveyCursor, ProjectOverlay, ErrorBoundary).
- `src/sections/`: Discrete portfolio sheets matching each narrative chapter.
- `src/lib/`:
  - `motion.ts`: Authoritative numerical motion parameters (durations, easings, scrub thresholds).

---

## 2. How to Replace Content

### Step 1: Edit Typed Files in `src/content/`

To update company details or project data, open the relevant file in `src/content/`. For example, to update the contact channels in `src/content/contact.ts`:

```typescript
export const CONTACT_CONFIG = {
  rawPhone: '+914428470000', // Update digits for tel: links
  displayPhone: '+91 (0) 44 2847 0000', // Formatted visual representation
  email: 'tenders@rcconstructions.com', // Direct mail link
  address: 'Survey Plot 104, Industrial Corridor, Chennai', // Commercial office
  workingHours: 'Monday to Saturday, 08:00 – 18:00 IST',
} as const;
```

### Step 2: Validate Against Banned Words

The test suite strictly enforces the editorial tone law (`docs/DESIGN.md`). Running `pnpm test` will fail if copy contains banned tech-clichés:

- ❌ Forbidden: _cutting-edge, state-of-the-art, seamless, world-class, innovative, passionate, crafting, elevate, unlock, journey, solutions_.
- ❌ Forbidden: Exclamation marks (`!`).
- ✅ Permitted: Factual, measured, technical architectural descriptions.

---

## 3. How to Replace Photos & Assets

### Founder Portrait Slot

In `src/sections/Founder/Founder.tsx`, the founder portrait occupies a dedicated 4:5 ratio slot.

1. Place WebP and JPEG images (1200×1500 px) in `src/assets/founder/`.
2. Replace the placeholder drawing markup with an optimized `<picture>` or `<img>` element:

```tsx
<img
  src="/assets/founder-portrait.webp"
  alt="Gokul, Founder and Managing Director of RC Constructions"
  className="founder-portrait-img"
  loading="lazy"
  width={1200}
  height={1500}
/>
```

### Project Record Drawings & Photography

In `src/components/ProjectOverlay/ProjectOverlay.tsx`, each project detail sheet contains 3 record drawing slots defined in `src/content/projects.ts`:

1. Add photographic image paths to the `gallery` array in `src/content/projects.ts`.
2. Update `ProjectOverlay.tsx` to render `<img>` tags inside `.gallery-slot-block`.

---

## 4. How to Update Brand Colors & Design Tokens

All visual styles are governed by `src/styles/tokens.css`. Never use raw hex values in CSS files or inline React JSX.

To update the brand palette, modify the core tokens in `src/styles/tokens.css`:

```css
:root {
  --color-formwork-dark: #232622; /* Dark structural background */
  --color-limewash: #e9e7df; /* Crisp drawing surface & high-contrast text */
  --color-concrete: #c4c4bc; /* Blueprint gridlines & secondary copy */
  --color-steel: #7a7e78; /* Technical ruled borders & muted metadata */
  --color-work-lamp-amber: #e3b341; /* The sole focal accent (survey marks & primary CTA) */
}
```

> [!IMPORTANT]
> Amber (`--color-work-lamp-amber`) is strictly restricted to survey dimension lines, window illumination, and the primary CTA button. Never apply amber as a general wash or text color on light backgrounds.

---

## 5. How to Update Formspree Form ID

1. Obtain your production Formspree form ID from [formspree.io](https://formspree.io).
2. Set the ID in `.env`:
   ```bash
   VITE_FORMSPREE_ID=your_production_form_id
   ```
3. When building in Docker or deploying on Vercel, pass `VITE_FORMSPREE_ID` as a build argument or environment variable.
4. If `VITE_FORMSPREE_ID` is unset, the form safely renders a fallback error notification guiding visitors to contact the site office via direct email or telephone.

---

## 6. How to Update Custom Domain & Social Sharing

1. **`index.html`**:
   - Update `<link rel="canonical" href="https://yourdomain.com/" />`.
   - Update Open Graph and Twitter image URLs (`og:url`, `og:image`, `twitter:image`).
   - Update the JSON-LD `@id` and `url` attributes.
2. **`public/sitemap.xml`**: Update `<loc>https://yourdomain.com/</loc>`.
3. **`public/robots.txt`**: Update `Sitemap: https://yourdomain.com/sitemap.xml`.
4. Re-run `node scripts/generate-og-image.mjs` if you wish to regenerate the Open Graph share card.

---

## 7. Quality Gates & Release Verification

Before committing any modification, always execute the full verification suite:

```bash
pnpm check
```

This single command runs TypeScript type checking (`tsc -b`), ESLint, Stylelint, Prettier validation, Vitest unit tests, Knip dead-code auditing, and the production Vite bundle build. All must pass with **0 errors and 0 warnings**.
