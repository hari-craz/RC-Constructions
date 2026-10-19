import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/capture-hero-model.mjs <out-dir>
// The hero house at four widths at rest, and at six angles on desktop and phone.
const out = process.argv[2] ?? 'docs/review/phase-14c/after';
const base = process.env.BASE_URL || 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const SIZES = [
  [1904, 1080],
  [1440, 900],
  [768, 1024],
  [390, 844],
];
// Each pose is a list of button names to press from the rest angle
const POSES = {
  '1-rest': [],
  '2-front': ['Turn right', 'Turn right'],
  '3-right-side': ['Turn right', 'Turn right', 'Turn right', 'Turn right'],
  '4-back': [
    'Turn right',
    'Turn right',
    'Turn right',
    'Turn right',
    'Turn right',
    'Turn right',
    'Turn right',
    'Turn right',
  ],
  '5-from-above': ['Tilt up', 'Tilt up', 'Tilt up', 'Tilt up'],
  '6-below-and-rolled': [
    'Tilt down',
    'Tilt down',
    'Tilt down',
    'Tilt down',
    'Roll left',
    'Roll left',
  ],
};

const browser = await chromium.launch();
for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/`);
  await page.locator('.hero-model-widget').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `${w}x${h}-01-hero.png`) });
  if (w === 1440 || w === 390) {
    const toggle = page.getByRole('switch', { name: 'Auto-rotate' });
    if ((await toggle.getAttribute('aria-checked')) === 'true') await toggle.click();
    for (const [name, presses] of Object.entries(POSES)) {
      await page.getByRole('button', { name: 'Reset view' }).click();
      await page.waitForTimeout(350);
      for (const label of presses) {
        await page.getByRole('button', { name: label }).click();
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(out, `${w}x${h}-model-${name}.png`) });
    }
  }
  await page.close();
}
await browser.close();
console.log('captured', out);
