import { chromium } from '@playwright/test';

// Mean cost of one model update (maths and DOM writes) while the house auto-rotates, at a CPU slowdown
const base = process.argv[2] ?? 'http://localhost:4173';
const rate = Number(process.argv[3] ?? 4);
const browser = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [390, 844],
  [768, 1024],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`${base}/`);
  await page.locator('.hero-model-widget').waitFor();
  await page.waitForTimeout(5400);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const samples = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1100);
    const d = await page
      .locator('.hero-model-widget')
      .evaluate((e) => [e.dataset.frameMs, e.dataset.auto]);
    if (d[1] === 'true') samples.push(Number(d[0]));
  }
  samples.sort((a, b) => a - b);
  console.log(
    `${w}x${h} x${rate}: median ${samples[Math.floor(samples.length / 2)]} ms, range ${samples[0]}-${samples[samples.length - 1]} (${samples.length} samples)`,
  );
  await page.close();
}
await browser.close();
