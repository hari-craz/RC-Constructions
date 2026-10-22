/* global window, document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/capture-sections.mjs <out-dir> [base-url] [sizes=390x844,360x640,768x1024] [shots=3]
// Scrolls down the page (in steps, so the scroll-driven building follows) and takes `shots`
// screenshots inside every section: at its top, partway and near its end. Files are named
// <size>-<section id>-<n>.png, in page order.
const out = process.argv[2] ?? 'tmp-sections';
const base = process.argv[3] ?? process.env.BASE_URL ?? 'http://localhost:4173';
const sizes = (process.argv[4] ?? '390x844,360x640,768x1024').split(',').map((s) => {
  const [width, height] = s.split('x').map(Number);
  return { name: s, width, height };
});
const shots = Number(process.argv[5] ?? 3);
fs.mkdirSync(out, { recursive: true });

const SECTIONS = [
  'hero',
  'foundation',
  'fitout',
  'completion',
  'structure',
  'envelope',
  'founder',
  'contact',
];

const browser = await chromium.launch();
for (const vp of sizes) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
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
    await page.waitForTimeout(450);
  };
  for (const id of SECTIONS) {
    const box = await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    }, id);
    if (!box) continue;
    for (let k = 0; k < shots; k++) {
      const share = shots === 1 ? 0 : k / shots;
      const target = Math.max(0, Math.round(box.top + box.height * share - (k === 0 ? 0 : 0)));
      await walkTo(target);
      await page.screenshot({ path: path.join(out, `${vp.name}-${id}-${k}.png`) });
    }
  }
  await context.close();
}
await browser.close();
console.log('captured', out);
