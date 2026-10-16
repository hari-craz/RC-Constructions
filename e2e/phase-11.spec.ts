import { expect, test, type Page } from '@playwright/test';

const SURFACE = 'rgb(35, 38, 34)';
const AMBER = 'rgb(227, 179, 65)';
const STAGE_IDS = ['foundation', 'structure', 'envelope', 'fitout', 'completion'] as const;
const SECTION_IDS = ['hero', ...STAGE_IDS, 'founder', 'contact'] as const;

async function open(page: Page, id: string) {
  // A hash-only navigation would not reload; start from a blank page so each anchor is a fresh seek
  await page.goto('about:blank');
  await page.goto(`/#${id}`);
  await page.waitForTimeout(1600);
}

test.describe('Phase 11 — building as protagonist', () => {
  test('site window: constant surface, building fills at least 55% x 60% of the viewport', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop window geometry');
    // Three viewports x five anchors, each a fresh seek
    test.setTimeout(120_000);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1904, height: 1080 },
      { width: 2560, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      for (const id of STAGE_IDS) {
        await open(page, id);
        const box = await page.locator('.building-svg').boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(viewport.width * 0.55);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(viewport.height * 0.6);
        const bg = await page
          .locator('.building-site-window')
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).toBe(SURFACE);
        // The drawn building (roof slab) spans at least 70% of the window width
        const ratio = await page.evaluate(() => {
          const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
          const roof = document.querySelector('.b-ground-slab')?.getBoundingClientRect();
          return win && roof ? roof.width / win.width : 0;
        });
        expect(ratio, `${viewport.width}: building/window width`).toBeGreaterThanOrEqual(0.7);
      }
    }
  });

  test('mobile: fixed band at the top, building at least 80% of its width', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile band');
    await open(page, 'structure');
    const box = await page.locator('.building-site-window').boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(box?.y ?? -1).toBe(0);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(vh * 0.37);
    expect(box?.height ?? 0).toBeLessThanOrEqual(vh * 0.53);
    // The drawn building spans at least 80% of the band width
    const ratio = await page.evaluate(() => {
      const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
      const roof = document.querySelector('.b-ground-slab')?.getBoundingClientRect();
      return win && roof ? roof.width / win.width : 0;
    });
    expect(ratio).toBeGreaterThanOrEqual(0.8);
  });

  test('each stage is complete at rest, lit windows are flat amber, and scrolling up un-builds', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.use?.contextOptions?.reducedMotion === 'reduce', 'Motion only');
    const measure = () =>
      page.evaluate(() => {
        const h = (s: string) =>
          [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect().height);
        const op = (s: string) =>
          [...document.querySelectorAll(s)].map((e) => Number(getComputedStyle(e).opacity));
        return {
          footing: Math.min(...h('.b-footing')),
          col: Math.min(...h('.b-col')),
          wall: Math.min(...h('.b-wall')),
          frameOpacity: op('.b-fit'),
          paneFills: [...document.querySelectorAll('.b-pane')].map((e) => getComputedStyle(e).fill),
          plate: op('.b-plate')[0],
        };
      });

    await open(page, 'completion');
    const ref = await measure();
    expect(ref.paneFills).toHaveLength(15);
    expect(ref.paneFills.every((f) => f === AMBER)).toBe(true);
    expect(ref.frameOpacity.every((o) => o === 1)).toBe(true);
    expect(ref.plate).toBe(1);
    // Individually lit: every pane is small relative to the window
    const paneMax = await page.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll('.b-pane')].map((e) => e.getBoundingClientRect().width),
      ),
    );
    const winW = (await page.locator('.building-svg').boundingBox())?.width ?? 1;
    expect(paneMax).toBeLessThan(winW * 0.15);

    await open(page, 'foundation');
    let m = await measure();
    expect(m.footing).toBeGreaterThan(ref.footing * 0.95);
    expect(m.col).toBeLessThan(ref.col * 0.05);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);

    await open(page, 'structure');
    m = await measure();
    expect(m.col).toBeGreaterThan(ref.col * 0.95);
    expect(m.wall).toBeLessThan(ref.wall * 0.05);
    expect(m.frameOpacity.every((o) => o === 0)).toBe(true);

    await open(page, 'envelope');
    m = await measure();
    expect(m.wall).toBeGreaterThan(ref.wall * 0.95);
    expect(m.frameOpacity.every((o) => o === 0)).toBe(true);

    await open(page, 'fitout');
    m = await measure();
    expect(m.frameOpacity.every((o) => o === 1)).toBe(true);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);

    // Reverse: from completion back up to structure
    await open(page, 'completion');
    await page.evaluate(() => {
      const sheets = [...document.querySelectorAll<HTMLElement>('.sheet-stack > .sheet')];
      const idx = sheets.findIndex((s) => s.id === 'structure');
      let y = 0;
      for (let i = 0; i < idx; i++) y += sheets[i]?.offsetHeight ?? 0;
      const lenis = (
        window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }
      ).__lenis;
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    });
    await page.waitForTimeout(900);
    m = await measure();
    expect(m.wall).toBeLessThan(ref.wall * 0.05);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);
  });

  test('reduced motion shows the finished, lit building', async ({ page }, testInfo) => {
    test.skip(testInfo.project.use?.contextOptions?.reducedMotion !== 'reduce', 'Reduced only');
    await open(page, 'foundation');
    const fills = await page
      .locator('.b-pane')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).fill));
    expect(fills).toHaveLength(15);
    expect(fills.every((f) => f === AMBER)).toBe(true);
    const ops = await page
      .locator('.b-fit')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(ops.every((o) => o === '1')).toBe(true);
  });

  test('building strokes and labels meet 3:1 against the site window on every section', async ({
    page,
  }) => {
    for (const id of STAGE_IDS) {
      await open(page, id);
      const failures = await page.evaluate((surface) => {
        const lum = (rgb: string) => {
          const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as number[];
          const f = (v: number) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r ?? 0) + 0.7152 * f(g ?? 0) + 0.0722 * f(b ?? 0);
        };
        const ratio = (a: string, b: string) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
          return (hi + 0.05) / (lo + 0.05);
        };
        const bad: string[] = [];
        document.querySelectorAll('.building-svg *').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 && cs.strokeOpacity !== '0') {
            const r = ratio(cs.stroke, surface);
            if (r < 3) bad.push(`${el.getAttribute('class')} stroke ${cs.stroke} ${r.toFixed(2)}`);
          }
        });
        return bad;
      }, SURFACE);
      expect(failures, `${id}: ${failures.join('; ')}`).toEqual([]);
    }
  });
});

test.describe('Phase 11 — page rules', () => {
  test('no section labels, codes or eyebrows exist; one headline opens each section', async ({
    page,
  }) => {
    await open(page, 'hero');
    const text = await page.evaluate(() => document.body.textContent ?? '');
    for (const banned of [
      /Section 0\d/,
      /DWG-/,
      /REG \/ /,
      /About RC Construction/,
      /Leadership \/ Field Direction/,
      /Direct Enquiry/,
      /SYSTEM RECORD/,
      /Site Survey & Excavation/,
    ]) {
      expect(text).not.toMatch(banned);
    }
    const result = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('section.sheet').forEach((sec) => {
        const heading = document.getElementById(sec.getAttribute('aria-labelledby') ?? '');
        const first = sec.querySelector('h1, h2, h3');
        if (!heading || !/^H[12]$/.test(heading.tagName) || heading !== first) {
          out.push(`${sec.id}: heading is not the first heading`);
          return;
        }
        const walker = document.createTreeWalker(
          sec.querySelector('.sheet-inner') as Node,
          NodeFilter.SHOW_TEXT,
        );
        let node = walker.nextNode();
        while (node && !(node.textContent ?? '').trim()) node = walker.nextNode();
        if (!node || !heading.contains(node)) {
          // hero plot svg text precedes the h1 in DOM but is aria-hidden art
          const inArt = node?.parentElement?.closest('svg');
          if (!inArt) out.push(`${sec.id}: text precedes the headline`);
        }
      });
      return out;
    });
    expect(result).toEqual([]);
  });

  test('no uppercase micro-labels and no text under 14px', async ({ page }) => {
    for (const id of SECTION_IDS) {
      await open(page, id);
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
          if (el.closest('svg, .sr-only, [aria-hidden="true"]')) return;
          const own = [...el.childNodes].some(
            (n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0,
          );
          if (!own) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const cs = getComputedStyle(el);
          const size = parseFloat(cs.fontSize);
          if (size < 13.99) out.push(`${el.className} ${size}px`);
          if (cs.textTransform === 'uppercase' && size < 20 && !el.closest('a, button'))
            out.push(`${el.className} uppercase ${size}px`);
        });
        return out;
      });
      expect(bad, `${id}: ${bad.join('; ')}`).toEqual([]);
    }
  });

  test('sheets never crop their own content and keep generous bottom padding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => {
      const vh = window.innerHeight;
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('section.sheet').forEach((sheet) => {
        if (sheet.id === 'hero') return;
        const sb = sheet.getBoundingClientRect().bottom;
        let max = 0;
        sheet.querySelectorAll<HTMLElement>('.sheet-inner *').forEach((el) => {
          if (el.closest('svg, .sr-only')) return;
          const r = el.getBoundingClientRect();
          if (r.height > 0 && getComputedStyle(el).position !== 'absolute')
            max = Math.max(max, r.bottom);
        });
        if (sheet.scrollHeight > sheet.clientHeight + 1) out.push(`${sheet.id}: overflow clipped`);
        if (max > sb - vh * 0.12 + 1) out.push(`${sheet.id}: content bottom ${max} vs sheet ${sb}`);
      });
      return out;
    });
    expect(result).toEqual([]);
  });

  test('amber appears only on dimension lines, lit windows, primary buttons and the loading line', async ({
    page,
  }) => {
    for (const id of SECTION_IDS) {
      await open(page, id);
      const bad = await page.evaluate((amber) => {
        const allowed =
          '.btn, .contact-submit-btn, .error-boundary-reload-btn, .b-pane, .b-dim, .b-dim-label, .hero-plot-svg, .hero-plot-svg *, .loading-dimension-line, .loading-dimension-line *';
        const out: string[] = [];
        document.querySelectorAll<HTMLElement | SVGElement>('body *').forEach((el) => {
          if (el.matches(allowed) || el.closest('.hero-plot-svg, .loading-dimension-line')) return;
          const cs = getComputedStyle(el);
          const hit = [cs.color, cs.backgroundColor, cs.fill, cs.stroke].includes(amber);
          const edge = [cs.borderTopColor, cs.outlineColor].some(
            (c, i) =>
              c === amber &&
              (i === 0 ? parseFloat(cs.borderTopWidth) > 0 : cs.outlineStyle !== 'none'),
          );
          if (hit || edge) out.push(`${el.tagName}.${el.getAttribute('class')}`);
        });
        return out;
      }, AMBER);
      expect(bad, `${id}: ${bad.join('; ')}`).toEqual([]);
    }
  });

  test('projects: image slot and register are separate, rows never render inside the slot', async ({
    page,
  }) => {
    await open(page, 'envelope');
    const slot = page.locator('.projects-preview-slot');
    await page.locator('.projects-row-btn').nth(2).hover();
    await expect(page.locator('.projects-row-item').nth(2)).toHaveClass(/is-active/);
    expect(await slot.locator('.projects-row-item, .projects-row-btn').count()).toBe(0);
    const s = await slot.boundingBox();
    const r = await page.locator('.projects-register').boundingBox();
    expect(s && r && s.y + s.height <= r.y).toBe(true);
  });

  test('header and logo stay legible (4.5:1) on every surface', async ({ page }) => {
    for (const id of SECTION_IDS) {
      await open(page, id);
      const worst = await page.evaluate(() => {
        const lum = (rgb: string) => {
          const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as number[];
          const f = (v: number) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r ?? 0) + 0.7152 * f(g ?? 0) + 0.0722 * f(b ?? 0);
        };
        const ratio = (a: string, b: string) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
          return (hi + 0.05) / (lo + 0.05);
        };
        const pairs: [string, string][] = [
          ['.logo-wordmark', '.nav-zone-text'],
          ['.nav-link', '.nav-zone-window'],
        ];
        return Math.min(
          ...pairs.map(([fg, bg]) =>
            ratio(
              getComputedStyle(document.querySelector(fg) as Element).color,
              getComputedStyle(document.querySelector(bg) as Element).backgroundColor,
            ),
          ),
        );
      });
      expect(worst, id).toBeGreaterThanOrEqual(4.5);
    }
  });
});
