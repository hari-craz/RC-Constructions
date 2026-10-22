import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// usage: node scripts/record-model-drag.mjs <out-dir> [base-url]
// Records a 10 second drag of the hero house at 1440x900 and 390x844 (webm): sweeps across the poles,
// slow turns, and the Roll and Reset buttons, so flips and jumps show up.
const out = process.argv[2] ?? 'tmp-drag';
const base = process.argv[3] ?? process.env.BASE_URL ?? 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  const dir = path.join(out, `tmp-${w}`);
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    recordVideo: { dir, size: { width: w > 800 ? 720 : 390, height: w > 800 ? 450 : 844 } },
  });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await page.locator('.hero-model-widget').waitFor();
  await page.waitForTimeout(4800);
  const stage = await page.locator('.hero-model-stage').boundingBox();
  const cx = (stage?.x ?? 0) + (stage?.width ?? w) / 2;
  const cy = (stage?.y ?? 0) + (stage?.height ?? h) / 2;
  const started = Date.now();
  const drag = async (points) => {
    await page.mouse.move(points[0][0], points[0][1]);
    await page.mouse.down();
    for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 6 });
    await page.mouse.up();
  };
  // Left and right across the house, then over the top and under, then a loop with a roll
  await drag([
    [cx - 150, cy],
    [cx + 150, cy],
    [cx - 150, cy],
  ]);
  await drag([
    [cx, cy - 200],
    [cx, cy + 200],
    [cx, cy - 200],
  ]);
  await drag([
    [cx - 120, cy - 120],
    [cx + 120, cy - 120],
    [cx + 120, cy + 120],
    [cx - 120, cy + 120],
    [cx - 120, cy - 120],
  ]);
  for (const name of [
    'Roll left',
    'Roll left',
    'Roll right',
    'Tilt up',
    'Tilt up',
    'Tilt up',
    'Tilt up',
    'Tilt up',
    'Tilt up',
    'Reset view',
  ]) {
    await page.getByRole('button', { name }).click();
    await page.waitForTimeout(260);
  }
  await drag([
    [cx - 100, cy + 150],
    [cx + 100, cy - 150],
  ]);
  const left = 10_000 - (Date.now() - started);
  if (left > 0) await page.waitForTimeout(left);
  await context.close();
  const file = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  if (file) fs.renameSync(path.join(dir, file), path.join(out, `drag-${w}x${h}.webm`));
  fs.rmSync(dir, { recursive: true, force: true });
}
await browser.close();
console.log('recorded', out);
