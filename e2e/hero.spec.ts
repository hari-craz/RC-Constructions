import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 4 — Pinned Hero & 3D house', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders hero headline, tagline, and CTA button with zero axe violations', async ({
    page,
  }) => {
    // Check main headline
    const headline = page.locator('.hero-headline');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText('RC');
    await expect(headline).toContainText('Constructions');

    // Check tagline and CTA button
    const tagline = page.locator('.hero-tagline');
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveText('We build homes, offices, factories and roads.');

    const cta = page.getByRole('link', { name: 'Request a quote' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '#contact');

    // Axe audit on Hero
    const scanResults = await new AxeBuilder({ page }).analyze();
    expect(scanResults.violations).toEqual([]);
  });

  test('renders the 3D house model with its dimension callouts (Phase 14C replaced the survey plot)', async ({
    page,
  }) => {
    const widget = page.locator('.hero-model-widget');
    await expect(widget).toBeAttached();
    await expect(page.locator('.hm-svg').first()).toBeAttached();
    // Overall width dimension label
    await expect(page.locator('.hm-dim-label text', { hasText: '14.8 m' })).toBeAttached();
  });

  test('nav bar switches tone when scrolling from hero to about', async ({ page }, testInfo) => {
    // Only test live tone change on non-reduced-motion desktop Chrome
    if (testInfo.project.use?.contextOptions?.reducedMotion === 'reduce') {
      test.skip();
    }

    const nav = page.locator('.nav-bar');
    // Initially on hero (concrete sheet): dark ink
    await expect(nav).toHaveAttribute('data-tone', 'concrete');

    // Scroll down to #about section (formwork-dark sheet)
    const about = page.locator('#foundation');
    await about.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Nav should switch to light ink over dark sheet
    await expect(nav).toHaveAttribute('data-tone', 'light');
    await expect(nav).toHaveAttribute('data-window', 'on');
  });
});
