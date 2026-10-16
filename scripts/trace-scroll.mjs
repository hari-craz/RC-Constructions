/* Traces the main thread around the first scroll and prints the heaviest events. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const url = process.env.BASE_URL || 'http://localhost:4173/';
const throttle = Number(process.env.CPU || 1);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
if (throttle > 1) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
}
await page.goto(url);
await page.waitForTimeout(2500);
await browser.startTracing(page, {
  path: 'trace-scroll.json',
  categories: ['devtools.timeline', 'v8.execute', 'disabled-by-default-devtools.timeline'],
});
await page.mouse.wheel(0, 300);
await page.waitForTimeout(2500);
await browser.stopTracing();
await browser.close();
const events = JSON.parse(fs.readFileSync('trace-scroll.json', 'utf8')).traceEvents;
const heavy = events
  .filter((e) => e.ph === 'X' && e.dur > 6000)
  .map((e) => ({
    name: e.name,
    ms: Math.round(e.dur / 1000),
    url: e.args?.data?.url?.split('/').pop() || e.args?.data?.functionName || '',
  }))
  .sort((a, b) => b.ms - a.ms)
  .slice(0, 30);
console.table(heavy);
fs.rmSync('trace-scroll.json');
