/* global window, document */
/* Read-only review of a live URL: console, network, CSP violations, headers, hash links, screenshots.
 * usage: node scripts/live-review.mjs [url] [outDir]   (never submits the form) */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const url = (process.argv[2] || 'https://rc.unitaryx.org').replace(/\/$/, '');
const out = process.argv[3] || 'docs/review/phase-13/live';
fs.mkdirSync(out, { recursive: true });

const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
const SECTIONS = [
  'hero',
  'foundation',
  'structure',
  'envelope',
  'fitout',
  'completion',
  'founder',
  'contact',
];
const report = { url, date: new Date().toISOString(), profiles: {}, headers: {}, hashLinks: [] };

const browser = await chromium.launch();
for (const p of profiles) {
  const ctx = await browser.newContext({
    viewport: p.viewport,
    isMobile: p.isMobile,
    hasTouch: p.hasTouch,
  });
  const page = await ctx.newPage();
  const entry = { console: [], pageErrors: [], failed: [], nonOk: [], violations: [] };
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()))
      entry.console.push({ type: m.type(), text: m.text(), location: m.location().url });
  });
  page.on('pageerror', (e) => entry.pageErrors.push(String(e)));
  page.on('requestfailed', (r) =>
    entry.failed.push({ url: r.url(), reason: r.failure()?.errorText, type: r.resourceType() }),
  );
  page.on('response', (r) => {
    if (r.status() >= 300) {
      const req = r.request();
      entry.nonOk.push({
        status: r.status(),
        url: r.url(),
        type: req.resourceType(),
        initiator: req.frame()?.url() || '',
        redirectedFrom: req.redirectedFrom()?.url(),
      });
    }
  });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push({
        directive: e.violatedDirective,
        blocked: e.blockedURI,
        source: e.sourceFile,
        line: e.lineNumber,
      }),
    );
  });
  await page.goto(url + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  // trigger the deferred motion layer the way a visitor would
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(2500);
  entry.violations = await page.evaluate(() => window.__csp);
  if (p.name === 'desktop') {
    report.hashLinks = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => ({
        href: a.getAttribute('href'),
        text: (a.textContent || '').trim().slice(0, 40),
        targetExists:
          a.getAttribute('href') === '#'
            ? false
            : !!document.getElementById(a.getAttribute('href').slice(1)),
      })),
    );
    report.sectionIds = await page.evaluate(() =>
      [...document.querySelectorAll('section[id]')].map((s) => s.id),
    );
    report.images = await page.evaluate(() =>
      [...document.images].map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth })),
    );
    report.formDisabled = await page.evaluate(() => {
      const b = document.querySelector('.contact-submit-btn');
      return {
        found: !!b,
        disabled: b ? b.disabled : null,
        note: document.querySelector('.contact-config-note')?.textContent || null,
      };
    });
  }
  for (const id of SECTIONS) {
    const pg = await ctx.newPage();
    await pg.goto(`${url}/#${id}`, { waitUntil: 'load' });
    await pg.waitForTimeout(2200);
    await pg.screenshot({ path: path.join(out, `${p.name}-${id}.png`) });
    await pg.close();
  }
  report.profiles[p.name] = entry;
  await ctx.close();
}
await browser.close();

for (const [label, p] of [
  ['/', '/'],
  ['asset', null],
  ['/robots.txt', '/robots.txt'],
  ['/sitemap.xml', '/sitemap.xml'],
  ['/.well-known/security.txt', '/.well-known/security.txt'],
  ['/nonexistent-path', '/nonexistent-path'],
]) {
  let target = p;
  if (label === 'asset') {
    const html = await (await fetch(url + '/')).text();
    target = (html.match(/\/assets\/[^"']+\.js/) || [])[0];
  }
  if (!target) continue;
  const res = await fetch(url + target, { redirect: 'manual' });
  report.headers[`${label} ${target}`] = {
    status: res.status,
    headers: Object.fromEntries(res.headers),
  };
}
fs.writeFileSync(path.join(out, 'live.json'), JSON.stringify(report, null, 2));
console.log('wrote', path.join(out, 'live.json'));
