import { expect, test, type Page } from '@playwright/test';

/*
 * Phase 14: the building and the text tell the same story.
 * Order: Hero, About (#foundation), Process (#fitout), Work delivered (#completion),
 * Services (#structure), Projects (#envelope), Founder, Contact.
 */
const ORDER = [
  'hero',
  'foundation',
  'fitout',
  'completion',
  'structure',
  'envelope',
  'founder',
  'contact',
];
const NAV_LABELS = ['Principles', 'Process', 'Track record', 'Services', 'Projects', 'Contact'];
const NAV_IDS = ['foundation', 'fitout', 'completion', 'structure', 'envelope', 'contact'];
// foundation 2 (About, then steps 1 to 3), structure 1 (step 4), envelope 1 (step 5),
// fit-out 1 (step 6), completion 2 (plate and dimensions, then lit windows)
const PARTS = 7;
// Build progress at which each step's part is complete; steps 1 and 2 only advance the
// foundation, which step 3 completes
const STEP_END = [null, null, 2 / PARTS, 3 / PARTS, 4 / PARTS, 5 / PARTS];
const PROCESS_STEPS = 6;

async function open(page: Page, id: string) {
  await page.goto('about:blank');
  await page.goto(`/#${id}`);
  await page.waitForTimeout(1600);
}

const windowAttr = (page: Page, name: string) =>
  page.locator('.building-site-window').getAttribute(name);

/** Scroll in steps through the whole page, recording the published build state at each stop. */
async function sampleWholePage(page: Page, step: number) {
  return page.evaluate(async (stepPx) => {
    const lenis = (
      window as unknown as {
        __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
      }
    ).__lenis;
    const go = (y: number) =>
      lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
    const wait = () => new Promise((r) => setTimeout(r, 24));
    const root = document.querySelector<HTMLElement>('.building-site-window');
    if (!root) return [];
    const stepsEls = [...document.querySelectorAll<HTMLElement>('#fitout .process-step-item')];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const out: {
      y: number;
      bp: number;
      parts: number[];
      offsets: number[];
    }[] = [];
    for (let y = 0; y <= max; y += stepPx) {
      go(y);
      await wait();
      out.push({
        y,
        bp: Number(root.dataset.buildProgress),
        parts: (root.dataset.partProgress ?? '').split(',').map(Number),
        offsets: stepsEls.map((el) => {
          const r = el.getBoundingClientRect();
          // Centre of the reading area: the viewport, or (below 1024 px) its upper part, with the
          // building below it
          const share = window.innerWidth < 1024 ? 0.34 : 0.5;
          return r.top + r.height / 2 - window.innerHeight * share;
        }),
      });
    }
    go(0);
    return out;
  }, step);
}

test.describe('Phase 14: section order', () => {
  test('sheets appear in the new story order with unchanged ids', async ({ page }) => {
    await page.goto('/');
    const ids = await page
      .locator('.sheet-stack > .sheet')
      .evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(ORDER);
  });

  test('sitemap-style internal links resolve to existing sections', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('a[href^="#"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    for (const href of hrefs) {
      const id = href.slice(1);
      if (!id || id === 'main' || id.startsWith('project-')) continue;
      expect(await page.locator(`[id="${id}"]`).count(), href).toBeGreaterThan(0);
    }
  });
});

test.describe('Phase 14: stage sync', () => {
  test('rules 1 to 3: text-centred completion, sequential parts, never idle', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
      'Scrubbing is replaced by state swaps under reduced motion',
    );
    test.setTimeout(180_000);
    await open(page, 'hero');
    const samples = await sampleWholePage(page, 40);
    expect(samples.length).toBeGreaterThan(50);

    // Rule 2: a part never starts before the previous one is complete
    for (const s of samples) {
      for (let k = 1; k < PARTS; k++) {
        if ((s.parts[k] ?? 0) > 0.002) {
          expect(s.parts[k - 1], `y=${s.y} part ${k}`).toBeGreaterThanOrEqual(0.998);
        }
      }
    }

    // Rule 1: step i finishes when its text is centred, never before
    let sawCentred = 0;
    for (let i = 0; i < PROCESS_STEPS; i++) {
      const end = STEP_END[i] ?? null;
      const closest = samples.reduce((a, b) =>
        Math.abs(b.offsets[i] ?? 1e9) < Math.abs(a.offsets[i] ?? 1e9) ? b : a,
      );
      if (Math.abs(closest.offsets[i] ?? 1e9) > 40) continue; // sheet ends before it can centre
      sawCentred++;
      if (end === null) {
        // Pre-construction steps: the foundation is under way but not yet complete
        expect(closest.bp, `step ${i + 1} advances the foundation`).toBeGreaterThan(1 / PARTS);
        expect(closest.bp, `step ${i + 1} leaves it unfinished`).toBeLessThan(2 / PARTS);
        continue;
      }
      for (const s of samples) {
        if ((s.offsets[i] ?? 0) > 60) {
          expect(s.bp, `step ${i + 1} at y=${s.y}`).toBeLessThan(end - 0.0005);
        }
      }
      expect(closest.bp, `step ${i + 1} complete when centred`).toBeGreaterThanOrEqual(end - 0.03);
    }
    expect(sawCentred, 'every step can reach the centre').toBe(PROCESS_STEPS);

    // Rule 3: while a mapped section scrolls, the build moves at least once per step-height
    const stepHeight = await page
      .locator('#fitout .process-step-item')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    const active = samples.filter((s) => s.bp > 0.001 && s.bp < 0.999);
    let lastMoveY = active[0]?.y ?? 0;
    let lastBp = active[0]?.bp ?? 0;
    let worstGap = 0;
    for (const s of active) {
      if (Math.abs(s.bp - lastBp) > 0.0005) {
        lastBp = s.bp;
        lastMoveY = s.y;
      }
      worstGap = Math.max(worstGap, s.y - lastMoveY);
    }
    expect(worstGap, 'scroll distance with a static building').toBeLessThanOrEqual(stepHeight);
  });

  test('rule 4: reverse scrolling un-builds exactly and anchors land on the same state', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
      'Scrubbing is replaced by state swaps under reduced motion',
    );
    test.setTimeout(120_000);
    await open(page, 'hero');
    const down = await sampleWholePage(page, 200);
    // Walk the same positions upwards
    const up = await page.evaluate(
      async (ys) => {
        const lenis = (
          window as unknown as {
            __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
          }
        ).__lenis;
        const root = document.querySelector<HTMLElement>('.building-site-window');
        const out: number[] = [];
        const max = document.documentElement.scrollHeight - window.innerHeight;
        lenis?.scrollTo(max, { immediate: true });
        await new Promise((r) => setTimeout(r, 60));
        for (const y of [...ys].reverse()) {
          lenis?.scrollTo(y, { immediate: true });
          await new Promise((r) => setTimeout(r, 30));
          out.push(Number(root?.dataset.buildProgress));
        }
        return out.reverse();
      },
      down.map((s) => s.y),
    );
    down.forEach((s, i) => {
      expect(up[i], `y=${s.y}`).toBeCloseTo(s.bp, 2);
    });
    expect(up[0]).toBe(0);

    // Anchor jump to the Process section lands where scrolling there does
    await open(page, 'fitout');
    const jumpY = await page.evaluate(() => window.scrollY);
    const jumpBp = Number(await windowAttr(page, 'data-build-progress'));
    await open(page, 'hero');
    const scrolledBp = await page.evaluate(async (y) => {
      const lenis = (
        window as unknown as {
          __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
        }
      ).__lenis;
      for (let v = 0; v <= y; v += 150) {
        lenis?.scrollTo(v, { immediate: true });
        await new Promise((r) => setTimeout(r, 16));
      }
      lenis?.scrollTo(y, { immediate: true });
      await new Promise((r) => setTimeout(r, 80));
      return Number(
        document.querySelector<HTMLElement>('.building-site-window')?.dataset.buildProgress,
      );
    }, jumpY);
    expect(scrolledBp).toBeCloseTo(jumpBp, 1);
  });

  test('anchors after the process show the finished building', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
      'See reduced motion',
    );
    for (const id of ['structure', 'envelope', 'founder']) {
      await open(page, id);
      expect(Number(await windowAttr(page, 'data-build-progress')), id).toBeGreaterThanOrEqual(
        0.999,
      );
    }
    await open(page, 'foundation');
    // The morph is complete when About is at the top, and the foundation is only beginning
    expect(await page.evaluate(() => document.documentElement.dataset.morphProgress)).toBe('1.000');
    const bp = Number(await windowAttr(page, 'data-build-progress'));
    expect(bp).toBeGreaterThanOrEqual(0);
    expect(bp).toBeLessThanOrEqual(1 / PARTS + 0.001);
  });
  // The hero-to-window hand-off is now the Phase 14D morph (see phase-14d.spec.ts)
});

test.describe('Phase 14: reduced motion', () => {
  test('swaps state on entry with no scrub, and the finished building is the end state', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.use?.contextOptions?.reducedMotion !== 'reduce',
      'Reduced-motion project only',
    );
    await open(page, 'foundation');
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-static', 'true');
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-stage', 'foundation');
    await open(page, 'completion');
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-stage', 'completion');
    await open(page, 'envelope');
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-stage', 'completion');
    // No scrubbed transforms are applied to the building
    const scrubbed = await page.evaluate(
      () => document.querySelectorAll('.building-svg [style*="transform"]').length,
    );
    expect(scrubbed).toBe(0);
    // Entering the process swaps through its steps
    await open(page, 'fitout');
    const stage = await windowAttr(page, 'data-stage');
    expect(['foundation', 'structure', 'envelope', 'fitout']).toContain(stage);
  });
});

test.describe('Phase 14: projects live preview', () => {
  test('default is the finished building; hovering or focusing a row swaps the drawing', async ({
    page,
    isMobile,
  }, testInfo) => {
    const reduced = testInfo.project.use?.contextOptions?.reducedMotion === 'reduce';
    const drawingRequests: string[] = [];
    page.on('request', (r) => {
      if (/\/drawings-[\w-]+\.js/.test(r.url())) drawingRequests.push(r.url());
    });
    await open(page, 'envelope');
    const win = page.locator('.building-site-window');
    await expect(win).not.toHaveAttribute('data-preview', 'true');
    expect(await page.locator('.building-preview svg').count()).toBe(0);
    expect(drawingRequests).toEqual([]);

    const rows = page.locator('.projects-row-btn');
    expect(await rows.count()).toBe(6);
    const row = rows.nth(2);
    await row.scrollIntoViewIfNeeded();
    if (isMobile) await row.focus();
    else await row.hover();
    await expect(win).toHaveAttribute('data-preview', 'true');
    await expect(
      page.locator('.building-preview svg[data-drawing="industrial-warehouse"]'),
    ).toBeAttached();
    expect(drawingRequests.length).toBe(1);

    // Active row: aria-current, 3px ink left rule, tint
    await expect(row).toHaveAttribute('aria-current', 'true');
    const style = await row.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        w: cs.borderLeftWidth,
        c: cs.borderLeftColor,
        bg: getComputedStyle(el.closest('li') as Element).backgroundColor,
        label: el.textContent,
      };
    });
    expect(style.w).toBe('3px');
    // Ink on the sheet: formwork on desktop, limewash over the dark background below 1024 px
    expect(style.c).toBe(isMobile ? 'rgb(233, 231, 223)' : 'rgb(35, 38, 34)');
    expect(await page.locator('.projects-row-btn[aria-current="true"]').count()).toBe(1);

    // Opacity-only cross-fade: no transform on the preview or the building
    const props = await page
      .locator('.building-preview')
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    // Reduced motion swaps the drawing instantly: no transition at all
    expect(props).toBe(reduced ? 'none' : 'opacity');
  });

  test('each of the six drawings is a monochrome inline SVG with no amber', async ({ page }) => {
    await open(page, 'envelope');
    const rows = page.locator('.projects-row-btn');
    for (let i = 0; i < 6; i++) {
      await rows.nth(i).scrollIntoViewIfNeeded();
      await rows.nth(i).focus();
      await page.waitForTimeout(250);
    }
    const report = await page.evaluate(() => {
      const out: { slug: string; shapes: number; colours: string[] }[] = [];
      document
        .querySelectorAll<SVGElement>('.building-preview svg[data-drawing]')
        .forEach((svg) => {
          const colours = new Set<string>();
          svg.querySelectorAll('*').forEach((el) => {
            const cs = getComputedStyle(el);
            if (cs.fill && cs.fill !== 'none') colours.add(cs.fill);
            if (cs.stroke && cs.stroke !== 'none') colours.add(cs.stroke);
          });
          out.push({
            slug: svg.getAttribute('data-drawing') ?? '',
            shapes: svg.querySelectorAll('rect,line,path,circle').length,
            colours: [...colours],
          });
        });
      return out;
    });
    expect(report.length).toBeGreaterThanOrEqual(1);
    for (const r of report) {
      expect(r.shapes, r.slug).toBeGreaterThan(10);
      expect(r.colours.join(' '), r.slug).not.toContain('227, 179, 65');
    }
  });

  test('leaving the register returns to the finished building', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hover only');
    await open(page, 'envelope');
    const row = page.locator('.projects-row-btn').nth(1);
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await expect(page.locator('.building-site-window')).toHaveAttribute('data-preview', 'true');
    await page.mouse.move(1000, 400);
    await page.locator('.projects-row-btn').nth(1).blur();
    await expect(page.locator('.building-site-window')).not.toHaveAttribute('data-preview', 'true');
  });
});

test.describe('Phase 14: project drawer', () => {
  test('desktop: covers the right window region only, list stays visible and inert', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop drawer');
    await open(page, 'project-residential-enclave');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await page.locator('.project-overlay-sheet').boundingBox();
    const vw = page.viewportSize()?.width ?? 0;
    expect(box?.x ?? 0).toBeGreaterThanOrEqual((vw * 5) / 12 - 2);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThanOrEqual(vw - 2);
    await expect(page.locator('#main')).toHaveAttribute('inert', '');
    await expect(page.locator('.projects-register')).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  });

  test('mobile: full-screen bottom sheet', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phones only');
    await open(page, 'project-residential-enclave');
    const box = await page.locator('.project-overlay-sheet').boundingBox();
    const vp = page.viewportSize();
    expect(box?.x ?? 1).toBeLessThanOrEqual(1);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual((vp?.width ?? 0) - 2);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual((vp?.height ?? 0) - 2);
  });

  test('Next updates the left row and scrolls it into view; Escape returns focus', async ({
    page,
  }) => {
    await open(page, 'project-residential-enclave');
    await page.getByRole('button', { name: /^Next:/ }).click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => location.hash)).toBe('#project-commercial-tower');
    const row = page.locator('[data-project-id="project-commercial-tower"] .projects-row-btn');
    await expect(row).toHaveAttribute('aria-current', 'true');
    const inView = await row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    });
    expect(inView).toBe(true);
    await page.getByRole('button', { name: /^Previous:/ }).click();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => location.hash)).toBe('#project-residential-enclave');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Phase 14: header section indicator', () => {
  const clear = (a: DOMRect | null, b: DOMRect | null) =>
    !a || !b || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;

  for (const width of [1280, 1440, 1904]) {
    test(`links at ${width}: order, current marked, sizes, no collisions`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop widths');
      await page.setViewportSize({ width, height: 900 });
      await open(page, 'fitout');
      const links = page.locator('.nav-sections-link');
      await expect(links).toHaveText(NAV_LABELS);
      await expect(page.locator('.nav-sections-link[aria-current="true"]')).toHaveText('Process');
      await expect(page.locator('.nav-sections-toggle')).toBeHidden();
      const metrics = await links.evaluateAll((els) =>
        els.map((e) => {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return {
            h: r.height,
            size: parseFloat(cs.fontSize),
            family: cs.fontFamily,
            caps: cs.textTransform,
          };
        }),
      );
      for (const m of metrics) {
        expect(m.h).toBeGreaterThanOrEqual(44);
        expect(m.size).toBeGreaterThanOrEqual(15);
        expect(m.family).toContain('Newsreader');
        expect(m.caps).toBe('none');
      }
      const underline = await page
        .locator('.nav-sections-link[aria-current="true"]')
        .evaluate((e) => getComputedStyle(e).textDecorationThickness);
      expect(underline).toBe('2px');
      const boxes = await page.evaluate(() => {
        const rect = (sel: string) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
        return {
          logo: rect('.nav-zone-text .logo'),
          nav: rect('.nav-sections'),
          enquire: rect('.nav-list .nav-link'),
        };
      });
      expect(clear(boxes.logo, boxes.nav)).toBe(true);
      expect(clear(boxes.nav, boxes.enquire)).toBe(true);
    });
  }

  test('clicking a link scrolls to its section and the indicator follows', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop links');
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, 'hero');
    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await page.waitForTimeout(2500);
    const top = await page.locator('#structure').evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(80);
    await expect(page.locator('.nav-sections-link[aria-current="true"]')).toHaveText('Services');
    expect(await page.evaluate(() => location.hash)).toBe('#structure');
    expect(await page.locator('.nav-sections-link[aria-current="true"]').count()).toBe(1);
    void NAV_IDS;
  });

  for (const width of [390, 768, 1024]) {
    test(`compact button and dialog at ${width}`, async ({ page, isMobile }) => {
      test.skip(isMobile && width !== 390, 'One phone width on the phone project');
      await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
      await open(page, 'envelope');
      const toggle = page.locator('.nav-sections-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveText('Projects');
      await expect(page.locator('.nav-sections-link').first()).toBeHidden();
      const boxes = await page.evaluate(() => {
        const rect = (sel: string) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
        return {
          logo: rect('.nav-zone-text .logo'),
          toggle: rect('.nav-sections-toggle'),
          enquire: rect('.nav-list .nav-link'),
        };
      });
      expect(clear(boxes.logo, boxes.toggle)).toBe(true);
      expect(clear(boxes.toggle, boxes.enquire)).toBe(true);
      expect(boxes.toggle?.height ?? 0).toBeGreaterThanOrEqual(44);

      await toggle.click();
      const dialog = page.getByRole('dialog', { name: 'Sections' });
      await expect(dialog).toBeVisible();
      const dbox = await dialog.boundingBox();
      expect(dbox?.width ?? 0).toBeGreaterThanOrEqual(width - 1);
      const items = dialog.locator('.nav-sections-dialog-link');
      await expect(items).toHaveText(NAV_LABELS);
      await expect(dialog.locator('[aria-current="true"]')).toHaveText('Projects');
      for (const h of await items.evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().height),
      )) {
        expect(h).toBeGreaterThanOrEqual(44);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(toggle).toBeFocused();

      await toggle.click();
      await dialog.getByRole('link', { name: 'Services' }).click();
      await expect(dialog).toBeHidden();
      await page.waitForTimeout(2500);
      expect(await page.evaluate(() => location.hash)).toBe('#structure');
      await expect(toggle).toHaveText('Services');
    });
  }
});

test.describe('Phase 14: form focus', () => {
  test('inputs get a 2px ink outline with 2px offset and a thicker bottom border, no amber', async ({
    page,
  }) => {
    await open(page, 'contact');
    const field = page.locator('.contact-input').first();
    await field.focus();
    const s = await field.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        ow: cs.outlineWidth,
        os: cs.outlineStyle,
        oo: cs.outlineOffset,
        oc: cs.outlineColor,
        bb: cs.borderBottomWidth,
        bt: cs.borderTopWidth,
        bc: cs.borderBottomColor,
        bg: cs.backgroundColor,
      };
    });
    expect(s.ow).toBe('2px');
    expect(s.os).toBe('solid');
    expect(s.oo).toBe('2px');
    expect(parseFloat(s.bb)).toBeGreaterThan(parseFloat(s.bt));
    const lum = (rgb: string) => {
      const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number) as number[];
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r ?? 0) + 0.7152 * f(g ?? 0) + 0.0722 * f(b ?? 0);
    };
    const [hi, lo] = [lum(s.oc), lum(s.bg)].sort((x, y) => y - x) as [number, number];
    expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(3);
    expect(s.oc).not.toBe('rgb(227, 179, 65)');
    expect(s.bc).not.toBe('rgb(227, 179, 65)');
  });
});

test.describe('Phase 14: placeholders', () => {
  test('photo placeholders are quiet frames with crop marks and one sentence-case line', async ({
    page,
  }) => {
    await open(page, 'project-residential-enclave');
    const slots = page.locator('.project-overlay-gallery-slot .photo-slot');
    expect(await slots.count()).toBeGreaterThan(0);
    for (const slot of await slots.all()) {
      expect(await slot.locator('.photo-crop').count()).toBe(4);
      const note = slot.locator('.photo-slot-note');
      const text = (await note.textContent()) ?? '';
      // One sentence-case, project-specific line; the frame is outline only (no fill)
      expect(text).toMatch(/^[A-Z][a-z]/);
      expect(text).not.toMatch(/\/\/|to come/);
      expect(await slot.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
        'rgba(0, 0, 0, 0)',
      );
      expect(await slot.getAttribute('aria-label')).toContain('Site photo to come');
      expect(await note.evaluate((e) => getComputedStyle(e).textTransform)).toBe('none');
    }
    const labels = await page
      .locator('.project-overlay-gallery-slot .photo-slot-note')
      .allTextContents();
    expect(new Set(labels).size).toBe(labels.length); // captions are project-specific
  });
});
