/* global window, document */
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// usage: node scripts/capture.mjs <phase-dir> <before|after> [chromium|webkit|firefox] [viewport-prefix]
const [phase = 'phase-14', which = 'after', engine = 'chromium', only] = process.argv.slice(2);
const base = process.env.BASE_URL || 'http://localhost:4173';
const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../docs/review/${phase}/${which}`,
);
fs.mkdirSync(dir, { recursive: true });

const ALL = [
  { name: '1904x1080', width: 1904, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];
// Full set at the four review widths; 1280 and 1024 only get header and transition frames
const REVIEW = new Set(['1904x1080', '1440x900', '768x1024', '390x844']);
const TRANSITION_WIDTHS = new Set([
  '1904x1080',
  '1440x900',
  '1280x800',
  '1024x768',
  '768x1024',
  '390x844',
]);
// ONLY_TRANSITIONS=1 captures just the hero-to-window frames (fast iteration)
const ONLY_TRANSITIONS = Boolean(process.env.ONLY_TRANSITIONS);
const HEADER_WIDTHS = new Set(['1904x1080', '1440x900', '1280x800', '1024x768', '390x844']);

// New story order; ids are unchanged
const SECTIONS = [
  ['01-hero', 'hero'],
  ['02-about', 'foundation'],
  ['03-process', 'fitout'],
  ['04-work-delivered', 'completion'],
  ['05-services', 'structure'],
  ['06-projects', 'envelope'],
  ['07-founder', 'founder'],
  ['08-contact', 'contact'],
];

const launcher = { chromium, webkit, firefox }[engine];
const browser = await launcher.launch();

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function scrollToY(page, y) {
  await page.evaluate(
    (v) =>
      window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v),
    y,
  );
}

/** Centre an element in the viewport (two passes: sticky sheets move as we scroll). */
async function centre(page, selector, index = 0) {
  for (let pass = 0; pass < 2; pass++) {
    const y = await page.evaluate(
      ([sel, i]) => {
        const el = document.querySelectorAll(sel)[i];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return window.scrollY + r.top + r.height / 2 - window.innerHeight / 2;
      },
      [selector, index],
    );
    if (y === null) return false;
    await scrollToY(page, y);
    await page.waitForTimeout(450);
  }
  return true;
}

async function sectionTop(page, id) {
  return page.evaluate((target) => {
    const sheets = [...document.querySelectorAll('.sheet-stack > .sheet')];
    const idx = sheets.findIndex((s) => s.id === target);
    let top = 0;
    for (let i = 0; i < idx; i++) top += sheets[i].offsetHeight;
    return top;
  }, id);
}

for (const vp of ALL) {
  if (only && !vp.name.startsWith(only)) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const prefix = engine === 'chromium' ? vp.name : `${engine}-${vp.name}`;
  const shot = (name, opts = {}) =>
    page.screenshot({ path: path.join(dir, `${prefix}-${name}.png`), ...opts });

  if (REVIEW.has(vp.name) && !ONLY_TRANSITIONS) {
    // Every section, by hash
    for (const [name, id] of SECTIONS) {
      await page.goto('about:blank');
      await page.goto(`${base}/#${id}`);
      await settle(page, 2200);
      await shot(name);
    }

    // Process: each step centred (drives structure, envelope and fit-out in parts)
    await page.goto('about:blank');
    await page.goto(`${base}/#fitout`);
    await settle(page, 2200);
    for (let i = 0; i < 6; i++) {
      if (await centre(page, '.process-step-item', i)) {
        await settle(page, 700);
        await shot(`process-step-${i + 1}`);
      }
    }

    // Projects: default, then each row active (hover on desktop, focus elsewhere)
    await page.goto('about:blank');
    await page.goto(`${base}/#envelope`);
    await settle(page, 2200);
    await centre(page, '.projects-register');
    await shot('projects-default');
    const rows = page.locator('.projects-row-btn');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await rows
        .nth(i)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      // Pointer devices hover (no focus ring); phones focus
      if (vp.width >= 1024) await rows.nth(i).hover();
      else await rows.nth(i).focus();
      await settle(page, 700);
      await shot(`projects-row-${i + 1}`);
    }

    // Drawer open on the first project, then next
    await page.goto('about:blank');
    await page.goto(`${base}/#project-residential-enclave`);
    await settle(page, 2000);
    await shot('drawer-1');
    const next = page.getByRole('button', { name: /next/i }).first();
    if (await next.count()) {
      await next.click().catch(() => {});
      await settle(page, 900);
      await shot('drawer-2');
    }

    // Form focus
    await page.goto('about:blank');
    await page.goto(`${base}/#contact`);
    await settle(page, 2000);
    const field = page.locator('.contact-input').first();
    if (await field.count()) {
      await field.focus();
      await settle(page, 400);
      await shot('form-focus');
    }
  }

  // Header at the widths where the layout changes
  if (HEADER_WIDTHS.has(vp.name) && !ONLY_TRANSITIONS) {
    await page.goto('about:blank');
    await page.goto(`${base}/#fitout`);
    await settle(page, 2200);
    await shot('header-process', { clip: { x: 0, y: 0, width: vp.width, height: 90 } });
    if (vp.width < 1280) {
      await page.locator('.nav-sections-toggle').click();
      await settle(page, 500);
      await shot('header-dialog');
    }
  }

  // Hero to window: five mid-transition frames
  if (TRANSITION_WIDTHS.has(vp.name)) {
    await page.goto('about:blank');
    await page.goto(`${base}/`);
    await settle(page, 2200);
    const top = await sectionTop(page, 'foundation');
    const frames = [1.0, 0.8, 0.6, 0.4, 0.2, 0.0];
    for (const f of frames) {
      await scrollToY(page, top - vp.height * f);
      await settle(page, 700);
      await shot(`transition-hero-window-${Math.round(f * 100)}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log('captured', dir);
