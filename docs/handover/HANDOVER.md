# RC Constructions site: handover (one page)

## What the site is

A single-page, scroll-driven portfolio for RC Constructions, a general contractor. A 3D house in the hero is taken down as the visitor scrolls and a building is constructed from the foundation up, one step for each step of the company's process. Sections, in order: Hero, About, Construction process, Work delivered, Services, Projects, Founder, Contact. Privacy and terms are two extra pages (`/privacy`, `/terms`). Stack: React 19, Vite, TypeScript, hand-written CSS from design tokens, GSAP and Lenis (loaded lazily). There are no 3D, UI or CSS frameworks.

The demo address is `https://rc.unitaryx.org`. The page works without JavaScript as a still drawing of the house and of the finished building, with the phone number and email.

## How it is hosted and deployed

- **Hosting**: Vercel, through its Git integration only (no deploy workflow, no Vercel token in the repository). Pushing to `main` deploys. Headers and security policy are in `vercel.json`.
- **Container**: a multi-stage, non-root Nginx image on port 8080 with `/healthz` (`Dockerfile`, `nginx.conf`); built and published to GHCR by the release workflow. `pnpm compare:headers` checks that `vercel.json` and `nginx.conf` send the same headers.
- **Checks**: `pnpm check` (types, lint, CSS lint, formatting, unit tests, unused code, build), `pnpm size` (JavaScript under 180 kB), `pnpm test:e2e` (Playwright on five browser projects, including accessibility and the house drawing). GitHub Actions run the same and a Lighthouse check; branch protection should require the `ci-pass` check (Phase 15B).
- **After a deploy**: `node scripts/check-live.mjs <url>` (headers, CSP, `security.txt`, robots, sitemap, social card, clean console) and `node scripts/check-links.mjs <url>` (no dead links; `mailto:`, `tel:` and WhatsApp links match `company.ts`).

## How to change content

Every company fact lives in **`src/content/company.ts`** and nowhere else. A value of `null` hides its element; nothing is ever invented to fill a gap.

1. Open `src/content/company.ts`. The contact block holds what the company supplied on its business card (two phone numbers, email, address). Add `whatsappRaw` and `workingHours` when the company gives them (a `null` value hides the row); `contact.isSample` is `false`.
2. Add facts only when the company can prove them: `facts.*` (years, projects, area, on-time share), `founder.*`, `legalName`, `legal.*`.
3. Words on the page are in `src/content/*.ts` (about, process, services, projects, completion, founder, contact, site). Tests reject banned wording (guarantee-style claims, exclamation marks); run `pnpm test`.
4. The one canonical URL is `src/config/site.json`; meta tags, sitemap, robots, `security.txt` and structured data are generated from it.

The full list of what is still a placeholder, field by field, is **`docs/CONTENT-STATUS.md`**.

## How to swap in real photos

- **Founder portrait**: commit `public/images/founder-gokul.webp` and `public/images/founder-gokul.jpg` (1200 by 1500, real image files), then set `founder.photoAvailable` to `true` in `company.ts`. A test refuses the flag if the files are missing or are not real images.
- **Projects**: replace the six sample records in `src/content/projects.ts` with real ones (three photos each, named by the gallery ids), and remove the `sampleNote` when no sample is left. A named client needs the client's permission.

## What is still placeholder

See `docs/CONTENT-STATUS.md`. In short: contact phone, WhatsApp, email, address and hours; the six projects; the privacy retention period; every `facts.*` number; the founder's surname, quote and portrait; the form ID; the final domain. The privacy and terms pages say "Draft, pending legal review." and need the company's adviser.

## Logo and brand

The mark is the company's own logo (a house outline with blocks marked R and C), redrawn as geometry in `src/components/Logo/markGeometry.ts`. The header shows it in one colour so it follows the page colours; the favicon, app icons and social card show it in the company's blue and grey. After changing it, run `pnpm generate:favicons` and `pnpm generate:og`. The logo's own line, "Build Your Hopes", is not on the page: the site's hero line is "We build homes, offices, factories and roads." Decide which the company wants.

## What has not been done on purpose

Nothing has been pushed, tagged, deployed or changed on GitHub, Vercel or DNS by this phase. The owner's list for the next phase (domain and DNS, form, email records, branch protection, Renovate, the `v0.1.0` tag, uptime monitoring) is in `docs/BEFORE-GOING-LIVE.md`, section 5.

## Who to contact

- **Repository, Vercel and DNS**: the site owner (the GitHub account that owns the repository).
- **For NEXISARC**: the project lead's name and email go here. _Owner to fill in before handover; it is not known to the repository._
- **Security reports**: `SECURITY.md` and `/.well-known/security.txt` (the contact is `contact.email`).

More detail: `docs/HANDOFF.md` (developer manual), `docs/BUILDING.md` (the building and the house), `docs/DESIGN.md` (design law), `docs/PERFORMANCE.md`, `docs/DEPLOYMENT.md`, `docs/FORM-AND-DOMAIN.md`.
