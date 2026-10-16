/* CI guard: dist/.well-known/security.txt must exist and expire at least 30 days from now. */
import fs from 'node:fs';

const file = process.argv[2] || 'dist/.well-known/security.txt';
if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`);
  process.exit(1);
}
const text = fs.readFileSync(file, 'utf8');
const expires = /^Expires:\s*(.+)$/m.exec(text)?.[1];
const days = expires ? (new Date(expires).getTime() - Date.now()) / 86_400_000 : NaN;
const problems = [];
if (!/^Contact: .+/m.test(text)) problems.push('missing Contact');
if (!/^Canonical: https:\/\/.+/m.test(text)) problems.push('missing Canonical');
if (!(days > 30)) problems.push(`Expires too soon or invalid: ${expires}`);
if (!(days < 366)) problems.push(`Expires more than a year ahead: ${expires}`);
if (problems.length) {
  console.error(`security.txt check failed: ${problems.join('; ')}`);
  process.exit(1);
}
console.log(`security.txt OK (expires ${expires}, ${Math.round(days)} days ahead)`);
