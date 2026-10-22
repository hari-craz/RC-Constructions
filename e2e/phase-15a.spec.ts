import { expect, test, type Page, type TestInfo } from '@playwright/test';

/*
 * Phase 15A: release candidate. Leftovers closed from the 14D list (see docs/DESIGN-REVIEW-phase-15a.md).
 */
const SIZES = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

const isReduced = (info: TestInfo) => info.project.use?.contextOptions?.reducedMotion === 'reduce';

const walkTo = async (page: Page, target: number) => {
  const from = await page.evaluate(() => window.scrollY);
  const step = 80 * Math.sign(target - from || 1);
  for (let y = from; Math.abs(target - y) > 80; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(12);
  }
  await page.evaluate((v) => window.scrollTo(0, v), target);
  await page.waitForTimeout(400);
};

const atMorph = (page: Page, m: number) =>
  page.evaluate((v) => {
    const hero = document.getElementById('hero')?.offsetHeight ?? 0;
    return Math.round(hero - window.innerHeight + v * window.innerHeight);
  }, m);

test.describe('Phase 15A: no JavaScript', () => {
  for (const size of SIZES) {
    test(`${size.width}x${size.height}: the static house shows, and the finished building shows after it`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: size });
      const page = await context.newPage();
      await page.goto('/');
      const house = page.locator('.hero-model-static .hm-svg');
      const building = page.locator('.static-building .sb-svg');
      await expect(house).toBeVisible();
      await expect(building).toBeVisible();
      expect(await house.locator('.hm-face').count()).toBeGreaterThan(100);
      // The building comes after the house, and neither runs past the screen width
      const [h, b] = await Promise.all([house.boundingBox(), building.boundingBox()]);
      expect(h && b && b.y >= h.y + h.height - 1, 'building is below the house').toBe(true);
      for (const box of [h, b]) {
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
      }
      // Finished: four storeys of windows (15 of them), every one lit, an entrance and a name plate
      expect(await building.locator('.sb-lit').count()).toBe(15);
      expect(await building.locator('.sb-plate-text').textContent()).toBe('RC Constructions');
      // Lit panes are the amber accent, flat, and the walls are limewash (the CSS reached the page)
      const fills = await building.evaluate((svg) => ({
        lit: getComputedStyle(svg.querySelector('.sb-lit') as Element).fill,
        wall: getComputedStyle(svg.querySelector('.sb-wall') as Element).fill,
      }));
      expect(fills.lit).not.toBe(fills.wall);
      expect(fills.lit).not.toBe('rgb(0, 0, 0)');
      // The contact line is still there under both
      await expect(page.getByRole('link', { name: /@/ }).first()).toBeVisible();
      await context.close();
    });
  }
});

test.describe('Phase 15A: the phone control strip', () => {
  for (const size of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
  ]) {
    test(`${size.width}x${size.height}: Turn, Tilt, Reset and Auto-rotate; the rest behind More`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.locator('.hero-model-widget').waitFor();
      await page.waitForTimeout(600);
      const strip = page.locator('.hero-model-controls');
      const labels = await strip.locator(':scope > button').evaluateAll((els) =>
        els.map((e) => ({
          text: (e.textContent ?? '').trim(),
          h: e.getBoundingClientRect().height,
          w: e.getBoundingClientRect().width,
          // A label that wraps is taller than one line, or wider than its box
          oneLine: e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().height < 60,
        })),
      );
      expect(labels.map((l) => l.text)).toEqual(['Turn', 'Tilt', 'Reset', 'Auto-rotate', 'More']);
      for (const l of labels) {
        expect(l.h, `${l.text} is at least 44 px tall`).toBeGreaterThanOrEqual(44);
        expect(l.w, `${l.text} is at least 44 px wide`).toBeGreaterThanOrEqual(44);
        expect(l.oneLine, `${l.text} does not wrap`).toBe(true);
      }
      // The spoken names contain the visible labels
      for (const name of ['Turn right', 'Tilt up', 'Reset view']) {
        await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
      }
      // Nothing else until More is opened; then the other directions and roll
      await expect(page.getByRole('button', { name: 'Roll left', exact: true })).toHaveCount(0);
      const more = page.getByRole('button', { name: 'More', exact: true });
      await expect(more).toHaveAttribute('aria-expanded', 'false');
      await more.click();
      await expect(more).toHaveAttribute('aria-expanded', 'true');
      for (const name of ['Turn left', 'Tilt down', 'Roll left', 'Roll right']) {
        const btn = page.getByRole('button', { name, exact: true });
        await expect(btn).toBeVisible();
        expect((await btn.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole('button', { name: 'Roll left', exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        size.width,
      );
    });
  }

  test('on a wide screen every step keeps its own button and there is no More', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('.hero-model-widget').waitFor();
    for (const name of [
      'Turn left',
      'Turn right',
      'Tilt up',
      'Tilt down',
      'Roll left',
      'Roll right',
    ]) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'More', exact: true })).toHaveCount(0);
  });
});

test.describe('Phase 15A: the phone house is at full tone until it dissolves', () => {
  test('390x844: the dim is 0 until the dissolve starts, then rises to 1', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'No morph under reduced motion');
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.hero-model-widget').waitFor();
    await page.waitForTimeout(4800);
    const dim = () =>
      page.evaluate(() =>
        Number(
          (document.querySelector('.stage-house') as SVGElement | null)?.style.getPropertyValue(
            '--hm-dim',
          ) || 0,
        ),
      );
    const fill = () =>
      page.evaluate(() => {
        const el = document.querySelector('.stage-house .hm-wall:not(.hm-open)');
        return el ? getComputedStyle(el).color : '';
      });
    expect(await dim()).toBe(0);
    const seen: Record<string, number> = {};
    const colour: Record<string, string> = {};
    for (const m of [0.3, 0.45, 0.5, 0.58, 0.7]) {
      await walkTo(page, await atMorph(page, m));
      seen[String(m)] = await dim();
      colour[String(m)] = await fill();
    }
    expect(seen['0.3'], 'before the dissolve').toBe(0);
    expect(seen['0.45'], 'landed, not yet dissolving').toBe(0);
    expect(seen['0.5'], 'the dissolve begins').toBe(0);
    expect(seen['0.58']).toBeGreaterThan(0);
    expect(seen['0.7'], 'dimmed by the time the text arrives').toBe(1);
    // The full tone is a different (lighter) colour from the dimmed ghost
    expect(colour['0.45']).not.toBe(colour['0.7']);
    // And it goes back exactly when scrolling back up
    await walkTo(page, await atMorph(page, 0.45));
    expect(await dim()).toBe(0);
  });
});

test.describe('Phase 15A: text over the building', () => {
  test('390x844: detail under a block of text is cleared by region, and only hidden', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'Same logic; the motion project covers it');
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1200);
    const structure = await page.evaluate(
      () => document.getElementById('structure')?.offsetTop ?? 0,
    );
    const counts: number[] = [];
    for (const y of [structure + 300, structure + 700, structure + 1100]) {
      await walkTo(page, y);
      counts.push(await page.locator('.building-site-window [data-clear]').count());
    }
    expect(
      counts.some((c) => c > 0),
      'some detail is cleared under the text',
    ).toBe(true);
    // Hidden, not removed: it keeps its place and returns
    const hiddenIsVisibilityOnly = await page.evaluate(() =>
      [...document.querySelectorAll('.building-site-window [data-clear="hide"]')].every(
        (e) =>
          getComputedStyle(e).visibility === 'hidden' && getComputedStyle(e).display !== 'none',
      ),
    );
    expect(hiddenIsVisibilityOnly).toBe(true);
    // Between blocks the building is whole: not every window frame is hidden
    const frames = await page.evaluate(() => ({
      total: document.querySelectorAll('.building-site-window .b-frame').length,
      shown: [...document.querySelectorAll('.building-site-window .b-frame')].filter(
        (e) => getComputedStyle(e).visibility !== 'hidden',
      ).length,
    }));
    expect(frames.shown).toBeGreaterThan(0);
  });

  test('1440x900: nothing is cleared on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(1500);
    expect(await page.locator('.building-site-window [data-clear]').count()).toBe(0);
  });
});
