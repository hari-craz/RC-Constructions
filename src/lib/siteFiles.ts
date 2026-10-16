/** Pure builders for the files generated at build time from the single site URL (src/config/site.json). */

const SECURITY_TXT_VALID_DAYS = 330;
const PUBLIC_PATHS = ['/', '/privacy', '/terms'] as const;

export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

export function sitemapXml(siteUrl: string, paths: readonly string[] = PUBLIC_PATHS): string {
  const urls = paths
    .map((path) => {
      const priority = path === '/' ? '1.0' : '0.3';
      return `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** RFC 9116 security.txt. `Expires` is under one year ahead and regenerated on every build. */
export function securityTxt(options: { email: string; siteUrl: string; now: Date }): string {
  const expires = new Date(options.now.getTime() + SECURITY_TXT_VALID_DAYS * 86_400_000);
  return [
    `Contact: mailto:${options.email}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${options.siteUrl}/.well-known/security.txt`,
    '',
  ].join('\n');
}

export function parseSecurityTxtExpires(text: string): Date | null {
  const match = /^Expires:\s*(.+)$/m.exec(text);
  if (!match?.[1]) return null;
  const date = new Date(match[1].trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Replaces %NAME% tokens in an HTML template (SITE_URL, COMPANY_NAME, contact fields, YEAR, ...). */
export function fillPlaceholders(html: string, values: Record<string, string>): string {
  return html.replace(/%([A-Z_]+)%/g, (token, key: string) => values[key] ?? token);
}
