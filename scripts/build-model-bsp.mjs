// Builds the hero house's BSP from its source geometry (src/lib/model3d/house.ts) and writes it to
// src/lib/model3d/house.bsp.json. Node built-ins only; Node strips the TypeScript types itself.
//   node scripts/build-model-bsp.mjs           write the file
//   node scripts/build-model-bsp.mjs --check   fail if the file differs from a fresh build
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBsp } from '../src/lib/model3d/bsp.ts';

const target = fileURLToPath(new URL('../src/lib/model3d/house.bsp.json', import.meta.url));
const json = `${JSON.stringify(buildBsp())}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current !== json) {
    console.error('house.bsp.json is out of date. Run: pnpm model:bsp');
    process.exit(1);
  }
  console.log('house.bsp.json is up to date');
} else {
  fs.writeFileSync(target, json);
  const { stats } = JSON.parse(json).meta;
  console.log(
    `wrote house.bsp.json (${(json.length / 1024).toFixed(1)} kB)`,
    JSON.stringify(stats),
  );
}
