import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';

describe('SEO & Structured Data (Phase 9)', () => {
  it('includes valid JSON-LD GeneralContractor structured data in index.html', () => {
    const jsonLdMatch = indexHtml.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(jsonLdMatch).toBeTruthy();
    const jsonContent = jsonLdMatch?.[1];
    expect(jsonContent).toBeDefined();
    const data = JSON.parse(jsonContent ?? '{}');

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('GeneralContractor');
    expect(data.name).toBe('RC Constructions');
    expect(data.url).toBe('https://rcconstructions.com/');
    expect(data.telephone).toBe('+914428470000');
    expect(data.address).toBeDefined();
    expect(data.address['@type']).toBe('PostalAddress');
    expect(data.address.addressLocality).toBe('Chennai');
    expect(data.areaServed).toBe('Regional Industrial & Urban Corridor');
  });

  it('declares essential meta tags, open graph tags, canonical link, and manifest in index.html', () => {
    expect(indexHtml).toContain('<link rel="canonical" href="https://rcconstructions.com/" />');
    expect(indexHtml).toContain('<meta property="og:type" content="website" />');
    expect(indexHtml).toContain(
      '<meta property="og:image" content="https://rcconstructions.com/og-image.png" />',
    );
    expect(indexHtml).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(indexHtml).toContain('<link rel="manifest" href="/site.webmanifest" />');
    expect(indexHtml).toContain(
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    );
    expect(indexHtml).toContain('<noscript>');
  });
});
