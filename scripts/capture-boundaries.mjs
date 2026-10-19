// usage: node scripts/capture-boundaries.mjs <out-dir> [width] [height]
// Captures frames at every sheet boundary (the sheet-stack slide-overs).
/* global window, document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, width = '390', height = '844'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +width, height: +height } });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/#hero');
await page.waitForTimeout(2200);
const pairs = [
  ['hero', 'foundation'],
  ['fitout', 'completion'],
  ['completion', 'structure'],
  ['structure', 'envelope'],
  ['envelope', 'founder'],
  ['founder', 'contact'],
];
for (const [a, b] of pairs) {
  for (const f of [0.7, 0.4, 0.2]) {
    const y = await page.evaluate(
      ([id, frac]) => {
        const sheets = [...document.querySelectorAll('.sheet-stack > .sheet')];
        const idx = sheets.findIndex((s) => s.id === id);
        let top = 0;
        for (let i = 0; i <= idx; i++) top += sheets[i].offsetHeight;
        return top - window.innerHeight * frac;
      },
      [b === 'foundation' ? a : a, f],
    );
    await page.evaluate(
      (v) =>
        window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : window.scrollTo(0, v),
      y,
    );
    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(outDir, `${width}-${a}-${b}-${Math.round(f * 100)}.png`),
    });
  }
}
await browser.close();
console.log('done');
