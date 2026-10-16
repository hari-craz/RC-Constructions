import { describe, expect, it } from 'vitest';
import nginx from '../../nginx.conf?raw';
import vercelRaw from '../../vercel.json?raw';
import { SITE_URL } from '../content/company';

const vercel = JSON.parse(vercelRaw) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const global = vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? [];

describe('single canonical site URL and header config', () => {
  it('is an https origin without a trailing slash', () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });

  it('vercel.json allows only the site origin for CORS, never a wildcard', () => {
    const cors = global.find((h) => h.key === 'Access-Control-Allow-Origin');
    expect(cors?.value).toBe(SITE_URL);
    expect(JSON.stringify(vercel)).not.toMatch(/Allow-Origin","value":"\*"/);
  });

  it('nginx.conf sends no CORS header', () => {
    expect(nginx).not.toMatch(/Access-Control-Allow-Origin/i);
  });

  it('HSTS has no preload until the final domain is ready (both configs)', () => {
    const hsts = global.find((h) => h.key === 'Strict-Transport-Security')?.value ?? '';
    expect(hsts).toMatch(/max-age=\d+/);
    expect(hsts).not.toContain('preload');
    expect(nginx).not.toMatch(/Strict-Transport-Security[^\n]*preload/);
  });

  it('serves security.txt as text/plain on both hosts', () => {
    const rule = vercel.headers.find((h) => h.source === '/.well-known/security.txt');
    expect(rule?.headers.find((h) => h.key === 'Content-Type')?.value).toBe(
      'text/plain; charset=utf-8',
    );
    expect(nginx).toMatch(
      /location = \/\.well-known\/security\.txt[\s\S]*default_type text\/plain;[\s\S]*charset utf-8;/,
    );
  });
});
