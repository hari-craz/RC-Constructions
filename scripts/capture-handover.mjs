/* global window, document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/capture-handover.mjs <out-dir> [base-url]
// The handover screenshots (JPEG): every section and every building stage at 1440x900 and 390x844,
// and six angles of the house. Taken from the production build (vite preview) by default.
const out = process.argv[2] ?? 'docs/handover/screens';
const base = process.argv[3] ?? process.env.BASE_URL ?? 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });
const SIZES = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];
// [file name, section id, share of the section scrolled past]
const SECTIONS = [
  ['01-hero', 'hero', 0],
  ['02-about', 'foundation', 0.35],
  ['03-construction-process', 'fitout', 0.05],
  ['04-work-delivered', 'completion', 0.3],
  ['05-services', 'structure', 0.2],
  ['06-projects', 'envelope', 0.02],
  ['07-founder', 'founder', 0.1],
  ['08-contact', 'contact', 0.1],
];
// Building stages: each process step centred in the reading area (docs/BUILDING.md section 3), and
// the Work delivered stage once its headline is centred. [file name, 'step', step number]
const STAGES = [
  ['stage-1-excavation-and-pegs', 'section', 'foundation', 0.1],
  ['stage-2-footings-and-slab', 'step', 3],
  ['stage-3-frame', 'step', 4],
  ['stage-4-walls-and-openings', 'step', 5],
  ['stage-5-fit-out', 'step', 6],
  ['stage-6-completion-lit-windows', 'section', 'completion', 0.45],
];
const ANGLES = [
  ['front', 16, 0, 0],
  ['three-quarter-left', 16, -35, 0],
  ['side', 16, 90, 0],
  ['back', 16, 180, 0],
  ['from-above', 60, 25, 0],
  ['rolled', 30, -25, 25],
];

const browser = await chromium.launch();
for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
  });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await page.locator('.hero-model-widget').waitFor();
  await page.waitForTimeout(4800);
  const walkTo = async (target) => {
    const from = await page.evaluate(() => window.scrollY);
    const step = 80 * Math.sign(target - from || 1);
    for (let y = from; Math.abs(target - y) > 80; y += step) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(10);
    }
    await page.evaluate((v) => window.scrollTo(0, v), target);
    await page.waitForTimeout(700);
  };
  // Positions in the page, measured once at the top (sticky sheets move once they are scrolled)
  const spots = await page.evaluate(() => {
    const at = (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    };
    const sections = {};
    for (const el of document.querySelectorAll('.sheet-stack > .sheet')) sections[el.id] = at(el);
    const steps = [...document.querySelectorAll('.process-step-item')].map(at);
    return { sections, steps, vh: window.innerHeight };
  });
  const shoot = async (name, target) => {
    await walkTo(Math.max(0, Math.round(target)));
    await page.screenshot({
      path: path.join(out, `${name}-${size.name}.jpg`),
      type: 'jpeg',
      quality: 82,
    });
  };
  for (const [name, id, share] of SECTIONS) {
    const box = spots.sections[id];
    if (box) await shoot(name, box.top + box.height * share);
  }
  for (const [name, kind, a, b] of STAGES) {
    if (kind === 'step') {
      const step = spots.steps[a - 1];
      // The step is centred where the building is synced to read it: mid screen, or the upper part below 1024 px
      if (step)
        await shoot(name, step.top + step.height / 2 - spots.vh * (size.width < 1024 ? 0.3 : 0.5));
    } else {
      const box = spots.sections[a];
      if (box) await shoot(name, box.top + box.height * b);
    }
  }
  // The hand-over from the house to the building (a share of the About sheet's arrival)
  for (const [name, m] of [
    ['morph-1-front-elevation', 0.3],
    ['morph-2-landed-on-the-ground-line', 0.45],
    ['morph-3-dissolving', 0.65],
    ['morph-4-foundation-begins', 1],
  ]) {
    const hero = spots.sections.hero?.height ?? 0;
    await shoot(name, hero - spots.vh + m * spots.vh);
  }
  await context.close();

  // Without JavaScript: the still house, then the finished building
  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: size.width, height: size.height },
  });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(`${base}/`);
  await noJsPage.screenshot({
    path: path.join(out, `no-javascript-${size.name}.jpg`),
    type: 'jpeg',
    quality: 82,
    fullPage: true,
  });
  await noJs.close();

  // The house from six angles (the page held still by ?hm-test)
  const ctx2 = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const p2 = await ctx2.newPage();
  await p2.goto(`${base}/?hm-test`);
  await p2.waitForFunction(() => window.__hm !== undefined, null, { timeout: 20000 });
  await p2.waitForTimeout(600);
  // The test page holds the house still on a dark ground; show it on the hero's concrete
  await p2.addStyleTag({ content: 'html, body { background: var(--color-concrete) !important; }' });
  for (const [name, rx, ry, rz] of ANGLES) {
    await p2.evaluate(([a, b, c]) => window.__hm.setPose(a, b, c), [rx, ry, rz]);
    await p2.screenshot({
      path: path.join(out, `house-${name}-${size.name}.jpg`),
      type: 'jpeg',
      quality: 82,
    });
  }
  await ctx2.close();
}
await browser.close();
console.log('captured', out);
