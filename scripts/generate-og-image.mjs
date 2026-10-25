/* global document */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, markSvg } from '../src/components/Logo/markGeometry.ts';

// The social card (1200 by 630): the company's mark in its own colours, the name and one plain line.
// Every fact on it comes from src/content/company.ts; fonts are the site's own (embedded).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const outputPath = path.join(publicDir, 'og-image.png');
const font = (pkg, file) =>
  fs
    .readFileSync(
      path.resolve(__dirname, `../node_modules/@fontsource-variable/${pkg}/files/${file}`),
    )
    .toString('base64');

// The facts on the card are read from the one source (the file is TypeScript that imports JSON, so it
// is read as text here)
const company = fs.readFileSync(path.resolve(__dirname, '../src/content/company.ts'), 'utf8');
const pick = (key) => company.match(new RegExp(key + ":\\s*'([^']*)'"))?.[1] ?? '';
const name = pick('name');
// "Tiruppur" is the last place name of the supplied address ("... Tiruppur - 638105")
const place = pick('address').split(',').pop()?.split('-')[0]?.trim() ?? '';

async function generateOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: 'Big Shoulders Display'; font-weight: 100 900; src: url(data:font/woff2;base64,${font('big-shoulders-display', 'big-shoulders-display-latin-wght-normal.woff2')}) format('woff2'); }
    @font-face { font-family: 'Newsreader'; font-weight: 200 800; src: url(data:font/woff2;base64,${font('newsreader', 'newsreader-latin-wght-normal.woff2')}) format('woff2'); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background-color: #E9E7DF;
      color: #232622;
      display: flex;
      align-items: center;
      gap: 72px;
      padding: 0 96px;
    }
    .mark { width: 340px; height: 340px; flex: none; }
    .text { display: flex; flex-direction: column; gap: 20px; width: 596px; }
    .title {
      font-family: 'Big Shoulders Display', sans-serif;
      font-size: 92px;
      font-weight: 800;
      line-height: 0.92;
      letter-spacing: 0.01em;
      text-transform: uppercase;
    }
    .line {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 38px;
      line-height: 1.25;
    }
    .dim { position: relative; height: 2px; width: 100%; background-color: #E3B341; margin-top: 12px; }
    .dim::before, .dim::after { content: ''; position: absolute; top: -8px; width: 2px; height: 18px; background-color: #E3B341; }
    .dim::before { left: 0; }
    .dim::after { right: 0; }
  </style>
</head>
<body>
  <svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markSvg(BRAND)}</svg>
  <div class="text">
    <h1 class="title">${name}</h1>
    <p class="line">General contractor${place ? ` in ${place}` : ''}. Houses, commercial premises, industrial sheds and civil works.</p>
    <div class="dim"></div>
  </div>
</body>
</html>`;

  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log(`Generated ${outputPath}`);
}

generateOgImage().catch((err) => {
  console.error('Failed to generate OG image:', err);
  process.exit(1);
});
