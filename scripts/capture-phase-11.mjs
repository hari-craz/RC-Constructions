import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subDir = process.argv[2] || 'after';
const baseUrl = process.argv[3] || 'http://localhost:4173';
const only = process.argv[4];
const targetDir = path.resolve(__dirname, `../docs/review/phase-11/${subDir}`);
fs.mkdirSync(targetDir, { recursive: true });

const VIEWPORTS = [
  { name: '1904x1080', width: 1904, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '360x640', width: 360, height: 640 },
];

const STAGES = [
  ['01-survey', 'hero'],
  ['02-foundation', 'foundation'],
  ['03-structure', 'structure'],
  ['04-envelope', 'envelope'],
  ['05-fitout', 'fitout'],
  ['06-completion', 'completion'],
];
const EXTRA = [
  ['07-founder', 'founder'],
  ['08-contact', 'contact'],
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  if (only && !vp.name.startsWith(only)) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  for (const [name, id] of [...STAGES, ...EXTRA]) {
    await page.goto(`${baseUrl}/#${id}`);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(targetDir, `${vp.name}-${name}.png`) });
    const win = page.locator('.building-site-window');
    if (name < '07' && name > '01' && (await win.count())) {
      await win
        .screenshot({ path: path.join(targetDir, `${vp.name}-building-${name}.png`) })
        .catch(() => {});
    }
  }
  await ctx.close();
}
await browser.close();
console.log('captured', targetDir);
