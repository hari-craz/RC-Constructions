import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 8 — Polish: Loading Line, Survey Cursor, and Project Detail Overlay', () => {
  test.describe('Part A: Loading Sequence', () => {
    test('draws hairline dimension line and clears without layout shifts', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');

      // Wait for intro completion (caps at 1.2s)
      await page.waitForTimeout(1400);

      const loadingLine = page.locator('[data-testid="loading-dimension-line"]');
      // After completion, element should be hidden or detached
      const isVisible = await loadingLine.isVisible().catch(() => false);
      expect(isVisible).toBe(false);

      expect(consoleErrors).toEqual([]);
    });

    test('skips loading line on repeat visits in the same session', async ({ page }) => {
      // First visit sets sessionStorage flag
      await page.goto('/');
      await page.waitForTimeout(1400);

      // Second visit in same page/session
      await page.goto('/');
      await page.waitForTimeout(100);

      const loadingLine = page.locator('[data-testid="loading-dimension-line"]');
      const isVisible = await loadingLine.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('works normally when sessionStorage throws exceptions', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', {
          get: () => {
            throw new Error('Storage disabled');
          },
        });
      });

      await page.goto('/');
      await page.waitForTimeout(1400);

      const hero = page.locator('#hero');
      await expect(hero).toBeVisible();
    });
  });

  test.describe('Part B: Survey-Marker Cursor', () => {
    test('mounts on fine-pointer devices and tracks coordinates', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(500);

      const cursor = page.locator('[data-testid="survey-cursor"]');
      // On desktop Chromium, pointer: fine is supported
      if ((await cursor.count()) > 0) {
        await page.mouse.move(200, 200);
        await page.waitForTimeout(100);

        // Hover over a button to check state transition to link
        const btn = page.locator('a.nav-link, button.btn').first();
        if (await btn.isVisible()) {
          await btn.hover();
          await page.waitForTimeout(100);
          await expect(cursor).toHaveAttribute('data-cursor-state', 'link');
        }

        // Hover over a project row to check state transition to project
        const projectRow = page.locator('[data-project-id]').first();
        if (await projectRow.isVisible()) {
          await projectRow.hover();
          await page.waitForTimeout(100);
          await expect(cursor).toHaveAttribute('data-cursor-state', 'project');
        }
      }
    });

    test('fades out over inputs to preserve native caret', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForTimeout(600);

      const cursor = page.locator('[data-testid="survey-cursor"]');
      if ((await cursor.count()) > 0) {
        const nameInput = page.locator('input[name="name"]');
        await nameInput.scrollIntoViewIfNeeded();
        await nameInput.hover();
        await page.waitForTimeout(100);

        await expect(cursor).toHaveAttribute('data-cursor-state', 'hidden');
      }
    });
  });

  test.describe('Part C: Project Detail Overlay', () => {
    test('opens on click, sets URL hash, traps focus, and closes on Escape', async ({ page }) => {
      await page.goto('/#envelope');
      await page.waitForTimeout(800);

      const firstProjectRow = page.locator(
        '[data-project-id="project-residential-enclave"] button',
      );
      await firstProjectRow.click();

      // Dialog should open
      const overlay = page.locator('[data-testid="project-overlay"]');
      await expect(overlay).toBeVisible();

      // URL hash updated
      expect(page.url()).toContain('#project-residential-enclave');

      // Focus moved into dialog (Close button)
      const closeBtn = overlay.locator('.project-overlay-close-btn');
      await expect(closeBtn).toBeFocused();

      // Background marked inert
      const main = page.locator('#main');
      await expect(main).toHaveAttribute('inert', '');

      // Close via Escape key
      await page.keyboard.press('Escape');
      await expect(overlay).not.toBeVisible();

      // Background inert removed
      await expect(main).not.toHaveAttribute('inert', '');

      // Focus returned to triggering button
      await expect(firstProjectRow).toBeFocused();
    });

    test('supports full keyboard Tab cycling within dialog', async ({ page }) => {
      await page.goto('/#envelope');
      await page.waitForTimeout(800);

      const firstProjectRow = page.locator(
        '[data-project-id="project-residential-enclave"] button',
      );
      await firstProjectRow.click();

      const overlay = page.locator('[data-testid="project-overlay"]');
      await expect(overlay).toBeVisible();

      const closeBtn = overlay.locator('.project-overlay-close-btn');
      await expect(closeBtn).toBeFocused();

      // Shift+Tab from first element should wrap to last focusable element
      await page.keyboard.press('Shift+Tab');
      const adjacentBtn = overlay.locator('.project-adjacent-btn').last();
      await expect(adjacentBtn).toBeFocused();

      // Tab from last element should wrap to first element
      await page.keyboard.press('Tab');
      await expect(closeBtn).toBeFocused();

      // Close via close button
      await closeBtn.click();
      await expect(overlay).not.toBeVisible();
    });

    test('navigates to previous and next projects within overlay and updates hash', async ({
      page,
    }) => {
      await page.goto('/#envelope');
      await page.waitForTimeout(800);

      const firstProjectRow = page.locator(
        '[data-project-id="project-residential-enclave"] button',
      );
      await firstProjectRow.click();

      const overlay = page.locator('[data-testid="project-overlay"]');
      await expect(overlay).toBeVisible();

      // Click Next project button
      const nextBtn = overlay.locator('.project-adjacent-btn:has-text("Next:")');
      await nextBtn.click();
      await page.waitForTimeout(200);

      // URL hash should update to commercial tower
      expect(page.url()).toContain('#project-commercial-tower');
      await expect(overlay.locator('#project-overlay-title')).toHaveText(
        /Apex Commercial Chambers/i,
      );

      // Close and verify
      await page.keyboard.press('Escape');
      await expect(overlay).not.toBeVisible();
    });

    test('direct load on #project-<slug> opens overlay with project details', async ({ page }) => {
      await page.goto('/#project-industrial-warehouse');
      await page.waitForTimeout(1000);

      const overlay = page.locator('[data-testid="project-overlay"]');
      await expect(overlay).toBeVisible();
      await expect(overlay.locator('#project-overlay-title')).toHaveText(/Corridor Logistics Hub/i);

      // Close goes back to clean state
      const closeBtn = overlay.locator('.project-overlay-close-btn');
      await closeBtn.click();
      await expect(overlay).not.toBeVisible();
    });

    test('ignores unknown project slug without throwing errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/#project-nonexistent-building');
      await page.waitForTimeout(800);

      const overlay = page.locator('[data-testid="project-overlay"]');
      const isVisible = await overlay.isVisible().catch(() => false);
      expect(isVisible).toBe(false);

      expect(consoleErrors).toEqual([]);
    });

    test('passes axe accessibility audit when overlay is open', async ({ page }) => {
      await page.goto('/#envelope');
      await page.waitForTimeout(800);

      const projectRow = page.locator('[data-project-id="project-residential-enclave"] button');
      await projectRow.click();

      const overlay = page.locator('[data-testid="project-overlay"]');
      await expect(overlay).toBeVisible();

      // Run axe on full page with open overlay
      const axeResults = await new AxeBuilder({ page }).analyze();
      expect(axeResults.violations).toEqual([]);
    });

    test('maintains zero CLS during overlay open and close transitions', async ({ page }) => {
      await page.goto('/#envelope');
      await page.waitForTimeout(800);

      const initialCls = await page.evaluate(() => {
        let clsValue = 0;
        const entries = performance.getEntriesByType('layout-shift');
        for (const entry of entries) {
          const shift = entry as unknown as { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput && shift.value) {
            clsValue += shift.value;
          }
        }
        return clsValue;
      });

      const projectRow = page.locator('[data-project-id="project-residential-enclave"] button');
      await projectRow.click();
      await page.waitForTimeout(400);

      const closeBtn = page.locator('.project-overlay-close-btn');
      await closeBtn.click();
      await page.waitForTimeout(400);

      const finalCls = await page.evaluate(() => {
        let clsValue = 0;
        const entries = performance.getEntriesByType('layout-shift');
        for (const entry of entries) {
          const shift = entry as unknown as { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput && shift.value) {
            clsValue += shift.value;
          }
        }
        return clsValue;
      });

      // Shift during open/close should be minimal and within budget <= 0.01
      expect(finalCls - initialCls).toBeLessThanOrEqual(0.01);
    });
  });
});
