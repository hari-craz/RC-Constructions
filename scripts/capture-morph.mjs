/* global window, document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/capture-morph.mjs <out-dir> [w] [h] [m values, comma separated]
// The hero house morphing into the building: one frame per morph value m (0 = hero, 1 = the About
// sheet has arrived and the foundation begins), walking down the page so the scrub follows.
const out = process.argv[2] ?? 'docs/review/phase-14d/after';
const w = Number(process.argv[3] ?? 1440);
const h = Number(process.argv[4] ?? 900);
const ms = (process.argv[5] ?? '0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.15')
  .split(',')
  .map(Number);
const base = process.env.BASE_URL || 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(`${base}/`);
await page.locator('.hero-model-widget').waitFor();
await page.waitForTimeout(4800);
const toggle = page.getByRole('switch', { name: 'Auto-rotate' });
if ((await toggle.getAttribute('aria-checked')) === 'true') await toggle.click();
await page.getByRole('button', { name: 'Reset view' }).click();
await page.waitForTimeout(600);

const heroH = await page.evaluate(() => document.getElementById('hero')?.offsetHeight ?? 0);
const scrollTo = (y) =>
  page.evaluate((v) => {
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(v, { immediate: true });
    else window.scrollTo(0, v);
  }, y);

let at = 0;
for (const m of ms) {
  const target = Math.round(heroH - h + m * h);
  // Walk in small steps so every scrubbed part sees steady progress
  const step = 60 * Math.sign(target - at || 1);
  while (Math.abs(target - at) > 60) {
    at += step;
    await scrollTo(at);
    await page.waitForTimeout(15);
  }
  at = target;
  await scrollTo(at);
  await page.waitForTimeout(350);
  const name = `${w}x${h}-morph-${String(Math.round(m * 100)).padStart(3, '0')}.png`;
  await page.screenshot({ path: path.join(out, name) });
}
console.log('captured', out);
await browser.close();
