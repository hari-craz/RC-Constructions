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
});
