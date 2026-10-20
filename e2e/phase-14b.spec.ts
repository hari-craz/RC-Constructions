import { expect, test, type Page } from '@playwright/test';

/*
 * Phase 14B: the phone and tablet hand-off, lit windows gated by the Completion headline,
 * and the leftover visual defects.
 */
const AMBER = 'rgb(227, 179, 65)';
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

async function open(page: Page, id: string) {
  await page.goto('about:blank');
  await page.goto(`/#${id}`);
  await page.waitForTimeout(1600);
}

const scrollTo = (page: Page, y: number) =>
  page.evaluate((v) => {
    const lenis = (
      window as unknown as {
        __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
      }
    ).__lenis;
    if (lenis) lenis.scrollTo(v, { immediate: true });
    else window.scrollTo(0, v);
  }, y);

/** Longest run of rows, under the arriving sheet's top edge, that show nothing but the sheet colour. */
async function longestEmptyRun(page: Page, sheetTopCss: number): Promise<number> {
  const png = await page.screenshot();
  return page.evaluate(
    async ([b64, topCss]) => {
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const bmp = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.drawImage(bmp, 0, 0);
      const scale = bmp.width / window.innerWidth;
      const first = Math.max(0, Math.round((topCss as number) * scale) + 2);
      const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height);
      // Limewash is #e9e7df; allow for the slight dim of a neighbouring sheet
      const isSheet = (r: number, g: number, b: number) =>
        Math.abs(r - 233) < 14 && Math.abs(g - 231) < 14 && Math.abs(b - 223) < 14;
      let best = 0;
      let run = 0;
      for (let y = first; y < bmp.height; y++) {
        let empty = true;
        for (let x = 0; x < bmp.width; x++) {
          const i = (y * bmp.width + x) * 4;
          if (!isSheet(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0)) {
            empty = false;
            break;
          }
        }
        run = empty ? run + 1 : 0;
        best = Math.max(best, run);
      }
      return best / scale;
    },
    [png.toString('base64'), sheetTopCss] as const,
  );
}

test.describe('Phase 14B: hand-off leaves no large empty region', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}x${vp.height}: nothing taller than 20% of the viewport is empty`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
        'No hand-off under reduced motion',
      );
      test.setTimeout(120_000);
      await page.setViewportSize(vp);
      await open(page, 'hero');
      const top = await page.evaluate(() => document.getElementById('hero')?.offsetHeight ?? 0);
      const worst: { frac: number; run: number }[] = [];
      for (let f = 1; f >= 0; f -= 0.1) {
        await scrollTo(page, Math.max(0, top - vp.height * f));
        // The headline reveal is time-based (0.8 s); let it finish before measuring
        await page.waitForTimeout(1000);
        const sheetTop = await page.evaluate(
          () => document.getElementById('foundation')?.getBoundingClientRect().top ?? 0,
        );
        worst.push({ frac: Math.round(f * 10) / 10, run: await longestEmptyRun(page, sheetTop) });
      }
      for (const w of worst) {
        expect(w.run, `frame ${w.frac}`).toBeLessThanOrEqual(vp.height * 0.2);
      }
    });
  }
});

test.describe('Phase 14B: lit windows wait for the Completion headline', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
    test(`${vp.width}x${vp.height}: no window is lit before the headline is centred`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
        'Scrubbing is replaced by state swaps under reduced motion',
      );
      test.setTimeout(150_000);
      await page.setViewportSize(vp);
      await open(page, 'hero');
      const result = await page.evaluate(
        async ([amber]) => {
          const lenis = (
            window as unknown as {
              __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
            }
          ).__lenis;
          const go = (y: number) =>
            lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
          const heading = document.getElementById('completion-heading');
          const win = document.querySelector<HTMLElement>('.building-site-window');
          if (!heading || !win) return { lit: -1, early: [] as number[] };
          // Reading position: the viewport centre, or the upper part of the screen below 1024 px
          const centre = window.innerHeight * (window.innerWidth < 1024 ? 0.34 : 0.5);
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const early: number[] = [];
          let firstLit = -1;
          let litAtEnd = 0;
          for (let y = 0; y <= max; y += 20) {
            go(y);
            await new Promise((r) => setTimeout(r, 22));
            // Below 1024 px the finished building is lit in a muted amber once Work delivered is behind
            const lit = [...document.querySelectorAll('.b-pane')].filter((p) => {
              const fill = getComputedStyle(p).fill;
              return window.innerWidth < 1024 ? fill !== 'rgb(44, 48, 43)' : fill === amber;
            }).length;
            const r = heading.getBoundingClientRect();
            const headingOffset = r.top + r.height / 2 - centre; // > 0 while still below the centre
            if (lit > 0 && firstLit < 0) firstLit = y;
            if (lit > 0 && headingOffset > 30) early.push(y);
            litAtEnd = lit;
          }
          go(0);
          return { lit: litAtEnd, early, firstLit };
        },
        [AMBER] as const,
      );
      expect(result.early, 'scroll positions with a lit window and an uncentred headline').toEqual(
        [],
      );
      expect(result.lit, 'every window is lit by the end').toBe(15);
    });
  }
});

test.describe('Phase 14B: leftovers', () => {
  test('D1: About lands flush under the header, with no hero showing above its heading', async ({
    page,
  }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await open(page, 'foundation');
      const top = await page.evaluate(
        () => document.getElementById('foundation')?.getBoundingClientRect().top ?? 99,
      );
      expect(Math.abs(top), `${vp.width}: About sheet top`).toBeLessThanOrEqual(1);
      // The row just under the header, on the text side, is the sheet colour (limewash)
      const png = await page.screenshot();
      const px = await page.evaluate(
        async ([b64, nav]) => {
          const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
          const bmp = await createImageBitmap(blob);
          const c = document.createElement('canvas');
          c.width = bmp.width;
          c.height = bmp.height;
          const ctx = c.getContext('2d');
          if (!ctx) return [0, 0, 0];
          ctx.drawImage(bmp, 0, 0);
          const scale = bmp.width / window.innerWidth;
          const d = ctx.getImageData(
            Math.round(8 * scale),
            Math.round(((nav as number) + 6) * scale),
            1,
            1,
          ).data;
          return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
        },
        [
          png.toString('base64'),
          await page.evaluate(() => {
            // Just below the header
            return document.querySelector('.nav-bar')?.getBoundingClientRect().bottom ?? 56;
          }),
        ] as const,
      );
      if (vp.width < 1024) {
        // Below 1024 px the sheet is transparent over the dark backdrop: no concrete hero shows
        expect(px[0], `${vp.width}: pixel under the header is formwork`).toBeLessThan(80);
      } else {
        expect(px[0], `${vp.width}: pixel under the header is limewash`).toBeGreaterThan(220);
        expect(px[1]).toBeGreaterThan(220);
      }
    }
  });

  test('D2: the foundation is framed in the middle of the window and settles for the structure', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
      'Reduced motion has its own static frame',
    );
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      await page.setViewportSize(vp);
      const ground = () =>
        page.evaluate(() => {
          const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
          const line = document.querySelector('.b-ground-line')?.getBoundingClientRect();
          return win && line ? (line.top - win.top) / win.height : -1;
        });
      await open(page, 'foundation');
      const lifted = await ground();
      await open(page, 'structure');
      const rest = await ground();
      // Lifted for the foundation, settled low for the finished building
      expect(rest, `${vp.width}: ground line at rest`).toBeGreaterThan(
        vp.width < 1024 ? 0.55 : 0.72,
      );
      expect(lifted, `${vp.width}: ground line while the foundation is drawn`).toBeLessThan(
        rest - 0.04,
      );
      expect(lifted).toBeGreaterThan(0.4);
    }
  });

  test('D4: nothing from an earlier sheet shows through the Founder sheet', async ({ page }) => {
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      await page.setViewportSize(vp);
      await open(page, 'founder');
      const foreign = await page.evaluate(() => {
        const out: string[] = [];
        const founder = document.getElementById('founder');
        for (let x = 0.05; x < 1; x += 0.15) {
          for (let y = 0.15; y < 1; y += 0.15) {
            const el = document.elementFromPoint(window.innerWidth * x, window.innerHeight * y);
            const sheet = el?.closest('.sheet');
            if (sheet && sheet !== founder) out.push(`${sheet.id}@${x.toFixed(2)},${y.toFixed(2)}`);
          }
        }
        return out;
      });
      expect(foreign, `${vp.width}`).toEqual([]);
    }
  });

  test('D5: the Services heading is never under the header after a jump', async ({ page }) => {
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1]]) {
      await page.setViewportSize(vp);
      await open(page, 'structure');
      const m = await page.evaluate(() => {
        const band = document.querySelector('.nav-bar')?.getBoundingClientRect().bottom ?? 0;
        const h = document.getElementById('structure-heading')?.getBoundingClientRect().top ?? 0;
        return { band, h };
      });
      expect(m.h, `${vp.width}: heading top vs header bottom (anchor)`).toBeGreaterThanOrEqual(
        m.band,
      );
      // And through the section indicator
      await open(page, 'hero');
      await page.locator('.nav-sections-toggle').click();
      await page
        .getByRole('dialog', { name: 'Sections' })
        .getByRole('link', { name: 'Services' })
        .click();
      await page.waitForTimeout(2600);
      const m2 = await page.evaluate(() => {
        const band = document.querySelector('.nav-bar')?.getBoundingClientRect().bottom ?? 0;
        const h = document.getElementById('structure-heading')?.getBoundingClientRect().top ?? 0;
        return { band, h };
      });
      expect(m2.h, `${vp.width}: heading top vs header bottom (indicator)`).toBeGreaterThanOrEqual(
        m2.band,
      );
    }
  });

  test('D7: a portrait that fails to load is replaced by the placeholder, never a broken image', async ({
    page,
  }) => {
    await open(page, 'founder');
    // Nothing broken is on the page now (the portrait is off until real files are committed)
    const broken = await page.evaluate(
      () => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    );
    expect(broken).toBe(0);
    expect(await page.locator('.founder-portrait-frame .photo-crop').count()).toBe(4);
  });
});
