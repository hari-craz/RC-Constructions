import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7B — Projects and Process Real Content', () => {
  test('renders Projects register with 6 rows and updates preview slot on activation without layout shift', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/#envelope');
    await page.waitForTimeout(1000);

    // Verify Projects title
    const title = page.getByRole('heading', { level: 2, name: /selected projects register/i });
    await expect(title).toBeVisible();

    // Verify preview slot
    const previewSlot = page.locator('.projects-preview-slot');
    await expect(previewSlot).toBeVisible();

    // Verify six project rows
    const rows = page.locator('.projects-row-item');
    await expect(rows).toHaveCount(6);

    // Check first project is active by default
    await expect(rows.first()).toHaveClass(/is-active/);
    await expect(previewSlot).toContainText('South Enclave Residences');

    // Record preview slot bounding box
    const initialBox = await previewSlot.boundingBox();

    // Focus row 2 via keyboard
    const row2Btn = rows.nth(1).locator('.projects-row-btn');
    await row2Btn.focus();
    await expect(row2Btn).toBeFocused();
    await expect(rows.nth(1)).toHaveClass(/is-active/);
    await expect(previewSlot).toContainText('Apex Commercial Chambers');

    // Check no layout shift on preview slot
    const updatedBox = await previewSlot.boundingBox();
    expect(updatedBox?.width).toBeCloseTo(initialBox?.width ?? 0, 0);
    expect(updatedBox?.height).toBeCloseTo(initialBox?.height ?? 0, 0);

    // Check click / tap activation on row 3
    const row3Btn = rows.nth(2).locator('.projects-row-btn');
    await row3Btn.click();
    await expect(rows.nth(2)).toHaveClass(/is-active/);
    await expect(previewSlot).toContainText('Corridor Logistics Hub');

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
    await expect(steps.first()).toContainText('Enquiry & Site Visit');
    await expect(steps.first()).toContainText('Client Deliverable:');

    await expect(steps.last()).toContainText('06');
    await expect(steps.last()).toContainText('Handover & Care');

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
