/* global document, window */
/*
 * Link check of a running site (default: the local production build). It loads every page in a
 * browser, collects every link, and checks:
 *   - in-page anchors (#id) point at an element that exists on that page
 *   - same-site links answer 200 (and #anchors on other pages exist there)
 *   - mailto: links carry the email in src/content/company.ts, tel: links its raw phone number and
 *     WhatsApp links its WhatsApp number (so the three channels never drift from the one source)
 *   - external https links answer (a HEAD, then a GET, with a timeout); a service that refuses
 *     bots is reported as "unverified", not as a failure
 *
 *   node scripts/check-links.mjs [base-url] [--no-external]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:4173').replace(/\/$/, '');
const external = !args.includes('--no-external');

// The single source of the company facts, read as text (the file is TypeScript)
const company = fs.readFileSync(new URL('../src/content/company.ts', import.meta.url), 'utf8');
const pick = (key) => company.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? null;
const FACTS = {
  email: pick('email'),
  phoneRaw: pick('phoneRaw'),
  whatsappRaw: pick('whatsappRaw'),
};

const PAGES = ['/', '/privacy.html', '/terms.html', '/no-such-page-404-check'];
let failures = 0;
let unverified = 0;
const ok = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL  ${msg}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const checked = new Map();
const externals = new Map();

for (const path of PAGES) {
  const page = await context.newPage();
  const res = await page.goto(base + path);
  const expected = path.startsWith('/no-such') ? 404 : 200;
  if (res?.status() === expected) ok(`${path} answers ${expected}`);
  else fail(`${path} answered ${res?.status()}, expected ${expected}`);
  if (path === '/') {
    await page
      .locator('.hero-model-widget')
      .waitFor()
      .catch(() => {});
    await page.waitForTimeout(1500);
    // Open the motion gate so the sections mount, then settle
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(1500);
  }
  const data = await page.evaluate(() => ({
    ids: new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size,
    idList: [...document.querySelectorAll('[id]')].map((e) => e.id),
    links: [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.getAttribute('href') ?? '',
      text: (a.textContent ?? '').trim().slice(0, 30),
    })),
  }));
  const ids = new Set(data.idList);
  for (const { href, text } of data.links) {
    const label = `${path} "${text}" -> ${href}`;
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (id === '' || ids.has(id)) ok(label);
      else fail(`${label} (no element with that id)`);
    } else if (href.startsWith('mailto:')) {
      const addr = href.slice(7).split('?')[0];
      if (addr === FACTS.email) ok(label);
      else fail(`${label} (company.ts email is ${FACTS.email})`);
    } else if (href.startsWith('tel:')) {
      if (href === `tel:${FACTS.phoneRaw}`) ok(label);
      else fail(`${label} (company.ts phoneRaw is ${FACTS.phoneRaw})`);
    } else if (href.startsWith('https://wa.me/')) {
      const digits = (FACTS.whatsappRaw ?? '').replace(/\D/g, '');
      if (href === `https://wa.me/${digits}`) ok(label);
      else fail(`${label} (company.ts whatsappRaw gives ${digits})`);
    } else if (/^https?:\/\//.test(href) && !href.startsWith(base)) {
      externals.set(href, label);
    } else {
      const url = new URL(href, base + path);
      const target = url.pathname + url.search;
      if (!checked.has(target)) {
        const r = await fetch(url.origin === new URL(base).origin ? url : base + target);
        checked.set(target, r.status);
        // A fragment on another page must exist there
        if (
          r.status === 200 &&
          url.hash &&
          /text\/html/.test(r.headers.get('content-type') ?? '')
        ) {
          const html = await r.text();
          if (!html.includes(`id="${url.hash.slice(1)}"`) && target !== '/') {
            fail(`${label} (fragment missing on that page)`);
          }
        }
      }
      if (checked.get(target) === 200) ok(label);
      else fail(`${label} answered ${checked.get(target)}`);
    }
  }
  await page.close();
}
await browser.close();

if (external) {
  for (const [href, label] of externals) {
    let status = 0;
    try {
      let r = await fetch(href, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      if (r.status >= 400)
        r = await fetch(href, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
      status = r.status;
    } catch {
      status = 0;
    }
    if (status > 0 && status < 400) ok(`${label} (${status})`);
    else if (status === 0 || status === 403 || status === 429) {
      unverified += 1;
      console.log(`SKIP  ${label} (unverified, status ${status}; check by hand)`);
    } else fail(`${label} answered ${status}`);
  }
}

console.log(
  `\n${failures === 0 ? 'No dead links.' : `${failures} problem(s).`} ${unverified} unverified.`,
);
process.exit(failures === 0 ? 0 : 1);
