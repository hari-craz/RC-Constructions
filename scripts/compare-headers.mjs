import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const vercelPath = path.join(rootDir, 'vercel.json');
const nginxPath = path.join(rootDir, 'nginx.conf');

const vercelContent = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
const nginxContent = fs.readFileSync(nginxPath, 'utf8');

// Required security headers that must exist and match
const requiredHeaders = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
];

const vercelGeneralHeaders = vercelContent.headers.find((entry) => entry.source === '/(.*)');
if (!vercelGeneralHeaders) {
  console.error('Error: vercel.json missing global source "/(.*)" headers block');
  process.exit(1);
}

const vercelHeaderMap = new Map();
for (const h of vercelGeneralHeaders.headers) {
  vercelHeaderMap.set(h.key.toLowerCase(), h.value);
}

// Extract headers from nginx.conf
const nginxHeaderRegex = /add_header\s+([\w-]+)\s+"([^"]+)"/g;
const nginxHeaderMap = new Map();
let match;
while ((match = nginxHeaderRegex.exec(nginxContent)) !== null) {
  const [, key, val] = match;
  if (!nginxHeaderMap.has(key.toLowerCase())) {
    nginxHeaderMap.set(key.toLowerCase(), val);
  }
}

let hasError = false;

for (const header of requiredHeaders) {
  const lowerKey = header.toLowerCase();
  const vercelVal = vercelHeaderMap.get(lowerKey);
  const nginxVal = nginxHeaderMap.get(lowerKey);

  if (!vercelVal) {
    console.error(`Missing header in vercel.json: ${header}`);
    hasError = true;
    continue;
  }
  if (!nginxVal) {
    console.error(`Missing header in nginx.conf: ${header}`);
    hasError = true;
    continue;
  }

  if (vercelVal !== nginxVal) {
    console.error(`Header mismatch for ${header}:`);
    console.error(`  vercel.json: ${vercelVal}`);
    console.error(`  nginx.conf:  ${nginxVal}`);
    hasError = true;
  }
}

// Check cache header for assets
const vercelAssetHeaders = vercelContent.headers.find((entry) => entry.source === '/assets/(.*)');
const vercelAssetCache = vercelAssetHeaders?.headers.find(
  (h) => h.key.toLowerCase() === 'cache-control',
)?.value;
const nginxAssetCache = /add_header\s+Cache-Control\s+"([^"]+)"/.exec(nginxContent)?.[1];

if (vercelAssetCache !== nginxAssetCache) {
  console.error('Asset Cache-Control mismatch:');
  console.error(`  vercel.json: ${vercelAssetCache}`);
  console.error(`  nginx.conf:  ${nginxAssetCache}`);
  hasError = true;
}

if (hasError) {
  console.error('❌ Header verification failed between vercel.json and nginx.conf');
  process.exit(1);
}

console.log('✅ Headers match between vercel.json and nginx.conf');
