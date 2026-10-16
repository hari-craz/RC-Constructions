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
    await expect(page.locator('#completion-heading')).toBeVisible();
    await expect(page.locator('#completion-heading')).toHaveText(
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
      await expect(figure).toHaveText(/\d+/);
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

    // No photo is committed yet, so the slot is a quiet block with one sentence and no <img>
    await expect(portraitSlot.locator('img')).toHaveCount(0);
    await expect(portraitSlot.locator('.founder-portrait-note')).toHaveText(
      'Photo to come, 1200 by 1500',
    );

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

    // Direct navigation to Completion
    await page.goto('/#completion');
    await page.waitForTimeout(1000);

    const completionAxe = await new AxeBuilder({ page }).analyze();
    expect(completionAxe.violations).toEqual([]);

    // Direct navigation to Founder
    await page.goto('/#founder');
    await page.waitForTimeout(1000);

    const founderAxe = await new AxeBuilder({ page }).analyze();
    expect(founderAxe.violations).toEqual([]);
  });
});
