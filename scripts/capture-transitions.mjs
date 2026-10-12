/* global window, document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs/review/phase-11/after',
);
fs.mkdirSync(dir, { recursive: true });
const base = process.argv[2] || 'http://localhost:4173';
const vps = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1904x1080', width: 1904, height: 1080 },
  { name: '360x640', width: 360, height: 640 },
];
const pairs = [
  ['structure', 'envelope'],
  ['fitout', 'completion'],
];
const browser = await chromium.launch();
for (const vp of vps) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(base + '/');
  await page.waitForTimeout(2500);
  for (const [a, b] of pairs) {
    for (const frac of [0.7, 0.35]) {
      const y = await page.evaluate(
        ([id, f]) => {
          const sheets = [...document.querySelectorAll('.sheet-stack > .sheet')];
          const idx = sheets.findIndex((s) => s.id === id);
          let top = 0;
          for (let i = 0; i <= idx; i++) top += sheets[i].offsetHeight;
          return top - window.innerHeight * f;
        },
        [a, frac],
      );
      await page.evaluate(
        (v) =>
          window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v),
        y,
      );
      await page.waitForTimeout(900);
      await page.screenshot({
        path: path.join(dir, `${vp.name}-transition-${a}-to-${b}-${Math.round(frac * 100)}.png`),
      });
    }
  }
  await page.close();
}
await browser.close();
console.log('done');
