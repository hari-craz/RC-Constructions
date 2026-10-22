/* global window */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/render-model-grid.mjs <out-dir> [step=1] [base-url]
// Renders the real hero house SVG at a grid of orientations (y every 15 degrees, x from -80 to 80 in
// 20 degree steps, z from -45 to 45 in 15 degree steps) at 1440x900 and 390x844, one PNG each. The
// page is loaded with ?hm-test, which holds the house still and hides the rest of the page.
const out = process.argv[2] ?? 'tmp-grid';
const step = Number(process.argv[3] ?? 1);
const base = process.argv[4] ?? process.env.BASE_URL ?? 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const [w, h] of [
  [390, 844],
  [1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/?hm-test`);
  await page.waitForFunction(() => window.__hm !== undefined, null, { timeout: 20000 });
  await page.waitForTimeout(600);
  let n = 0;
  for (let ry = 0; ry < 360; ry += 15) {
    for (let rx = -80; rx <= 80; rx += 20) {
      for (let rz = -45; rz <= 45; rz += 15) {
        if (n++ % step) continue;
        await page.evaluate(([a, b, c]) => window.__hm.setPose(a, b, c), [rx, ry, rz]);
        await page.screenshot({
          path: path.join(out, `${w}x${h}-rx${rx}-ry${ry}-rz${rz}.png`),
          type: 'png',
        });
      }
    }
  }
  await page.close();
}
await browser.close();
console.log('rendered', out);
