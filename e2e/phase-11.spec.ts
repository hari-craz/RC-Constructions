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
        // The drawn building spans at least 70% of the window width. The ground slab is drawn across About and process steps 1 to 3 (partly built at those anchors); measure where it is complete
        if (id === 'foundation' || id === 'fitout') continue;
        const ratio = await page.evaluate(() => {
          const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
          const roof = document.querySelector('.b-ground-slab')?.getBoundingClientRect();
          return win && roof ? roof.width / win.width : 0;
        });
        expect(ratio, `${viewport.width}: building/window width`).toBeGreaterThanOrEqual(0.7);
      }
    }
  });

  test('mobile: a full-screen fixed layer, the building at least 80% of its width, low in it', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile layer');
    await open(page, 'structure');
    const box = await page.locator('.building-site-window').boundingBox();
    const size = page.viewportSize() ?? { width: 0, height: 0 };
    expect(box?.x ?? -1).toBe(0);
    expect(box?.y ?? -1).toBe(0);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(size.width - 1);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(size.height * 0.9);
    // The drawn building spans at least 80% of the screen width and is centred in the screen
    const m = await page.evaluate(() => {
      const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
      const slab = document.querySelector('.b-ground-slab')?.getBoundingClientRect();
      return win && slab ? { ratio: slab.width / win.width, top: slab.top / win.height } : null;
    });
    expect(m?.ratio ?? 0).toBeGreaterThanOrEqual(0.8);
    expect(m?.top ?? 0).toBeGreaterThan(0.4);
    expect(m?.top ?? 1).toBeLessThan(0.75);
  });

  test('each stage is complete where its text ends, lit windows are flat amber, and scrolling up un-builds', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.use?.contextOptions?.reducedMotion === 'reduce', 'Motion only');
    test.setTimeout(120_000);
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

    // Scroll down from the top of About until build part k (see data-part-progress) is complete
    const untilPartComplete = (k: number, from = 0) =>
      page.evaluate(
        async ([part, start]) => {
          const lenis = (
            window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }
          ).__lenis;
          const root = document.querySelector<HTMLElement>('.building-site-window');
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const read = async (y: number) => {
            lenis?.scrollTo(y, { immediate: true });
            await new Promise((r) => setTimeout(r, 40));
            return (root?.dataset.partProgress ?? '').split(',').map(Number);
          };
          for (let y = start ?? 0; y <= max; y += 20) {
            if (((await read(y))[part] ?? 0) < 0.98) continue;
            // Back off so the next part has not started (progress is published a frame late)
            let at = y;
            while (at > 0) {
              const parts = await read(at);
              if ((parts[part] ?? 0) >= 0.98 && (parts[part + 1] ?? 0) <= 0.02) return at;
              at -= 2;
            }
            return at;
          }
          return -1;
        },
        [k, from] as const,
      );

    // Everything is complete once Work delivered has run its course (Services is beside it)
    await open(page, 'structure');
    const ref = await measure();
    expect(ref.paneFills).toHaveLength(15);
    // Below 1024 px the finished building is lit in a flat muted amber once Work delivered is behind
    const narrow = (page.viewportSize()?.width ?? 0) < 1024;
    expect(ref.paneFills.every((f) => (narrow ? f !== 'rgb(44, 48, 43)' : f === AMBER))).toBe(true);
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

    await open(page, 'hero');
    let at = await untilPartComplete(1); // foundation (About, then steps 1 to 3)
    expect(at).toBeGreaterThan(0);
    let m = await measure();
    expect(m.footing).toBeGreaterThan(ref.footing * 0.95);
    expect(m.col).toBeLessThan(ref.col * 0.05);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);

    at = await untilPartComplete(2, Math.max(0, at - 40));
    expect(at).toBeGreaterThan(0); // structure (Process step 4)
    m = await measure();
    expect(m.col).toBeGreaterThan(ref.col * 0.95);
    expect(m.wall).toBeLessThan(ref.wall * 0.15);
    // The next part starts the moment this one ends, so allow the first 20 px of it
    expect(Math.max(...m.frameOpacity)).toBeLessThan(0.25);

    at = await untilPartComplete(3, Math.max(0, at - 40));
    expect(at).toBeGreaterThan(0); // envelope (step 5)
    m = await measure();
    expect(m.wall).toBeGreaterThan(ref.wall * 0.95);
    // The next part starts the moment this one ends, so allow the first 20 px of it
    expect(Math.max(...m.frameOpacity)).toBeLessThan(0.25);

    at = await untilPartComplete(4, Math.max(0, at - 40));
    expect(at).toBeGreaterThan(0); // fit-out (step 6)
    m = await measure();
    expect(Math.min(...m.frameOpacity)).toBeGreaterThan(0.9);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);

    // Reverse: from the finished building back to the top of the page
    await open(page, 'structure');
    await page.evaluate(() => {
      const lenis = (
        window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }
      ).__lenis;
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    m = await measure();
    expect(m.wall).toBeLessThan(ref.wall * 0.05);
    expect(m.paneFills.some((f) => f === AMBER)).toBe(false);
  });

  test('reduced motion shows the finished, lit building where Work delivered is the stage', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.use?.contextOptions?.reducedMotion !== 'reduce', 'Reduced only');
    await open(page, 'completion');
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
    // Below 1024 px the drawing is a deliberate ghost behind the text (Phase 14D): its strokes are
    // dark enough that limewash text keeps 4.5:1 over them, which phase-14d.spec.ts samples instead
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'Muted background variant below 1024 px');
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
          '.btn, .contact-submit-btn, .error-boundary-reload-btn, .b-pane, .b-dim, .b-dim-label, .hm-dim, .hm-dim-label, .hm-dim-label *, .loading-dimension-line, .loading-dimension-line *';
        const out: string[] = [];
        document.querySelectorAll<HTMLElement | SVGElement>('body *').forEach((el) => {
          if (el.matches(allowed) || el.closest('.hm-dim-label, .loading-dimension-line')) return;
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

  test('projects: no grey slot above the register; the active row drives the window preview', async ({
    page,
  }) => {
    await open(page, 'envelope');
    // The old grey preview slot is gone: the right-hand window is the preview
    expect(await page.locator('.projects-preview-slot').count()).toBe(0);
    const row = page.locator('.projects-row-btn').nth(2);
    await row.focus();
    await expect(page.locator('.projects-row-item').nth(2)).toHaveClass(/is-active/);
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-preview', 'true');
    // The register starts directly under the heading block
    const head = await page.locator('.projects-header').boundingBox();
    const r = await page.locator('.projects-register').boundingBox();
    expect(head && r && head.y + head.height <= r.y).toBe(true);
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
