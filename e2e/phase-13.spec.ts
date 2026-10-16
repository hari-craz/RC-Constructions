import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { findBannedClaims } from '../src/content/claims';
import { parseSecurityTxtExpires } from '../src/lib/siteFiles';

const site = JSON.parse(readFileSync('src/config/site.json', 'utf8')) as { siteUrl: string };
const SITE_URL = site.siteUrl.replace(/\/$/, '');
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

async function open(page: Page, path: string) {
  await page.goto('about:blank');
  await page.goto(path);
  await page.waitForTimeout(1500);
}

function watch(page: Page, browserName = 'chromium') {
  const problems: string[] = [];
  page.on('console', (m) => {
    // Playwright's WebKit build on Windows reports the (used) font preloads as unused; no other engine does
    if (browserName === 'webkit' && /preloaded using link preload but not used/.test(m.text()))
      return;
    if (m.type() === 'error' || m.type() === 'warning')
      problems.push(`console ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e}`));
  page.on('requestfailed', (r) => problems.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 300 && r.status() < 400) return;
    if (r.status() >= 400) problems.push(`status ${r.status()}: ${r.url()}`);
  });
  return problems;
}

test.describe('Phase 13 — clean console, links, pages', () => {
  test('no console error or warning, no failed or non-2xx request, no cookies', async ({
    page,
    context,
    browserName,
  }) => {
    test.setTimeout(120_000);
    const problems = watch(page, browserName);
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.mouse.move(200, 200);
    for (const id of SECTIONS) {
      await page.goto(`/#${id}`);
      await page.waitForTimeout(700);
      await page.mouse.wheel(0, 200);
    }
    for (const path of ['/privacy', '/terms']) {
      await page.goto(path);
      await page.waitForTimeout(500);
    }
    await page.goto('/#project-residential-enclave');
    await page.waitForTimeout(1200);
    expect(problems).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });

  test('every in-page link target exists and no link points to an old section id', async ({
    page,
  }) => {
    await open(page, '/');
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href') as string)
        .filter((href) => href === '#' || !document.getElementById(href.slice(1))),
    );
    expect(bad).toEqual([]);
    for (const path of ['/privacy', '/terms']) {
      await open(page, path);
      const badLegal = await page.evaluate(() =>
        [...document.querySelectorAll('a[href^="#"]')]
          .map((a) => a.getAttribute('href') as string)
          .filter((href) => !document.getElementById(href.slice(1))),
      );
      expect(badLegal, path).toEqual([]);
    }
  });

  test('privacy and terms pages are linked, crawlable, accessible and consistent', async ({
    page,
    request,
  }) => {
    await open(page, '/#contact');
    const links = await page
      .locator('#contact .contact-footer-link')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(links).toEqual(['/privacy', '/terms']);
    await expect(page.locator('.contact-privacy-link')).toHaveAttribute('href', '/privacy');

    for (const [path, h1] of [
      ['/privacy', 'Privacy notice'],
      ['/terms', 'Terms of use'],
    ] as const) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type']).toContain('text/html');
      await open(page, path);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('main#main')).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${SITE_URL}${path}`,
      );
      expect(await page.evaluate(() => document.body.textContent)).not.toMatch(/%[A-Z_]+%/);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations, path).toEqual([]);
    }
    await open(page, '/privacy');
    const text = (await page.locator('main').textContent()) ?? '';
    for (const word of ['Formspree', 'cookies', 'delete', 'name', 'phone number']) {
      expect(text).toContain(word);
    }
  });

  test('security.txt, robots.txt and sitemap.xml are valid and use the site URL', async ({
    request,
  }) => {
    const sec = await request.get('/.well-known/security.txt');
    expect(sec.status()).toBe(200);
    expect(sec.headers()['content-type']).toContain('text/plain');
    const text = await sec.text();
    expect(text).toMatch(/^Contact: mailto:.+@.+$/m);
    expect(text).toMatch(/^Preferred-Languages: .+$/m);
    expect(text).toContain(`Canonical: ${SITE_URL}/.well-known/security.txt`);
    const expires = parseSecurityTxtExpires(text);
    expect(expires).not.toBeNull();
    const days = ((expires as Date).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(30);
    expect(days).toBeLessThan(366);

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const path of ['/', '/privacy', '/terms'])
      expect(sitemap).toContain(`<loc>${SITE_URL}${path}</loc>`);
    expect(sitemap).not.toContain('rcconstructions.com');
  });

  test('an unknown path is a 404, not a copy of the home page', async ({ request }) => {
    const res = await request.get('/this-page-does-not-exist');
    expect(res.status()).toBe(404);
  });
});

test.describe('Phase 13 — copy', () => {
  test('no placeholder text and no absolute or guarantee-style claim is visible', async ({
    page,
  }) => {
    await open(page, '/');
    const found = await page.evaluate(() => {
      const out: { text: string; inSlot: boolean }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = (n.textContent ?? '').trim();
        const el = n.parentElement;
        if (!text || !el || el.closest('script, style, noscript, .sr-only')) continue;
        out.push({
          text,
          inSlot: Boolean(
            el.closest('.projects-preview-slot, .gallery-slot-block, .founder-portrait-note'),
          ),
        });
      }
      return out;
    });
    const body = found.filter((f) => !f.inSlot).map((f) => f.text);
    for (const text of body) {
      expect(text, text).not.toMatch(/20XX|\bXX\b|to come|PLACEHOLDER|^\/\//);
      expect(findBannedClaims(text), text).toEqual([]);
      expect(text, text).not.toContain('!');
    }
    expect(body.join(' ')).toContain('Sample projects for this demo.');
  });

  test('project overlay copy is also free of banned claims and placeholders', async ({ page }) => {
    await open(page, '/#project-commercial-tower');
    const text = (await page.locator('[data-testid="project-overlay"]').textContent()) ?? '';
    expect(findBannedClaims(text)).toEqual([]);
    expect(text).not.toMatch(/20XX|PLACEHOLDER/);
    for (const heading of ['The challenge', 'What we did', 'Outcome'])
      expect(text).toContain(heading);
  });
});

test.describe('Phase 13 — readability', () => {
  test('services schedule, process steps and project register meet the type sizes', async ({
    page,
  }) => {
    for (const id of ['structure', 'fitout', 'envelope']) {
      await open(page, `/#${id}`);
      const result = await page.evaluate((sectionId) => {
        const size = (sel: string) =>
          [
            ...document.querySelectorAll(
              sel
                .split(',')
                .map((part) => `#${sectionId} ${part.trim()}`)
                .join(', '),
            ),
          ].map((e) => parseFloat(getComputedStyle(e).fontSize));
        return {
          scope: size('.services-scope, .process-step-desc'),
          row: size(
            '.services-name-cell, .process-step-title, .projects-row-name, .projects-row-outcome',
          ),
          secondary: size(
            '.services-typical, .process-step-deliverable, .projects-row-meta, .projects-row-spec, .services-th',
          ),
        };
      }, id);
      for (const v of result.scope) expect(v, `${id} body`).toBeGreaterThanOrEqual(16);
      for (const v of result.row) expect(v, `${id} row`).toBeGreaterThanOrEqual(15);
      for (const v of result.secondary) expect(v, `${id} secondary`).toBeGreaterThanOrEqual(14);
    }
  });

  test('services table has a visible sentence-case header row on desktop and stacks on phones', async ({
    page,
    isMobile,
  }) => {
    await open(page, '/#structure');
    const headers = page.locator('.services-th');
    if (isMobile) {
      await expect(page.locator('.services-table-header')).toBeHidden();
      const columns = await page
        .locator('.services-row')
        .first()
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(1);
    } else {
      await expect(headers).toHaveText(['No.', 'Trade and scope']);
      await expect(page.locator('.services-table-header')).toBeVisible();
    }
    await expect(page.locator('.services-row').first()).toHaveAttribute('tabindex', '0');
  });
});

test.describe('Phase 13 — survey cursor', () => {
  test('is at least 3:1 against the surface under it on every surface and keeps its size', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Fine pointer only');
    test.setTimeout(120_000);
    const points: [string, number, number][] = [
      ['/#hero', 600, 300], // concrete sheet
      ['/#foundation', 300, 500], // limewash sheet
      ['/#foundation', 1100, 300], // site window (formwork)
      ['/#structure', 300, 400], // concrete sheet
      ['/#structure', 1300, 700], // over the building
      ['/#completion', 1700, 30], // header action zone over the window
      ['/#contact', 300, 300], // limewash, full width
    ];
    for (const [path, x, y] of points) {
      await page.setViewportSize({ width: 1904, height: 1080 });
      await open(page, path);
      await page.mouse.move(x - 30, y - 30);
      await page.mouse.move(x, y, { steps: 3 });
      await page.waitForTimeout(250);
      const sample = await page.evaluate(
        ([px, py]) => {
          const lum = (rgb: string) => {
            const [r = 0, g = 0, b = 0] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
            const f = (v: number) => {
              const c = v / 255;
              return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            };
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
          };
          const under = document.elementFromPoint(px as number, py as number);
          let surface = 'rgb(255, 255, 255)';
          for (let el: Element | null = under; el; el = el.parentElement) {
            const bg = getComputedStyle(el).backgroundColor;
            const alpha = Number(
              (bg.match(/rgba?\(([^)]+)\)/)?.[1] ?? '').split(/[\s,/]+/)[3] ?? 1,
            );
            if (alpha > 0.5) {
              surface = bg;
              break;
            }
          }
          const dot = document.querySelector('.cursor-dot') as HTMLElement;
          const h = document.querySelector('.cursor-hairline-h') as HTMLElement;
          const marker = document.querySelector('[data-testid="survey-cursor"]') as HTMLElement;
          const ink = getComputedStyle(dot).backgroundColor;
          const [hi, lo] = [lum(ink), lum(surface)].sort((a, b) => b - a) as [number, number];
          return {
            ratio: (hi + 0.05) / (lo + 0.05),
            width: parseFloat(getComputedStyle(h).width),
            stroke: parseFloat(getComputedStyle(h).height),
            tone: marker.getAttribute('data-cursor-tone'),
            opacity: getComputedStyle(marker).opacity,
          };
        },
        [x, y],
      );
      expect(sample.ratio, `${path} @${x},${y} tone ${sample.tone}`).toBeGreaterThanOrEqual(3);
      expect(sample.width).toBeGreaterThanOrEqual(24);
      expect(sample.stroke).toBeGreaterThanOrEqual(1.5);
      expect(Number(sample.opacity)).toBeGreaterThan(0.9);
    }
  });

  test('stays visible through fast movement and keeps the native cursor in inputs', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Fine pointer only');
    await open(page, '/#contact');
    for (let i = 0; i < 40; i++) await page.mouse.move(100 + i * 30, 200 + (i % 5) * 60);
    await page.waitForTimeout(200);
    const marker = page.locator('[data-testid="survey-cursor"]');
    expect(Number(await marker.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(
      0.9,
    );

    const input = page.locator('input[name="name"]');
    await input.scrollIntoViewIfNeeded();
    await input.hover();
    await page.waitForTimeout(150);
    await expect(marker).toHaveAttribute('data-cursor-state', 'hidden');
    // A native cursor (text, or the browser default) must remain; never `none`
    expect(['text', 'auto']).toContain(await input.evaluate((el) => getComputedStyle(el).cursor));
  });
});
