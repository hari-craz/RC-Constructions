import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subDir = process.argv[2] || 'after';
const targetDir = path.resolve(__dirname, `../docs/review/${subDir}`);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1080', width: 2560, height: 1080 },
];

const SECTIONS = [
  { id: 'hero', selector: '#hero' },
  { id: 'about', selector: '#about' },
  { id: 'services', selector: '#services' },
  { id: 'projects', selector: '#projects' },
  { id: 'process', selector: '#process' },
  { id: 'completion', selector: '#completion' },
  { id: 'founder', selector: '#founder' },
  { id: 'contact', selector: '#contact' },
];

const BUILDING_STAGES = [
  { name: '01-survey', hash: '#hero' },
  { name: '02-foundation', hash: '#about' },
  { name: '03-structure', hash: '#services' },
  { name: '04-envelope', hash: '#projects' },
  { name: '05-fitout', hash: '#process' },
  { name: '06-completion', hash: '#completion' },
];

async function capture() {
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    console.log(`Capturing viewport ${vp.name}...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    // 1. Capture Hero (settled after load)
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(targetDir, `${vp.name}-hero-settled.png`),
    });

    // 2. Capture each section (entering, settled)
    for (const sec of SECTIONS) {
      if (sec.id === 'hero') continue;
      const el = page.locator(sec.selector);
      if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(targetDir, `${vp.name}-${sec.id}-settled.png`),
        });
      }
    }

    // 3. Capture Project Detail Overlay at desktop & mobile
    if (vp.name === '1440x900' || vp.name === '360x640') {
      await page.goto('http://localhost:5173/#project-residential-block');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(targetDir, `${vp.name}-overlay-open.png`),
      });
    }

    await page.close();
  }

  // 4. Capture building stages at 1440x900
  const bPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  for (const stg of BUILDING_STAGES) {
    await bPage.goto(`http://localhost:5173/${stg.hash}`);
    await bPage.waitForTimeout(1000);
    const building = bPage.locator('.building-canvas-container');
    if (await building.count()) {
      await building.screenshot({
        path: path.join(targetDir, `building-${stg.name}.png`),
      });
    }
  }
  await bPage.close();

  await browser.close();
  console.log('Finished capturing all before screenshots in docs/review/before/');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
