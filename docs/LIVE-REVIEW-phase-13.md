# Live review (before Phase 13 fixes)

Target: `https://rc.unitaryx.org` (the `LIVE_URL` given for Phase 13; it answered). Date: 2026-10-16. Method: `node scripts/live-review.mjs` (Playwright, read-only, no form submission) at 1440x900 desktop and 390x844 mobile emulation on a clean profile, plus `curl -I`. Raw data: `docs/review/phase-13/live/live.json`; screenshots of every section: `docs/review/phase-13/live/<desktop|mobile>-<section>.png`.

The deployed bundle is the Phase 11 build (`index-CxyC5i0h.js`), so Phase 12 fixes were not live yet.

## Console, network, CSP

| Check                     | Desktop                                                                                     | Mobile |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| Console errors            | none                                                                                        | none   |
| Console warnings          | 4 × `Element not found: #foundation / #structure / #envelope / #fitout` (from `index-*.js`) | same 4 |
| Page errors               | none                                                                                        | none   |
| Failed requests           | none                                                                                        | none   |
| Non-2xx responses at load | none                                                                                        | none   |
| `securitypolicyviolation` | none                                                                                        | none   |
| WebAssembly errors        | none on a clean profile                                                                     | none   |
| 403 responses             | none                                                                                        | none   |

Findings:

- **"Element not found" warnings** come from GSAP resolving `'#foundation'`-style selector strings in scroll triggers before the sections exist in the DOM. They are our own code (Phase 11 build). The Phase 12 code passes DOM elements after the motion gate, so the warnings should be gone; Phase 13 adds a test that fails on any console warning or error.
- **No WASM errors and no 403s appear on a clean profile.** If the reviewer saw them, the likely sources are a browser extension or Vercel's preview toolbar (not part of the site), or the 404 for `/images/founder-gokul.jpg` and the lazy-loaded image. The page itself requests no WebAssembly (the bundle contains none) and the CSP does not include `wasm-unsafe-eval`. A real 403 would also be what Formspree returns when the form's allowed domain does not match; the form is currently disabled on live (see below), so no request is made.
- **Founder portrait is a 404 on live**: `/images/founder-gokul.jpg` returns 404 (the file was never committed). `naturalWidth` is 0.
- **Form is switched off on live**: the submit button is `disabled`; `VITE_FORMSPREE_ID` was not set at build time, so no Formspree request can happen. (This build still showed the old code-comment wording; fixed in Phase 12.)

## Hash links

All five on-page links resolve: `#main`, `#hero` (logo, back to top), `#contact` (Enquire, Request a quote). Section ids present: `hero, foundation, structure, envelope, fitout, completion, founder, contact`. No dead links. (The sitemap and JSON-LD point at a different domain, see below.)

## Headers

| URL                         | Status  | Content-Type                            | Cache-Control                         | `Access-Control-Allow-Origin` |
| --------------------------- | ------- | --------------------------------------- | ------------------------------------- | ----------------------------- |
| `/`                         | 200     | `text/html; charset=utf-8`              | `public, max-age=0, must-revalidate`  | `*`                           |
| `/assets/index-CxyC5i0h.js` | 200     | `application/javascript; charset=utf-8` | `public, max-age=31536000, immutable` | `*`                           |
| `/robots.txt`               | 200     | `text/plain; charset=utf-8`             | `public, max-age=0, must-revalidate`  | `*`                           |
| `/sitemap.xml`              | 200     | `application/xml`                       | `public, max-age=0, must-revalidate`  | `*`                           |
| `/.well-known/security.txt` | **404** | `text/html`                             | `public, max-age=0, must-revalidate`  | `*`                           |
| `/nonexistent-path`         | 404     | `text/html; charset=utf-8`              | `public, max-age=0, must-revalidate`  | `*`                           |

Present on every response: CSP (`default-src 'self'; ... connect-src 'self' https://formspree.io ...`), HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Findings:

1. **Wildcard CORS**: every response carries `Access-Control-Allow-Origin: *`. It is not in our `vercel.json` or `nginx.conf`; Vercel adds it to static deployments by default.
2. **`/.well-known/security.txt` does not exist** (404).
3. **Domain mismatch**: `<link rel="canonical">`, `og:url`, JSON-LD `url`, `robots.txt` Sitemap line and `sitemap.xml` all say `https://rcconstructions.com/`, while the site is served from `rc.unitaryx.org`.
4. HSTS carries `preload` although the final domain is not settled: preload should only be kept once the final domain is ready.
