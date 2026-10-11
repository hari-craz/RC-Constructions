import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Smoke, Accessibility, and Security Policy', () => {
  test('loads the placeholder page with zero CSP errors and passes axe accessibility check', async ({
    page,
  }) => {
    const cspViolations: string[] = [];

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        /content security policy|csp|violation|blocked/i.test(msg.text())
      ) {
        cspViolations.push(`Console CSP Error: ${msg.text()}`);
      }
    });

    await page.addInitScript(() => {
      window.addEventListener('securitypolicyviolation', (e) => {
        const globalStore = window as unknown as { __cspViolations?: string[] };
        globalStore.__cspViolations = globalStore.__cspViolations || [];
        globalStore.__cspViolations.push(
          `CSP Violation: blockedURI=${e.blockedURI}, directive=${e.violatedDirective}`,
        );
      });
    });

    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    const inPageViolations = await page.evaluate(() => {
      const globalStore = window as unknown as { __cspViolations?: string[] };
      return globalStore.__cspViolations || [];
    });

    expect(cspViolations, 'No console CSP errors').toEqual([]);
    expect(inPageViolations, 'No securitypolicyviolation events').toEqual([]);

    const scanResults = await new AxeBuilder({ page }).analyze();
    expect(scanResults.violations).toEqual([]);
  });

  test('records zero long tasks over 50ms attributable to intro animation and first transition', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const globalStore = window as unknown as {
        __longtasks?: { duration: number; startTime: number }[];
      };
      globalStore.__longtasks = [];
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              globalStore.__longtasks?.push({
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime),
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // PerformanceObserver longtask may not be available in all browsers
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await page.locator('#hero').waitFor();
    await page.waitForTimeout(500);

    // Clear initial page-load script evaluation tasks, monitor animation and scrub
    const startAnimationTime = await page.evaluate(() => performance.now());

    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight * 0.5);
    });
    await page.waitForTimeout(500);

    const tasksDuringAnimation = await page.evaluate((startTime) => {
      const globalStore = window as unknown as {
        __longtasks?: { duration: number; startTime: number }[];
      };
      return (globalStore.__longtasks || []).filter((t) => t.startTime >= startTime);
    }, startAnimationTime);

    // Verify no long tasks over 50ms occurred during the intro animation or scroll transition
    expect(tasksDuringAnimation).toEqual([]);
  });
});
