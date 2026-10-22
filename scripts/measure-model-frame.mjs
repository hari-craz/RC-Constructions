import { chromium } from '@playwright/test';

// usage: node scripts/measure-model-frame.mjs [base-url] [cpu-slowdown=4]
// Cost of one model update (maths and DOM writes) at a CPU slowdown, while the house auto-rotates and
// while it is dragged (on a phone both are the "turning" mode that drops the hairlines). The widget
// publishes the mean per second (data-frame-ms) and the slowest frame of that second
// (data-frame-ms-max; absent in builds before Phase 14E). Prints the median of the per-second means
// and the largest peak.
const base = process.argv[2] ?? 'http://localhost:4173';
const rate = Number(process.argv[3] ?? 4);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const browser = await chromium.launch();
for (const [w, h] of [
  [1440, 900],
  [390, 844],
  [768, 1024],
]) {
  for (const mode of ['auto-rotate', 'drag']) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const cdp = await page.context().newCDPSession(page);
    await page.goto(`${base}/`);
    await page.locator('.hero-model-widget').waitFor();
    await page.waitForTimeout(5400);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const widget = page.locator('.hero-model-widget');
    let box = null;
    if (mode === 'drag') {
      await page.getByRole('switch', { name: 'Auto-rotate' }).click();
      box = await page.locator('.hero-model-stage').boundingBox();
      await page.mouse.move(
        (box?.x ?? 0) + (box?.width ?? 0) / 2,
        (box?.y ?? 0) + (box?.height ?? 0) / 2,
      );
      await page.mouse.down();
    }
    const means = [];
    const peaks = [];
    for (let i = 0; i < 8; i++) {
      if (mode === 'drag') {
        const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
        const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
        for (let k = 0; k < 40; k++) {
          const t = (i * 40 + k) / 9;
          await page.mouse.move(cx + Math.cos(t) * 90, cy + Math.sin(t) * 60);
          await page.waitForTimeout(25);
        }
      } else await page.waitForTimeout(1100);
      const d = await widget.evaluate((e) => [e.dataset.frameMs, e.dataset.frameMsMax]);
      if (d[0] !== undefined && Number(d[0]) > 0) {
        means.push(Number(d[0]));
        if (d[1] !== undefined) peaks.push(Number(d[1]));
      }
    }
    if (mode === 'drag') await page.mouse.up();
    console.log(
      `${w}x${h} x${rate} ${mode}: median ${median(means)} ms, peak ${peaks.length ? Math.max(...peaks) : 'n/a'} ms (${means.length} samples)`,
    );
    await page.close();
  }
}
await browser.close();
