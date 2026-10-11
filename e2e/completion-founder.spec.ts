import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7C — Completion Stats and Founder Real Content', () => {
  test('renders Completion section with 4 stats and final figures in DOM', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const completion = page.locator('#completion');
    await completion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify Completion headings
    await expect(page.locator('#completion-title')).toBeVisible();
    await expect(page.locator('#completion-title')).toHaveText(
      /commissioned delivery & site records/i,
    );

    // Verify 4 stat figures are present with final values in DOM
    const statCells = completion.locator('.completion-stat-cell');
    await expect(statCells).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const cell = statCells.nth(i);
      const figure = cell.locator('.completion-stat-figure');
      await expect(figure).toBeVisible();
      // Final values must be in DOM from the start
      await expect(figure).toContainText('XX');
      const caption = cell.locator('.completion-stat-caption');
      await expect(caption).toBeVisible();
      const text = await caption.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('renders Founder monograph section with editorial layout and reserved portrait slot', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const founder = page.locator('#founder');
    await founder.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify Founder name and role
    const nameHeading = founder.locator('.founder-name');
    await expect(nameHeading).toBeVisible();
    await expect(nameHeading).toHaveText('Gokul');

    const role = founder.locator('.founder-role');
    await expect(role).toBeVisible();
    await expect(role).toHaveText('Founder');

    // Verify Pull quote
    const quote = founder.locator('.founder-quote');
    await expect(quote).toBeVisible();
    await expect(quote).toContainText('A building is only as reliable');

    // Verify Bio
    const bioParagraphs = founder.locator('.founder-bio-p');
    await expect(bioParagraphs).toHaveCount(3);

    // Verify 3 ruled facts
    const facts = founder.locator('.founder-fact-item');
    await expect(facts).toHaveCount(3);

    // Verify Reserved Portrait Slot
    const portraitSlot = founder.locator('[data-portrait-slot="founder"]');
    await expect(portraitSlot).toBeVisible();

    const img = portraitSlot.locator('img');
    await expect(img).toHaveAttribute('alt', 'Portrait of Gokul, founder of RC Constructions');
    await expect(img).toHaveAttribute('width', '1200');
    await expect(img).toHaveAttribute('height', '1500');

    const placeholderText = portraitSlot.locator('.founder-portrait-placeholder');
    await expect(placeholderText).toContainText('PLACEHOLDER');

    expect(consoleErrors).toEqual([]);
  });

  test('nav jump and hash spy correctly target completion and founder', async ({ page }) => {
    await page.goto('/#completion');
    await page.waitForTimeout(1000);

    const completion = page.locator('#completion');
    await expect(completion).toBeInViewport();
    expect(page.url()).toContain('#completion');

    // Scroll to Founder and check hash update
    const founder = page.locator('#founder');
    await founder.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await expect(founder).toBeInViewport();
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#founder');
  });

  test('passes axe accessibility audit at Completion and Founder sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1200);

    // Scroll to Completion
    const completion = page.locator('#completion');
    await completion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const completionAxe = await new AxeBuilder({ page }).analyze();
    expect(completionAxe.violations).toEqual([]);

    // Scroll to Founder
    const founder = page.locator('#founder');
    await founder.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const founderAxe = await new AxeBuilder({ page }).analyze();
    expect(founderAxe.violations).toEqual([]);
  });
});
