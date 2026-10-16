import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import privacyHtml from '../../privacy.html?raw';
import termsHtml from '../../terms.html?raw';
import { fillPlaceholders } from '../lib/siteFiles';
import { COMPANY, SITE_URL } from './company';

const values = {
  SITE_URL,
  COMPANY_NAME: COMPANY.name,
  CONTACT_PHONE_RAW: COMPANY.contact.phoneRaw,
  CONTACT_PHONE_DISPLAY: COMPANY.contact.phoneDisplay,
  CONTACT_EMAIL: COMPANY.contact.email,
  LEGAL_TITLE: 'Title',
  YEAR: '2026',
};
const html = fillPlaceholders(indexHtml, values);

describe('SEO and structured data', () => {
  it('has valid JSON-LD GeneralContractor data that states no unverified facts', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(match?.[1] ?? '{}');
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('GeneralContractor');
    expect(data.name).toBe(COMPANY.name);
    expect(data.url).toBe(`${SITE_URL}/`);
    // Sample contact details must not be published as structured data
    expect(data.telephone).toBeUndefined();
    expect(data.address).toBeUndefined();
    expect(data.priceRange).toBeUndefined();
  });

  it('uses the single canonical site URL everywhere', () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/" />`);
    expect(html).toContain(`<meta property="og:url" content="${SITE_URL}/" />`);
    expect(html).toContain(`<meta property="og:image" content="${SITE_URL}/og-image.png" />`);
    expect(html).toContain(`<meta name="twitter:image" content="${SITE_URL}/og-image.png" />`);
    const hosts = [...html.matchAll(/https?:\/\/[^"'\s<)]+/g)].map((m) => m[0]);
    const foreign = hosts.filter(
      (u) => !u.startsWith(SITE_URL) && !u.includes('schema.org') && !u.includes('w3.org'),
    );
    expect(foreign).toEqual([]);
    expect(html).not.toMatch(/%[A-Z_]+%/);
  });

  it('declares essential meta tags, manifest and a noscript fallback', () => {
    expect(html).toContain('<meta property="og:type" content="website" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest" />');
    expect(html).toContain('<noscript>');
  });

  it('legal pages carry canonical links on the same site URL', () => {
    expect(fillPlaceholders(privacyHtml, values)).toContain(
      `<link rel="canonical" href="${SITE_URL}/privacy" />`,
    );
    expect(fillPlaceholders(termsHtml, values)).toContain(
      `<link rel="canonical" href="${SITE_URL}/terms" />`,
    );
  });
});
