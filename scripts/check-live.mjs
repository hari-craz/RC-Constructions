/* global window, document */
/*
 * Read-only check of a deployed site: headers, canonical consistency, robots.txt, sitemap.xml,
 * security.txt, legal pages, and (unless --no-browser) a clean console and no failed requests.
 * It never submits the form. No dependencies beyond Node and the already-installed Playwright.
 *
 *   node scripts/check-live.mjs [url] [--no-browser]
 *
 * The URL defaults to src/config/site.json (the single canonical site URL). Against a local
 * build (localhost) the canonical checks still expect the configured live origin.
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const noBrowser = args.includes('--no-browser');
const configured = JSON.parse(
  fs.readFileSync(new URL('../src/config/site.json', import.meta.url), 'utf8'),
).siteUrl;
const base = (args.find((a) => !a.startsWith('--')) || configured).replace(/\/$/, '');
const checked = new URL(base);
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(checked.hostname);
// Against a local build the canonical URL is still the configured live origin
const origin = isLocal ? new URL(configured).origin : checked.origin;

let failures = 0;
const ok = (name, detail = '') => console.log(`PASS  ${name}${detail ? `  ${detail}` : ''}`);
const fail = (name, detail = '') => {
  failures += 1;
  console.log(`FAIL  ${name}${detail ? `  ${detail}` : ''}`);
};
const check = (cond, name, detail) => (cond ? ok(name) : fail(name, detail));

async function get(path, init) {
  const res = await fetch(base + path, { redirect: 'manual', ...init });
  return { res, text: await res.text() };
}

// 1. Home page and headers
const home = await get('/');
const h = (name) => home.res.headers.get(name) || '';
check(home.res.status === 200, 'GET / is 200', `status ${home.res.status}`);
check(/text\/html/.test(h('content-type')), 'home is text/html');
const csp = h('content-security-policy');
check(
  Boolean(csp) && !/unsafe-(inline|eval)|wasm-unsafe-eval|\*/.test(csp),
  'CSP present, no unsafe sources or wildcard',
  csp,
);
check(
  /frame-ancestors 'none'/.test(csp) || /deny|sameorigin/i.test(h('x-frame-options')),
  'framing is blocked',
);
const hsts = h('strict-transport-security');
check(
  /max-age=(\d+)/.test(hsts) && Number(/max-age=(\d+)/.exec(hsts)?.[1]) >= 31536000,
  'HSTS max-age at least one year',
  hsts,
);
if (/preload/.test(hsts))
  console.log('NOTE  HSTS includes "preload": keep it only once the final domain is ready');
check(/nosniff/i.test(h('x-content-type-options')), 'X-Content-Type-Options: nosniff');
check(Boolean(h('referrer-policy')), 'Referrer-Policy present', h('referrer-policy'));
check(Boolean(h('permissions-policy')), 'Permissions-Policy present', h('permissions-policy'));
check(
  h('access-control-allow-origin') !== '*',
  'no wildcard Access-Control-Allow-Origin',
  `got "${h('access-control-allow-origin')}"`,
);
check(
  !/immutable/.test(h('cache-control')),
  'home page is not cached as immutable',
  h('cache-control'),
);

const asset = /\/assets\/[^"']+\.js/.exec(home.text)?.[0];
if (asset) {
  const a = await get(asset, { method: 'HEAD' });
  check(a.res.status === 200, 'hashed asset is 200', `status ${a.res.status}`);
  check(
    /immutable/.test(a.res.headers.get('cache-control') || ''),
    'hashed asset is cached as immutable',
  );
  check(a.res.headers.get('access-control-allow-origin') !== '*', 'no wildcard CORS on assets');
} else {
  fail('found a hashed asset in the home page');
}

// 2. Canonical consistency
const canonical = /<link rel="canonical" href="([^"]+)"/.exec(home.text)?.[1];
const ogUrl = /<meta property="og:url" content="([^"]+)"/.exec(home.text)?.[1];
let jsonLdUrl;
try {
  jsonLdUrl = JSON.parse(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(home.text)?.[1] ?? '{}',
  ).url;
} catch {
  jsonLdUrl = undefined;
}
const expectedHome = `${origin}/`;
check(
  canonical === expectedHome,
  'canonical link matches the live origin',
  `${canonical} vs ${expectedHome}`,
);
check(ogUrl === expectedHome, 'og:url matches the live origin', `${ogUrl}`);
check(jsonLdUrl === expectedHome, 'JSON-LD url matches the live origin', `${jsonLdUrl}`);
check(
  isLocal || new URL(configured).origin === origin,
  'src/config/site.json matches the checked origin',
  `${configured} vs ${origin}`,
);

// 3. robots, sitemap, security.txt
const robots = await get('/robots.txt');
check(
  robots.res.status === 200 && robots.text.includes(`Sitemap: ${origin}/sitemap.xml`),
  'robots.txt points at this origin sitemap',
);
const sitemap = await get('/sitemap.xml');
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(
  sitemap.res.status === 200 && locs.length > 0 && locs.every((l) => l.startsWith(origin)),
  'sitemap.xml lists only this origin',
  locs.join(', '),
);
const sec = await get('/.well-known/security.txt');
check(sec.res.status === 200, 'security.txt is 200', `status ${sec.res.status}`);
check(
  /text\/plain/.test(sec.res.headers.get('content-type') || ''),
  'security.txt is text/plain',
  sec.res.headers.get('content-type'),
);
check(/^Contact: .+/m.test(sec.text), 'security.txt has Contact');
const expires = /^Expires:\s*(.+)$/m.exec(sec.text)?.[1];
const days = expires ? (new Date(expires).getTime() - Date.now()) / 86_400_000 : NaN;
check(
  days > 30 && days < 366,
  'security.txt Expires is 30 to 365 days ahead',
  `${expires} (${Math.round(days)} days)`,
);
check(
  sec.text.includes(`Canonical: ${origin}/.well-known/security.txt`),
  'security.txt Canonical matches',
);

// 4. Legal pages and 404
for (const path of ['/privacy', '/terms']) {
  const page = await get(path);
  check(
    page.res.status === 200 && /<h1>/.test(page.text),
    `${path} is 200 with a heading`,
    `status ${page.res.status}`,
  );
}
const missing = await get('/this-page-does-not-exist');
check(missing.res.status === 404, 'unknown path is 404', `status ${missing.res.status}`);

// 5. Browser: clean console, no failed requests (desktop and mobile)
if (!noBrowser) {
  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch();
    for (const profile of [
      { name: 'desktop', viewport: { width: 1440, height: 900 } },
      { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    ]) {
      const ctx = await browser.newContext(profile);
      const page = await ctx.newPage();
      const problems = [];
      page.on(
        'console',
        (m) =>
          ['error', 'warning'].includes(m.type()) &&
          problems.push(`console ${m.type()}: ${m.text()}`),
      );
      page.on('pageerror', (e) => problems.push(`pageerror: ${e}`));
      page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`));
      page.on(
        'response',
        (r) => r.status() >= 400 && problems.push(`status ${r.status()}: ${r.url()}`),
      );
      await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) =>
          window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      await page.goto(base + '/', { waitUntil: 'load' });
      await page.waitForTimeout(2500);
      await page.mouse.move(200, 200);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(2000);
      for (const v of await page.evaluate(() => window.__csp)) problems.push(`csp violation: ${v}`);
      const broken = await page.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      );
      for (const src of broken) problems.push(`broken image: ${src}`);
      check(
        problems.length === 0,
        `${profile.name}: clean console, no failed or non-2xx request, no broken image`,
        problems.join(' | '),
      );
      await ctx.close();
    }
    await browser.close();
  } catch (error) {
    console.log(`SKIP  browser checks (${error instanceof Error ? error.message : error})`);
  }
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
