import { expect, test } from '@playwright/test';

const DESKTOP_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1904, height: 1080 },
  { width: 2560, height: 1080 },
];

const SECTIONS_TO_CHECK = [
  { id: 'foundation', containerSelector: '.about-content', name: 'About' },
  { id: 'structure', containerSelector: '.services-content', name: 'Services' },
  { id: 'envelope', containerSelector: '.projects-content', name: 'Projects' },
  { id: 'fitout', containerSelector: '.process-content', name: 'Process' },
];

test.describe('Part B0.1 — Geometry Test: Content Text never intersects Building Window', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'Desktop geometry test');
  });

  for (const viewport of DESKTOP_VIEWPORTS) {
    test.describe(`${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport });

      for (const section of SECTIONS_TO_CHECK) {
        test(`in ${section.name} (#${section.id}), all text elements remain in content column with clear gutter to building`, async ({
          page,
        }) => {
          await page.goto(`/#${section.id}`);
          await page.waitForTimeout(600);

          const building = page.locator('.building-site-window');
          await expect(building).toBeVisible();

          const buildingBox = await building.boundingBox();
          expect(buildingBox).not.toBeNull();
          if (!buildingBox) return;

          // Check all text-bearing elements inside the content column
          const textElements = page.locator(
            `${section.containerSelector} p, ` +
              `${section.containerSelector} h1, ` +
              `${section.containerSelector} h2, ` +
              `${section.containerSelector} h3, ` +
              `${section.containerSelector} span, ` +
              `${section.containerSelector} td, ` +
              `${section.containerSelector} th, ` +
              `${section.containerSelector} li, ` +
              `${section.containerSelector} blockquote`,
          );

          const count = await textElements.count();
          expect(count).toBeGreaterThan(0);

          for (let i = 0; i < count; i++) {
            const el = textElements.nth(i);
            if (!(await el.isVisible())) continue;

            const box = await el.boundingBox();
            if (!box || box.width === 0 || box.height === 0) continue;

            // Check geometry: text bounding box right edge must be strictly less than building left edge
            const textRight = box.x + box.width;
            const buildingLeft = buildingBox.x;

            const intersects = !(
              textRight <= buildingLeft ||
              box.x >= buildingBox.x + buildingBox.width ||
              box.y + box.height <= buildingBox.y ||
              box.y >= buildingBox.y + buildingBox.height
            );

            expect(
              intersects,
              `Text element ${i} in ${section.name} (${box.x}, ${textRight}) intersects building window at x=${buildingLeft}`,
            ).toBe(false);

            // Also assert a positive gutter (text right < building left)
            expect(textRight).toBeLessThan(buildingLeft);
          }
        });
      }
    });
  }
});
