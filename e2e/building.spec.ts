import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 6 — Evolving Building Scroll Construction', () => {
  test('progressively constructs building across stages and updates data-stage attribute', async ({
    page,
  }, testInfo) => {
    if (testInfo.project.use?.contextOptions?.reducedMotion === 'reduce') {
      test.skip();
    }

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // The building mounts on the first input (or an anchor in the URL), not at load
    await page.waitForTimeout(600);
    await page.mouse.move(100, 100);
    await page.waitForTimeout(2000);

    const siteWindow = page.locator('.building-site-window');
    await expect(siteWindow).toBeAttached();

    // 1. Initial State on Hero
    await expect(siteWindow).toHaveAttribute('data-stage', /survey|foundation/);

    // 2. Scroll to Foundation
    const foundation = page.locator('#foundation');
    await foundation.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(siteWindow).toHaveAttribute('data-stage', /foundation|structure/);

    // 3. Process (id fitout) now draws structure, envelope and fit-out in parts, step by step
    const steps = page.locator('#fitout .process-step-item');
    await steps.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(siteWindow).toHaveAttribute('data-stage', /foundation|structure/);
    const processScrollY = await page.evaluate(() => window.scrollY);

    // 4. The last step is the end of the fit-out
    await steps.last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(siteWindow).toHaveAttribute('data-stage', /fitout|completion/);

    // 5. Scroll to Work delivered (id completion)
    const completion = page.locator('#completion');
    await completion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(siteWindow).toHaveAttribute('data-stage', 'completion');

    // Verify lit windows and dimension callout in Completion stage
    await expect(page.locator('.b-pane')).toHaveCount(15);

    const dimensionText = page.locator('.b-dim-label');
    await expect(dimensionText).toHaveText(['15.40 m', '17.40 m']);

    // 7. Reverse scroll: back to the first Process step using lenis.scrollTo with recorded scroll position.
    await page.evaluate((targetY) => {
      const lenis = (
        window as unknown as {
          __lenis?: {
            scrollTo: (t: number, opts?: { duration?: number }) => void;
          };
        }
      ).__lenis;
      if (lenis) {
        lenis.scrollTo(targetY, { duration: 0.3 });
      } else {
        window.scrollTo(0, targetY);
      }
    }, processScrollY);
    await page.waitForTimeout(800);
    await expect(siteWindow).toHaveAttribute('data-stage', /foundation|structure/);

    // 8. Reversible un-build: Scroll back to Hero
    await page.evaluate(() => {
      const lenis = (
        window as unknown as {
          __lenis?: {
            scrollTo: (t: number, opts?: { duration?: number }) => void;
          };
        }
      ).__lenis;
      if (lenis) {
        lenis.scrollTo(0, { duration: 0.3 });
      } else {
        window.scrollTo(0, 0);
      }
    });
    await page.waitForTimeout(800);
    await expect(siteWindow).toHaveAttribute('data-stage', /survey|hero/);

    expect(consoleErrors).toEqual([]);
  });

  test('anchor jump to #completion seeks timeline immediately', async ({ page }) => {
    await page.goto('/#completion');
    await page.waitForTimeout(1500);

    const siteWindow = page.locator('.building-site-window');
    await expect(siteWindow).toBeAttached();
    await expect(siteWindow).toHaveAttribute('data-stage', 'completion');
  });

  test('passes axe accessibility audit across building scroll stages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Axe at Hero
    const heroAxe = await new AxeBuilder({ page }).analyze();
    expect(heroAxe.violations).toEqual([]);

    // Scroll to Process and scan
    const structure = page.locator('#fitout');
    await structure.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const structureAxe = await new AxeBuilder({ page }).analyze();
    expect(structureAxe.violations).toEqual([]);

    // Scroll to Completion and scan
    const completion = page.locator('#completion');
    await completion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const completionAxe = await new AxeBuilder({ page }).analyze();
    expect(completionAxe.violations).toEqual([]);
  });

  test('displays completed building statically in reduced-motion mode', async ({
    page,
  }, testInfo) => {
    if (testInfo.project.use?.contextOptions?.reducedMotion !== 'reduce') {
      test.skip();
    }

    await page.goto('/');
    await page.waitForTimeout(600);
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1500);

    const siteWindow = page.locator('.building-site-window');
    await expect(siteWindow).toBeAttached();

    const stageGroups = page.locator('.stage-group');
    await expect(stageGroups.first()).toBeAttached();
  });
});
