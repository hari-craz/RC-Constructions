import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7B — Projects and Process Real Content', () => {
  test('renders Projects register with 6 rows and marks the active row without layout shift', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/#envelope');
    await page.waitForTimeout(1000);

    // Verify Projects title
    const title = page.getByRole('heading', { level: 2, name: /^selected projects$/i });
    await expect(title).toBeVisible();

    // Verify six project rows
    const rows = page.locator('.projects-row-item');
    await expect(rows).toHaveCount(6);

    // Phase 14: no row is active until one is hovered, focused or tapped (the window shows the
    // finished building); this replaces the old "first project active by default" behaviour
    await expect(page.locator('.projects-row-btn[aria-current="true"]')).toHaveCount(0);
    const initialBoxes = await rows.evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height),
    );

    // Focus row 2 via keyboard
    const row2Btn = rows.nth(1).locator('.projects-row-btn');
    await row2Btn.focus();
    await expect(row2Btn).toBeFocused();
    await expect(rows.nth(1)).toHaveClass(/is-active/);
    await expect(row2Btn).toHaveAttribute('aria-current', 'true');

    // Marking a row never changes any row height
    const updatedBoxes = await rows.evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height),
    );
    expect(updatedBoxes).toEqual(initialBoxes);

    // Check click / tap activation on row 3 (opens the drawer, the row stays marked)
    const row3Btn = rows.nth(2).locator('.projects-row-btn');
    await row3Btn.click();
    await expect(rows.nth(2)).toHaveClass(/is-active/);
    await expect(page.getByRole('dialog')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('renders Process vertical ruled sequence with 6 ordered steps and client deliverables', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/#fitout');
    await page.waitForTimeout(1000);

    // Verify Process title
    const title = page.getByRole('heading', { level: 2, name: /construction process/i });
    await expect(title).toBeVisible();

    // Verify ordered list and 6 steps
    const steps = page.locator('.process-step-item');
    await expect(steps).toHaveCount(6);

    // Verify first and last step
    await expect(steps.first()).toContainText('01');
    await expect(steps.first()).toContainText('Enquiry and site visit');
    await expect(steps.first()).toContainText('You receive:');

    await expect(steps.last()).toContainText('06');
    await expect(steps.last()).toContainText('Handover and care');

    expect(consoleErrors).toEqual([]);
  });

  test('passes axe accessibility audit at Projects and Process sections', async ({ page }) => {
    await page.goto('/#envelope');
    await page.waitForTimeout(1000);
    const projectsAxe = await new AxeBuilder({ page }).analyze();
    expect(projectsAxe.violations).toEqual([]);

    await page.goto('/#fitout');
    await page.waitForTimeout(1000);
    const processAxe = await new AxeBuilder({ page }).analyze();
    expect(processAxe.violations).toEqual([]);
  });
});
