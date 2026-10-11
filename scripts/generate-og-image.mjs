import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const outputPath = path.join(publicDir, 'og-image.png');

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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background-color: #C4C4BC;
      color: #232622;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 2px solid #7A7E78;
      padding-bottom: 24px;
    }
    .kicker {
      font-family: monospace;
      font-size: 18px;
      letter-spacing: 0.16em;
      color: #232622;
      font-weight: 700;
    }
    .spec-code {
      font-family: monospace;
      font-size: 16px;
      color: #7A7E78;
      letter-spacing: 0.1em;
    }
    .center-content {
      margin-top: 40px;
    }
    .title {
      font-size: 96px;
      font-weight: 900;
      line-height: 0.9;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: #232622;
    }
    .tagline {
      margin-top: 24px;
      font-size: 28px;
      line-height: 1.3;
      color: #232622;
      font-style: italic;
      font-family: Georgia, serif;
      max-width: 820px;
    }
    .footer-dimension {
      position: relative;
      padding-top: 32px;
    }
    .dim-line {
      position: relative;
      height: 2px;
      background-color: #E3B341;
      width: 100%;
    }
    .tick-start, .tick-end {
      position: absolute;
      top: -8px;
      width: 2px;
      height: 18px;
      background-color: #E3B341;
    }
    .tick-start { left: 0; }
    .tick-end { right: 0; }
    .dim-label {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #232622;
      color: #E3B341;
      padding: 4px 14px;
      font-size: 14px;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.1em;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      font-family: monospace;
      font-size: 14px;
      color: #7A7E78;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="kicker">RC CONSTRUCTIONS // DRAWING REGISTRATION</span>
    <span class="spec-code">FOLIO 20XX-OG</span>
  </div>
  <div class="center-content">
    <h1 class="title">RC CONSTRUCTIONS</h1>
    <p class="tagline">Architectural General Contracting & Structural Engineering.</p>
  </div>
  <div class="footer-dimension">
    <div class="dim-line">
      <span class="tick-start"></span>
      <span class="dim-label">SURVEY DATUM 1200 &times; 630 // AMBER SCALE</span>
      <span class="tick-end"></span>
    </div>
    <div class="meta-row">
      <span>REF: CHENNAI INDUSTRIAL CORRIDOR</span>
      <span>GENERAL CONTRACTOR SPECIFICATION</span>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(html);
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log(`Generated OG image at ${outputPath}`);
}

generateOgImage().catch((err) => {
  console.error('Failed to generate OG image:', err);
  process.exit(1);
});
