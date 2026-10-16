/* Median-of-N Lighthouse on the production build. See docs/PERFORMANCE.md.
 * usage: node scripts/lh-median.mjs [mobile|desktop] [runs=5] [url=http://localhost:4173/] */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [preset = 'mobile', runs = '5', url = 'http://localhost:4173/'] = process.argv.slice(2);
fs.rmSync('.lighthouseci', { recursive: true, force: true });
const args = [
  'exec',
  'lhci',
  'collect',
  `--url=${url}`,
  `--numberOfRuns=${runs}`,
  '--settings.chromeFlags=--headless=new --no-sandbox',
];
if (preset === 'desktop') args.push('--settings.preset=desktop');
execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

const reports = fs
  .readdirSync('.lighthouseci')
  .filter((f) => /^lhr.*json$/.test(f))
  .map((f) => JSON.parse(fs.readFileSync(`.lighthouseci/${f}`, 'utf8')));
const median = (fn) => {
  const v = reports.map(fn).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const cat = (id) => Math.round(median((r) => r.categories[id].score * 100));
console.log(
  JSON.stringify({
    preset,
    runs: reports.length,
    performance: cat('performance'),
    accessibility: cat('accessibility'),
    bestPractices: cat('best-practices'),
    seo: cat('seo'),
    fcpMs: Math.round(median((r) => r.audits['first-contentful-paint'].numericValue)),
    lcpMs: Math.round(median((r) => r.audits['largest-contentful-paint'].numericValue)),
    tbtMs: Math.round(median((r) => r.audits['total-blocking-time'].numericValue)),
    cls: Number(median((r) => r.audits['cumulative-layout-shift'].numericValue).toFixed(3)),
    allPerformance: reports.map((r) => Math.round(r.categories.performance.score * 100)),
  }),
);
fs.rmSync('.lighthouseci', { recursive: true, force: true });
