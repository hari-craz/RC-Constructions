import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7C — Completion Stats and Founder Real Content', () => {
  test('renders Completion section with handover items and no invented figures', async ({
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

    const completion = page.locator('#completion');
    await completion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify Completion headings
    await expect(page.locator('#completion-heading')).toBeVisible();
    await expect(page.locator('#completion-heading')).toHaveText(/work delivered/i);

    // Four handover items; the figures band stays hidden until the company supplies figures
    await expect(completion.locator('.completion-handover-item')).toHaveCount(4);
    await expect(completion.locator('.completion-stat-cell')).toHaveCount(0);

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

    // No quote is shown until the founder supplies one
    await expect(founder.locator('.founder-quote')).toHaveCount(0);

    // Verify Bio
    const bioParagraphs = founder.locator('.founder-bio-p');
    await expect(bioParagraphs).toHaveCount(3);

    // Only known facts are listed
    const facts = founder.locator('.founder-fact-item');
    await expect(facts).toHaveCount(1);

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
