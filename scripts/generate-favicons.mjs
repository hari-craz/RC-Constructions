import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="8" fill="#232622" />
  <path d="M16 16h14c6.6 0 11 3.8 11 9.5 0 4.2-2.4 7.2-6.2 8.7L42 48h-8.2l-6.2-12H23v12h-7V16zm7 15h6.5c3 0 5-1.6 5-4.5s-2-4.5-5-4.5H23v9z" fill="#E9E7DF" />
  <rect x="44" y="16" width="6" height="6" fill="#E3B341" />
</svg>
`;

async function generateIcons() {
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
    body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  </style>
</head>
<body>
  ${svgMarkup}
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
