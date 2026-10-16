import { expect, test, type Page } from '@playwright/test';

const SECTION_IDS = [
  'hero',
  'foundation',
  'structure',
  'envelope',
  'fitout',
  'completion',
  'founder',
  'contact',
] as const;

async function open(page: Page, id: string) {
  await page.goto('about:blank');
  await page.goto(`/#${id}`);
  await page.waitForTimeout(1600);
}

test.describe('Phase 12 — visible defects', () => {
  test('no broken image anywhere on the page', async ({ page }) => {
    for (const id of SECTION_IDS) {
      await open(page, id);
      const broken = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll('img')];
        imgs.forEach((i) => (i.loading = 'eager'));
        await Promise.all(imgs.map((i) => i.decode().catch(() => undefined)));
        return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
      });
      expect(broken, `${id}: ${broken.join(', ')}`).toEqual([]);
    }
  });

  test('no visible text starts with "//", contains PLACEHOLDER or is an all-caps placeholder', async ({
    page,
  }) => {
    for (const id of SECTION_IDS) {
      await open(page, id);
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = (n.textContent ?? '').trim();
          const el = n.parentElement;
          if (!text || !el || el.closest('script, style, noscript')) continue;
          if (/^\/\//.test(text) || /PLACEHOLDER/i.test(text)) out.push(text);
          if (/DRAWING SLOT|SYSTEM RECORD/.test(text)) out.push(text);
        }
        return out;
      });
      expect(bad, `${id}: ${bad.join(' | ')}`).toEqual([]);
    }
  });

  test('project overlay gallery slots use plain sentences', async ({ page }) => {
    await page.goto('about:blank');
    await page.goto('/#project-residential-enclave');
    await page.waitForTimeout(1500);
    const marks = await page.locator('.gallery-slot-placeholder-mark').allTextContents();
    expect(marks.length).toBeGreaterThan(0);
    for (const m of marks) expect(m).toMatch(/^[A-Z][a-z]/); // one project-specific sentence-case line
  });

  test('founder portrait slot is a quiet block with one sentence and no img', async ({ page }) => {
    await open(page, 'founder');
    await expect(page.locator('.founder-portrait-frame img')).toHaveCount(0);
    await expect(page.locator('.founder-portrait-note')).toHaveText('Photo to come, 1200 by 1500');
  });

  test('contact: disabled send button is readable and explained beside it', async ({ page }) => {
    await open(page, 'contact');
    const btn = page.locator('.contact-submit-btn');
    if (!(await btn.isDisabled())) test.skip(true, 'Form ID configured');
    await expect(page.locator('.contact-config-note')).toHaveText(
      'Sending is switched off until the form ID is set.',
    );
    const ratio = await btn.evaluate((el) => {
      const lum = (rgb: string) => {
        const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as number[];
        const f = (v: number) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r ?? 0) + 0.7152 * f(g ?? 0) + 0.0722 * f(b ?? 0);
      };
      const cs = getComputedStyle(el);
      const sheet = getComputedStyle(el.closest('.sheet') as Element).backgroundColor;
      const [hi, lo] = [lum(cs.color), lum(sheet)].sort((a, b) => b - a) as [number, number];
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('wide screens: panel-less sections use a centred grid, panel sections keep text left', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop layout');
    for (const width of [1904, 2560]) {
      await page.setViewportSize({ width, height: 1080 });
      for (const id of ['founder', 'contact']) {
        await open(page, id);
        const box = await page.locator(`#${id} .sheet-wide`).boundingBox();
        const left = box?.x ?? 0;
        const right = width - left - (box?.width ?? 0);
        expect(Math.abs(left - right), `${id}@${width}`).toBeLessThanOrEqual(24);
        expect(box?.width ?? 0).toBeLessThanOrEqual(1300);
      }
      await open(page, 'foundation');
      const col = await page.locator('#foundation .sheet-column').boundingBox();
      expect((col?.x ?? 0) + (col?.width ?? 0)).toBeLessThanOrEqual((width * 5) / 12 + 1);
    }
  });
});
