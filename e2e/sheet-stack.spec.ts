import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 3 — Sheet Stack and Motion Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for fonts and initial layout to settle
    await page.waitForLoadState('networkidle');
  });

  test('passes axe accessibility audit on playground', async ({ page }) => {
    const scanResults = await new AxeBuilder({ page }).analyze();
    expect(scanResults.violations).toEqual([]);
  });

  test('has zero horizontal overflow on desktop and mobile', async ({ page }) => {
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('anchor navigation scrolls and updates active section hash', async ({ page }) => {
    // Click Enquire nav link targeting #contact
    const navLink = page.getByRole('link', { name: 'Enquire' });
    await expect(navLink).toBeVisible();
    await navLink.click();

    // Verify hash or section scroll
    await page.waitForTimeout(1000);
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#contact');
  });

  test('tall sheet terminal element is reachable in the viewport', async ({ page }) => {
    const terminal = page.locator('#tall-sheet-terminal');
    await terminal.scrollIntoViewIfNeeded();
    await expect(terminal).toBeInViewport();
  });

  test('scrubs sheet-stack scaling, border-radius, and restores on scroll back', async ({
    page,
  }, testInfo) => {
    // Only test scrub transformations on non-reduced-motion projects
    if (testInfo.project.use?.contextOptions?.reducedMotion === 'reduce') {
      test.skip();
    }

    const sheet1 = page.locator('#hero');
    const sheet2 = page.locator('#about');

    // 0% transition screenshot
    await page.screenshot({ path: 'test-results/phase-3/transition-0pct.png' });

    // Initial scale of Sheet 1 should be 1
    const initialTransform = await sheet1.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    expect(initialTransform === 'none' || initialTransform.includes('matrix(1,')).toBe(true);

    // Scroll to 50% between sheet 1 and sheet 2
    const sheet2Box = await sheet2.boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    if (sheet2Box) {
      // Halfway through the transition: top of sheet2 is halfway up the viewport
      await page.evaluate((targetY) => {
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } })
          .__lenis;
        if (lenis) {
          lenis.scrollTo(targetY);
        } else {
          window.scrollTo(0, targetY);
        }
      }, viewportHeight * 0.5);

      await page.waitForTimeout(600);
      await page.screenshot({ path: 'test-results/phase-3/transition-50pct.png' });

      // Scroll fully to sheet 2 (100% of transition)
      await page.evaluate((targetY) => {
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } })
          .__lenis;
        if (lenis) {
          lenis.scrollTo(targetY);
        } else {
          window.scrollTo(0, targetY);
        }
      }, viewportHeight);

      await page.waitForTimeout(600);
      await page.screenshot({ path: 'test-results/phase-3/transition-100pct.png' });

      // At 100%, sheet1 scale should be ~0.94 and border radius ~32px
      const scale100 = await sheet1.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform;
        if (!matrix || matrix === 'none') return 1;
        const values = matrix.match(/matrix\(([^)]+)\)/);
        if (!values || !values[1]) return 1;
        const parts = values[1].split(',').map((p) => parseFloat(p.trim()));
        return parts[0];
      });

      // Expect scale to be within [0.93, 0.95]
      expect(scale100).toBeLessThanOrEqual(0.96);
      expect(scale100).toBeGreaterThanOrEqual(0.92);

      // Sheet 1 border radius should approach 32px (allowing subpixel rounding)
      const radius100 = await sheet1.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius;
      });
      const radiusPx = parseInt(radius100, 10);
      expect(radiusPx).toBeGreaterThanOrEqual(30);
      expect(radiusPx).toBeLessThanOrEqual(32);

      // Scroll back up to 0
      await page.evaluate(() => {
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } })
          .__lenis;
        if (lenis) {
          lenis.scrollTo(0);
        } else {
          window.scrollTo(0, 0);
        }
      });

      await page.waitForTimeout(600);

      const restoredScale = await sheet1.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform;
        if (!matrix || matrix === 'none') return 1;
        const values = matrix.match(/matrix\(([^)]+)\)/);
        if (!values || !values[1]) return 1;
        const parts = values[1].split(',').map((p) => parseFloat(p.trim()));
        return parts[0];
      });

      expect(restoredScale).toBeCloseTo(1, 1);
    }
  });

  test('reduced-motion disables transform animations and sticky pinning', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sheet1 = page.locator('#hero');
    const isTransformed = await sheet1.evaluate((el) => {
      const transform = window.getComputedStyle(el).transform;
      return transform !== 'none' && !transform.includes('matrix(1, 0, 0, 1, 0, 0)');
    });

    expect(isTransformed).toBe(false);

    const position = await sheet1.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(position).toBe('static');
  });
});
