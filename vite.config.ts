/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { COMPANY, CONTACT_EMAIL, SITE_URL } from './src/content/company';
import { renderPrivacy, PRIVACY_TITLE } from './src/legal/privacy';
import { renderTerms, TERMS_TITLE } from './src/legal/terms';
import { staticBuildingSvg } from './src/lib/buildingStatic';
import { staticHouseSvg } from './src/lib/model3d/staticSvg';
import { fillPlaceholders, robotsTxt, securityTxt, sitemapXml } from './src/lib/siteFiles';

/** Preloads only the two latin font files used above the fold (headline and body). */
function preloadAboveTheFoldFonts(): Plugin {
  return {
    name: 'preload-above-the-fold-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((name) =>
          /(big-shoulders-display|newsreader)-latin-wght-normal-.*\.woff2$/.test(name),
        );
        return files.map((file) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
            href: `/${file}`,
          },
          injectTo: 'head' as const,
        }));
      },
    },
  };
}

/**
 * Builds everything that depends on the single site URL and on company facts: placeholder
 * substitution in the HTML pages, the legal page bodies, robots.txt, sitemap.xml and security.txt.
 */
function siteFiles(): Plugin {
  const legal: Record<string, { title: string; body: () => string }> = {
    'privacy.html': { title: PRIVACY_TITLE, body: renderPrivacy },
    'terms.html': { title: TERMS_TITLE, body: renderTerms },
  };
  return {
    name: 'site-files',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = legal[path.basename(ctx.filename)];
        const withBody = page ? html.replace('<!--LEGAL_BODY-->', page.body()) : html;
        return fillPlaceholders(withBody, {
          SITE_URL,
          COMPANY_NAME: COMPANY.name,
          CONTACT_PHONE_RAW: COMPANY.contact.phoneRaw,
          CONTACT_PHONE_DISPLAY: COMPANY.contact.phoneDisplay,
          CONTACT_EMAIL,
          LEGAL_TITLE: page?.title ?? '',
          YEAR: String(new Date().getFullYear()),
          // The no-JS fallback: the house at its three-quarter rest angle, drawn at build time
          HERO_MODEL_SVG: staticHouseSvg(),
          // ...and the finished building after it, so the page tells the same story without scripts
          BUILDING_SVG: staticBuildingSvg(COMPANY.name),
        });
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(SITE_URL) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(SITE_URL) });
      this.emitFile({
        type: 'asset',
        fileName: '.well-known/security.txt',
        source: securityTxt({ email: CONTACT_EMAIL, siteUrl: SITE_URL, now: new Date() }),
      });
    },
  };
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Multi-page site (index, privacy, terms): unknown paths are 404s, not an SPA fallback
  appType: 'mpa',
  plugins: [react(), siteFiles(), preloadAboveTheFoldFonts()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  build: {
    sourcemap: process.env.SOURCE_MAP === 'true',
    rollupOptions: {
      input: {
        main: path.resolve(dirname, 'index.html'),
        privacy: path.resolve(dirname, 'privacy.html'),
        terms: path.resolve(dirname, 'terms.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
