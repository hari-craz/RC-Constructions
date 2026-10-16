import { describe, expect, it } from 'vitest';
import {
  fillPlaceholders,
  parseSecurityTxtExpires,
  robotsTxt,
  securityTxt,
  sitemapXml,
} from './siteFiles';

const URL = 'https://example.test';

describe('generated site files', () => {
  it('robots.txt points at the sitemap on the site URL', () => {
    expect(robotsTxt(URL)).toContain(`Sitemap: ${URL}/sitemap.xml`);
  });

  it('sitemap lists the home page, privacy and terms on the site URL', () => {
    const xml = sitemapXml(URL);
    expect(xml).toContain(`<loc>${URL}/</loc>`);
    expect(xml).toContain(`<loc>${URL}/privacy</loc>`);
    expect(xml).toContain(`<loc>${URL}/terms</loc>`);
    expect(xml).not.toContain('rcconstructions.com');
  });

  it('security.txt follows RFC 9116 and expires under one year ahead', () => {
    const now = new Date('2026-10-16T00:00:00Z');
    const text = securityTxt({ email: 'sec@example.test', siteUrl: URL, now });
    expect(text).toMatch(/^Contact: mailto:sec@example\.test$/m);
    expect(text).toMatch(/^Preferred-Languages: en$/m);
    expect(text).toContain(`Canonical: ${URL}/.well-known/security.txt`);
    const expires = parseSecurityTxtExpires(text);
    expect(expires).not.toBeNull();
    const days = ((expires as Date).getTime() - now.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(300);
    expect(days).toBeLessThan(365);
  });

  it('fills placeholders and leaves unknown tokens visible', () => {
    expect(fillPlaceholders('%A% and %B%', { A: 'x' })).toBe('x and %B%');
  });
});
