/* global window, document */
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// usage: node scripts/capture.mjs <phase-dir> <before|after> [chromium|webkit|firefox] [viewport-prefix]
const [phase = 'phase-12', which = 'after', engine = 'chromium', only] = process.argv.slice(2);
const base = process.env.BASE_URL || 'http://localhost:4173';
const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../docs/review/${phase}/${which}`,
);
fs.mkdirSync(dir, { recursive: true });

const ALL = [
  { name: '2560x1080', width: 2560, height: 1080 },
  { name: '1904x1080', width: 1904, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '360x640', width: 360, height: 640 },
];
const VPS =
  engine === 'webkit'
    ? ALL.filter((v) => v.name === '390x844')
    : ALL.filter((v) => v.name !== '390x844');
const STAGES = [
  ['01-survey', 'hero'],
  ['02-foundation', 'foundation'],
  ['03-structure', 'structure'],
  ['04-envelope', 'envelope'],
  ['05-fitout', 'fitout'],
  ['06-completion', 'completion'],
  ['07-founder', 'founder'],
  ['08-contact', 'contact'],
];
const TRANSITIONS = [
  ['hero', 'foundation'],
  ['foundation', 'structure'],
  ['structure', 'envelope'],
  ['fitout', 'completion'],
  ['completion', 'founder'],
  ['founder', 'contact'],
];

const launcher = { chromium, webkit, firefox }[engine];
const browser = await launcher.launch();
for (const vp of VPS) {
  if (only && !vp.name.startsWith(only)) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const prefix = engine === 'chromium' ? vp.name : `${engine}-${vp.name}`;
  for (const [name, id] of STAGES) {
    await page.goto('about:blank');
    await page.goto(`${base}/#${id}`);
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(dir, `${prefix}-${name}.png`) });
    const win = page.locator('.building-site-window');
    if (name > '01' && name < '07' && (await win.count())) {
      await win
        .screenshot({ path: path.join(dir, `${prefix}-building-${name}.png`) })
        .catch(() => {});
    }
  }
  // project overlay
  await page.goto('about:blank');
  await page.goto(`${base}/#project-residential-enclave`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(dir, `${prefix}-overlay.png`) });
  // mid transitions
  await page.goto('about:blank');
  await page.goto(`${base}/`);
  await page.waitForTimeout(2200);
  for (const [a, b] of TRANSITIONS) {
    for (const frac of [0.8, 0.5, 0.2]) {
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
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(dir, `${prefix}-transition-${a}-${b}-${Math.round(frac * 100)}.png`),
      });
    }
  }
  await ctx.close();
}
await browser.close();
console.log('captured', dir);
