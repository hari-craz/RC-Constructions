# RC Constructions: before real visitors see the site (`docs/BEFORE-GOING-LIVE.md`)

The checklist of what must be supplied or changed before launch. The questions to ask the company are in `docs/CONTENT-INTAKE.md`; the owner tasks for the form, domain and email are in `docs/FORM-AND-DOMAIN.md`.

## 0. Made-up sample details that must be replaced first

The site currently shows **sample** contact details. They look real and are not. Replace them before anyone outside the project sees the site (`src/content/company.ts`, `contact` block; then set `contact.isSample` to `false`):

| Sample shown                                            | Field                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Phone `+91 (0) 44 2847 0000`                            | `contact.phoneDisplay`, `contact.phoneRaw`                              |
| WhatsApp (same number)                                  | `contact.whatsappRaw` (`null` hides it)                                 |
| Email `build@rcconstructions.com`                       | `contact.email` (also the security.txt contact and the privacy contact) |
| Address `Survey Plot 104, Industrial Corridor, Chennai` | `contact.address`                                                       |
| Hours `Monday to Saturday, 08:00 to 18:00 IST`          | `contact.workingHours`                                                  |

The Contact section says "Sample contact details for this demo." while `contact.isSample` is `true`; setting it to `false` removes that line. The same values reach the page footer area, the Contact section, the no-JavaScript fallback, the privacy and terms pages, the error screen, and `security.txt`. They are no longer published as structured data.

Also sample: the **six projects** (labelled "Sample projects for this demo" on the page) and the **privacy retention period** (`legal.retentionPeriod`, flagged `retentionIsSample`).

## 1. Form, domain, email

| #   | Item                                                                                                    | Where                               |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | `VITE_FORMSPREE_ID` set in Vercel (Production) and the site redeployed; live form currently disabled    | `docs/FORM-AND-DOMAIN.md` section 1 |
| 2   | Formspree allowed domain matches the live host; recipient email verified                                | same                                |
| 3   | Final domain and DNS records; `src/config/site.json` and the `vercel.json` CORS origin updated together | section 2                           |
| 4   | SPF, DKIM, DMARC for the company mail provider                                                          | section 3                           |
| 5   | `Access-Control-Allow-Origin: *` gone from the live responses (Vercel-side if it persists)              | section 2, CORS                     |
| 6   | HSTS `preload` added only when the domain is final                                                      | section 2                           |

## 2. Company facts and media

| #   | Item                                                                                                                        | Field                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 7   | Legal name, founding year, licence or registration (only if wanted and provable)                                            | `company.ts` `legalName`, `facts.*`                                    |
| 8   | Track-record figures (projects, years, area, on-time share)                                                                 | `facts.*` (the "Work delivered" figures band stays hidden until given) |
| 9   | Founder surname, title, approved quote, experience line                                                                     | `founder.*`                                                            |
| 10  | Founder portrait: commit `public/images/founder-gokul.webp` and `.jpg` (1200 by 1500), then `founder.photoAvailable = true` | `company.ts`                                                           |
| 11  | Six real projects with three photos each                                                                                    | `src/content/projects.ts`                                              |
| 12  | Official tagline and call-to-action wording, if different                                                                   | `src/content/site.ts`                                                  |
| 13  | Logo and favicon artwork, social card (1200 by 630)                                                                         | `src/components/Logo/Logo.tsx`, `public/`                              |

## 3. Legal

| #   | Item                                                                                                      | Where                               |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 14  | Adviser reads `/privacy` and `/terms` (marked `REVIEW BY COMPANY ADVISER`) and answers the open questions | `docs/FORM-AND-DOMAIN.md` section 6 |
| 15  | Retention period and governing law supplied                                                               | `company.ts` `legal.*`              |
| 16  | Company reviews the final wording of all claims                                                           | `docs/CLAIMS-REVIEW.md`             |

## 4. After deploying

```bash
node scripts/check-live.mjs https://<live host>     # headers, canonical consistency, security.txt, clean console
```

Then run the form test yourself once (section 1, step 4 of `docs/FORM-AND-DOMAIN.md`).

## 5. Phase 15B: the exact list (owner approval needed for every item; none is done)

Phase 15A only prepares the release candidate. Nothing below has been done, and none of it changes the code. The detail for each is in `docs/FORM-AND-DOMAIN.md` and `docs/DEPLOYMENT.md`.

| #   | Item                                       | What to do                                                                                                                                                    | Evidence to keep                               |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Domain and DNS                             | Choose the final domain; add it in Vercel; set the DNS records Vercel shows; edit `src/config/site.json` and the `vercel.json` CORS origin together; redeploy | `node scripts/check-live.mjs https://<domain>` |
| 2   | Formspree allowed domain and an owner test | Set `VITE_FORMSPREE_ID` in Vercel (Production) and redeploy; allow exactly the live host in Formspree; the owner sends one test enquiry and deletes it        | The email arrives; the send button is amber    |
| 3   | SPF, DKIM and DMARC                        | Publish the records the company's mail provider gives for the company domain                                                                                  | A mail-tester or provider "verified" result    |
| 4   | Branch protection                          | Protect `main`: require the `ci-pass` check and the security checks, no force pushes                                                                          | Repository settings screenshot                 |
| 5   | Renovate                                   | Install the Renovate GitHub app for the repository (`renovate.json` pins TypeScript and ESLint majors)                                                        | The onboarding pull request appears            |
| 6   | The `v0.1.0` tag                           | Tag the release commit once items 1 to 5 are done (release-please then manages versions)                                                                      | The tag and the GHCR image                     |
| 7   | Uptime monitoring                          | Monitor `https://<domain>/healthz` (or `/`) from an external service and alert the owner                                                                      | A monitor and an alert contact                 |
| 8   | `security.txt` expiry reminder             | `Expires` is set under a year ahead on every build: put a calendar reminder 11 months after the last deploy, and redeploy before it                           | A reminder in the owner's calendar             |

Also before real visitors: sections 0 to 3 above (real contact details, real projects and photos, the adviser's review of `/privacy` and `/terms`).
