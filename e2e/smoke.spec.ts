import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Smoke and Accessibility', () => {
  test('loads the placeholder page and passes axe accessibility check', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('RC Constructions');

    const scanResults = await new AxeBuilder({ page }).analyze();
    expect(scanResults.violations).toEqual([]);
  });
});
