import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, MARK, markSvg } from '../src/components/Logo/markGeometry.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

/** The favicon: the mark on a transparent ground (it reads on light and dark browser tabs). */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}" width="64" height="64" role="img" aria-label="RC Constructions">${markSvg(BRAND)}</svg>
`;

/** The touch and app icons: the mark on white, with room around it. */
const iconMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-9 -9 82 82" width="100%" height="100%">
  <rect x="-9" y="-9" width="82" height="82" fill="#FFFFFF" />
  ${markSvg(BRAND)}
</svg>
`;

async function generateIcons() {
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
  console.log('Generated favicon.svg');

  const browser = await chromium.launch();
  const targets = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const { name, size } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${size}px; height: ${size}px; overflow: hidden; background: #FFFFFF; }
  </style>
</head>
<body>
  ${iconMarkup}
</body>
</html>`;

    await page.setContent(html);
    await page.screenshot({ path: path.join(publicDir, name), type: 'png' });
    console.log(`Generated ${name} (${size}x${size})`);
    await page.close();
  }

  await browser.close();
}

generateIcons().catch((err) => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
