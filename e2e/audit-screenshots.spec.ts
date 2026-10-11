import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1080', width: 2560, height: 1080 },
];

test.describe('Audit Visual Verification Screenshots', () => {
  test('captures screenshots across required viewports at intro complete and mid-transition', async ({
    page,
  }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Allow full 2.6s intro animation to complete
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: `test-results/audit/intro-complete-${vp.name}.png`,
        fullPage: false,
      });

      // Scroll to mid-transition where About sheet covers part of hero
      await page.evaluate((h) => {
        window.scrollTo(0, h * 0.5);
      }, vp.height);
      await page.waitForTimeout(600);

      await page.screenshot({
        path: `test-results/audit/mid-transition-${vp.name}.png`,
        fullPage: false,
      });
    }
  });
});
