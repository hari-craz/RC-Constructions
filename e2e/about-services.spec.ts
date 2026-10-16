import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7A — About and Services Real Content', () => {
  test('renders About section with plain contractor copy and working principles', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/#about');
    await page.waitForTimeout(1000);

    // Verify About headline and paragraphs
    const headline = page.getByRole('heading', { level: 2, name: /we work from the ground up/i });
    await expect(headline).toBeVisible();

    const founderCopy = page.getByText(/general contracting company/i);
    await expect(founderCopy).toBeVisible();

    // Verify 3 principles are present
    const principlesList = page.locator('.about-principles-list');
    await expect(principlesList).toBeVisible();
    const principleItems = page.locator('.about-principle-item');
    await expect(principleItems).toHaveCount(3);

    // Verify no console errors
    expect(consoleErrors).toEqual([]);
  });

  test('renders Services as drawing schedule table with 8 keyboard-focusable rows', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/#structure');
    await page.waitForTimeout(1000);

    // Verify Services title
    const servicesTitle = page.getByRole('heading', {
      level: 2,
      name: /services & construction schedule/i,
    });
    await expect(servicesTitle).toBeVisible();

    // Verify drawing schedule table
    const table = page.locator('.services-table');
    await expect(table).toBeVisible();

    const rows = page.locator('.services-row');
    await expect(rows).toHaveCount(8);

    // Verify first row and last row content
    await expect(rows.first()).toContainText('01');
    await expect(rows.first()).toContainText('Residential');

    await expect(rows.last()).toContainText('08');
    await expect(rows.last()).toContainText('Project Management & Turnkey Delivery');

    // Verify keyboard focusability on rows
    await rows.first().focus();
    await expect(rows.first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(rows.nth(1)).toBeFocused();

    expect(consoleErrors).toEqual([]);
  });

  test('passes axe accessibility audit at About and Services sections', async ({ page }) => {
    await page.goto('/#about');
    await page.waitForTimeout(1000);

    const aboutAxe = await new AxeBuilder({ page }).analyze();
    expect(aboutAxe.violations).toEqual([]);

    await page.goto('/#structure');
    await page.waitForTimeout(1000);

    const servicesAxe = await new AxeBuilder({ page }).analyze();
    expect(servicesAxe.violations).toEqual([]);
  });
});
