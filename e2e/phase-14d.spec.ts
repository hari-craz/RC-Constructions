import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/*
 * Phase 14D: a maximum-detail house, the morph from the hero house into the building, and the
 * full-bleed background below 1024 px.
 */
const isReduced = (testInfo: TestInfo) =>
  testInfo.project.use?.contextOptions?.reducedMotion === 'reduce';

async function openHero(page: Page) {
  await page.goto('/');
  await page.locator('.hero-model-widget').waitFor();
}

const widget = (page: Page) =>
  page.locator('.hero-model-widget').evaluate((el) => {
    const d = (el as HTMLElement).dataset;
    return {
      built: Number(d.built),
      dissolve: Number(d.dissolve),
      host: d.host,
      plinth: Number(d.plinth),
      inert: (el as HTMLElement).inert,
    };
  });

const morphValue = (page: Page) =>
  page.evaluate(() => Number(document.documentElement.dataset.morphProgress));

const drawnFaces = (page: Page) =>
  page
    .locator('.hm-face')
    .evaluateAll((els) =>
      els
        .filter((e) => (e as SVGElement).style.display !== 'none')
        .reduce((n, e) => n + (e.getAttribute('d')?.match(/M/g)?.length ?? 0), 0),
    );

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

/** Walk down to a scroll position in small steps so every scrubbed part sees steady progress. */
async function walkTo(page: Page, target: number) {
  const from = await page.evaluate(() => window.scrollY);
  const step = 80 * Math.sign(target - from || 1);
  for (let y = from; Math.abs(target - y) > 80; y += step) {
    await scrollTo(page, y);
    await page.waitForTimeout(12);
  }
  await scrollTo(page, target);
  // Wait on real signals, not a timeout: the published morph value has caught up with the scroll
  // position, and two frames have been drawn since (the house is redrawn from the morph)
  await page.waitForFunction((y) => {
    const hero = document.getElementById('hero')?.offsetHeight ?? 0;
    const vh = window.innerHeight;
    const m = Math.max(0, Math.min(1, (y - (hero - vh)) / vh));
    return Math.abs(Number(document.documentElement.dataset.morphProgress) - m) < 0.01;
  }, target);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.waitForTimeout(260);
}

/** Scroll position at which the morph has the given value (0 to 1 and beyond for scroll past it). */
const atMorph = (page: Page, m: number) =>
  page.evaluate((v) => {
    const hero = document.getElementById('hero')?.offsetHeight ?? 0;
    return Math.round(hero - window.innerHeight + v * window.innerHeight);
  }, m);

async function stopAuto(page: Page) {
  const toggle = page.getByRole('switch', { name: 'Auto-rotate' });
  if ((await toggle.getAttribute('aria-checked')) === 'true') await toggle.click();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.waitForTimeout(500);
}

const lum = (rgb: number[]) => {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(rgb[0] ?? 0) + 0.7152 * f(rgb[1] ?? 0) + 0.0722 * f(rgb[2] ?? 0);
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

test.describe('Phase 14D, part A: the detailed house', () => {
  test('at rest it shows all four detail groups: massing, openings, surfaces, porch and ground', async ({
    page,
  }) => {
    await openHero(page);
    await page.waitForTimeout(4800);
    // At rest: the house is not turning, so no level of detail is dropped
    await stopAuto(page);
    await page.waitForTimeout(500);
    expect(await drawnFaces(page)).toBeGreaterThan(200);
    // Massing and roofs, openings (frames, glass, doors, mullions), surfaces (hairlines, stone)
    // and the porch and ground (slab steps, stone plinth, ground outline)
    for (const kind of [
      'wall',
      'roof',
      'trim',
      'glass',
      'door',
      'muntin',
      'line',
      'stone',
      'slab',
    ]) {
      expect(await page.locator(`.hm-${kind}`).count(), kind).toBeGreaterThan(0);
    }
    expect(
      await page.locator('.hm-ground').evaluate((el) => (el.getAttribute('d') ?? '').length),
    ).toBeGreaterThan(40);
    expect(await widget(page).then((w) => w.built)).toBe(1);
  });

  test('it is raised in stages on first load, then starts to turn', async ({ page }, testInfo) => {
    test.skip(isReduced(testInfo), 'Reduced motion shows the finished house at once');
    test.setTimeout(30_000);
    await openHero(page);
    await page.waitForTimeout(500);
    const early = await widget(page);
    const earlyFaces = await drawnFaces(page);
    expect(early.built).toBeGreaterThan(0);
    expect(early.built).toBeLessThan(0.5);
    await page.waitForTimeout(1200);
    const mid = await widget(page);
    expect(mid.built).toBeGreaterThan(early.built);
    expect(await drawnFaces(page)).toBeGreaterThan(earlyFaces);
    await page.waitForTimeout(2600);
    expect((await widget(page)).built).toBe(1);
  });

  test('reduced motion: the finished house at once, nothing raised or turned', async ({
    page,
  }, testInfo) => {
    test.skip(!isReduced(testInfo), 'Reduced-motion project only');
    await openHero(page);
    await page.waitForTimeout(300);
    expect((await widget(page)).built).toBe(1);
  });

  test('on a phone, surface hairlines are dropped while the house turns and return when it stops', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile || isReduced(testInfo), 'Phones, motion only');
    await openHero(page);
    await page.waitForTimeout(4800);
    await stopAuto(page);
    const lines = () =>
      page
        .locator('.hm-line')
        .evaluateAll(
          (els) =>
            els.filter((e) => (e as SVGElement).style.display !== 'none' && e.getAttribute('d'))
              .length,
        );
    expect(await lines()).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Turn right' }).click();
    await page.waitForTimeout(60);
    expect(await lines(), 'while turning').toBe(0);
    await page.waitForTimeout(700);
    expect(await lines(), 'after it stops').toBeGreaterThan(0);
  });
});

test.describe('Phase 14D, part B: the morph', () => {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    test(`${vp.width}x${vp.height}: scroll-scrubbed, dissolves top first, and reverses exactly`, async ({
      page,
    }, testInfo) => {
      test.skip(isReduced(testInfo), 'No morph under reduced motion');
      test.setTimeout(90_000);
      await page.setViewportSize(vp);
      await openHero(page);
      await page.waitForTimeout(4800);
      await stopAuto(page);

      const snap = async () => {
        const w = await widget(page);
        const faces = await page.locator('.hm-face:not([style*="display: none"])').count();
        const kinds = await page
          .locator('.hm-face:not([style*="display: none"])')
          .evaluateAll((els) =>
            [...new Set(els.map((e) => (e.getAttribute('class') ?? '').split(' ')[1]))].sort(),
          );
        // Roof pieces that are part way through dissolving (they carry an opacity)
        const fadingRoofs = await page
          .locator('.hm-face.hm-roof[opacity]:not([style*="display: none"])')
          .count();
        return { m: await morphValue(page), ...w, faces, kinds, fadingRoofs };
      };

      const down: Record<string, Awaited<ReturnType<typeof snap>>> = {};
      for (const m of [0, 0.2, 0.35, 0.55, 0.7, 0.85, 1]) {
        await walkTo(page, await atMorph(page, m));
        down[String(m)] = await snap();
      }
      // The morph value follows the scroll, and the dissolve only starts after the house has landed
      expect(down['0.35']?.m ?? 0).toBeCloseTo(0.35, 1);
      expect(down['0.35']?.dissolve).toBe(0);
      expect(down['0.55']?.dissolve ?? 0).toBeGreaterThan(0);
      expect(down['0.85']?.dissolve ?? 0).toBeGreaterThan(down['0.55']?.dissolve ?? 1);
      expect(down['1']?.dissolve).toBe(1);
      // Piece by piece, top first: the roofs go before the ground storey and the door
      expect(down['0.55']?.kinds).toContain('hm-door');
      expect(down['0.55']?.fadingRoofs ?? 0).toBeGreaterThan(0);
      // (The porch roof belongs to the porch, which goes later, so a roof slope can still be seen
      // from the front by perspective; the house's own roofs are gone.)
      expect(down['0.7']?.fadingRoofs).toBe(0);
      // At the end only the plinth is left
      const end = down['1'];
      expect(end?.kinds.every((k) => k === 'hm-stone' || k === 'hm-slab' || k === 'hm-line')).toBe(
        true,
      );
      expect(end?.faces ?? 0).toBeGreaterThan(0);
      // The house stands in the hero first and in the fixed layer once the morph has begun
      expect(down['0']?.host).toBe(vp.width < 1024 ? 'layer' : 'hero');
      expect(down['0.2']?.host).toBe('layer');
      // The foundation has not started before the dissolve is complete
      for (const m of ['0', '0.35', '0.7', '0.85']) {
        const progress = await (async () => {
          await walkTo(page, await atMorph(page, Number(m)));
          return Number(
            await page.locator('.building-site-window').getAttribute('data-build-progress'),
          );
        })();
        expect(progress, `foundation at morph ${m}`).toBe(0);
      }

      // Back up: every state is exactly what it was on the way down
      await walkTo(page, await atMorph(page, 1));
      for (const m of [0.85, 0.7, 0.55, 0.35, 0.2, 0]) {
        await walkTo(page, await atMorph(page, m));
        const again = await snap();
        const before = down[String(m)];
        expect(again.dissolve, `dissolve at ${m}`).toBeCloseTo(before?.dissolve ?? -1, 2);
        expect(again.faces, `faces at ${m}`).toBe(before?.faces);
        expect(again.kinds, `kinds at ${m}`).toEqual(before?.kinds);
        expect(again.host).toBe(before?.host);
      }
    });
  }

  test('the plinth stands on the building ground line and across its footprint (desktop)', async ({
    page,
    isMobile,
    browserName,
  }, testInfo) => {
    test.skip(isReduced(testInfo) || isMobile, 'Desktop motion only');
    test.skip(
      browserName !== 'chromium',
      'Client rects of shapes scrubbed to zero height differ in Firefox; the landing maths is unit tested',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHero(page);
    await page.waitForTimeout(4800);
    await stopAuto(page);
    await walkTo(page, await atMorph(page, 1));
    const m = await page.evaluate(() => {
      const stones = [...document.querySelectorAll('.stage-house .hm-stone')]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0);
      const line = document.querySelector('.b-ground-line')?.getBoundingClientRect();
      // The footprint is the frame: the first and last pedestal stubs span it (their height is
      // still scrubbed to nothing here, but their width is where the frame stands)
      const stubs = [...document.querySelectorAll('.b-stub')].map((e) => e.getBoundingClientRect());
      const first = stubs[0];
      const last = stubs[stubs.length - 1];
      return {
        left: Math.min(...stones.map((r) => r.left)),
        right: Math.max(...stones.map((r) => r.right)),
        bottom: Math.max(...stones.map((r) => r.bottom)),
        ground: line ? line.top + line.height / 2 : -1,
        slabLeft: first?.left ?? -1,
        slabRight: (last?.right ?? -1) + 10 * ((last?.width ?? 0) / 80),
      };
    });
    expect(Math.abs(m.bottom - m.ground), 'plinth bottom vs ground line').toBeLessThanOrEqual(3);
    expect(Math.abs(m.left - m.slabLeft), 'plinth left vs footprint').toBeLessThanOrEqual(12);
    expect(Math.abs(m.right - m.slabRight), 'plinth right vs footprint').toBeLessThanOrEqual(12);
  });

  test('anchor jumps land on the right state: house gone after the hero, none of it left behind', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'See reduced motion');
    for (const id of ['envelope', 'completion', 'structure']) {
      await page.goto('about:blank');
      await page.goto(`/#${id}`);
      await page.waitForTimeout(1800);
      expect(await morphValue(page), id).toBe(1);
      const visible = await page.evaluate(() => {
        const host = document.querySelector('.hero-model-widget')?.getAttribute('data-host');
        const svg = host === 'layer' ? '.stage-house' : '.hero-model-stage .hm-svg';
        const el = document.querySelector<SVGElement>(svg);
        return el ? getComputedStyle(el).display !== 'none' : false;
      });
      expect(visible, `${id}: the house is gone`).toBe(false);
    }
    // And a jump to About lands with the morph complete and the foundation just beginning
    await page.goto('about:blank');
    await page.goto('/#foundation');
    await page.waitForTimeout(1800);
    expect(await morphValue(page)).toBe(1);
    expect((await widget(page)).dissolve).toBe(1);
  });

  test('the controls fade first, and the house can no longer be handled once the hero is behind', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'See reduced motion');
    await openHero(page);
    await page.waitForTimeout(1500);
    expect((await widget(page)).inert).toBe(false);
    await walkTo(page, await atMorph(page, 0.5));
    expect((await widget(page)).inert).toBe(true);
    await walkTo(page, 0);
    await page.waitForTimeout(300);
    expect((await widget(page)).inert).toBe(false);
  });

  test('reduced motion: no morph, the house swaps for the building when the hero has left', async ({
    page,
  }, testInfo) => {
    test.skip(!isReduced(testInfo), 'Reduced-motion project only');
    await openHero(page);
    await page.waitForTimeout(800);
    const heroH = await page.evaluate(() => document.getElementById('hero')?.offsetHeight ?? 0);
    await scrollTo(page, Math.round(heroH * 0.6));
    await page.waitForTimeout(300);
    expect(await morphValue(page)).toBe(0);
    expect(await page.locator('.hm-face').count()).toBeGreaterThan(20);
    await scrollTo(page, heroH + 10);
    await page.waitForTimeout(300);
    expect(await morphValue(page)).toBe(1);
    const shown = await page.evaluate(() => {
      const host = document.querySelector('.hero-model-widget')?.getAttribute('data-host');
      const el = document.querySelector<SVGElement>(
        host === 'layer' ? '.stage-house' : '.hero-model-stage .hm-svg',
      );
      return el ? getComputedStyle(el).display !== 'none' : false;
    });
    expect(shown).toBe(false);
  });
});

test.describe('Phase 14D, part C: the full-bleed background below 1024 px', () => {
  for (const vp of [
    { width: 390, height: 844 },
    { width: 360, height: 640 },
    { width: 768, height: 1024 },
  ]) {
    test(`${vp.width}x${vp.height}: the house is the hero background, the building fills the screen behind the text`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(vp);
      await openHero(page);
      await page.waitForTimeout(4800);
      const m = await page.evaluate(() => {
        const rect = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();
        const house = rect('.stage-house');
        const head = rect('.hero-headline');
        const faces = [...document.querySelectorAll('.stage-house .hm-face')]
          .filter((e) => (e as SVGElement).style.display !== 'none')
          .map((e) => e.getBoundingClientRect());
        const top = document.elementFromPoint(
          (head?.left ?? 0) + (head?.width ?? 0) * 0.3,
          (head?.top ?? 0) + (head?.height ?? 0) / 2,
        );
        return {
          layer: house && { w: house.width, h: house.height },
          faces: faces.length,
          left: Math.min(...faces.map((r) => r.left)),
          right: Math.max(...faces.map((r) => r.right)),
          top: Math.min(...faces.map((r) => r.top)),
          bottom: Math.max(...faces.map((r) => r.bottom)),
          headTop: head?.top ?? 0,
          overHeadline: top?.closest('.hero-headline') !== null,
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          decorative: ['.stage-house', '.stage-backdrop'].map((s) => {
            const el = document.querySelector(s);
            return (
              el !== null &&
              getComputedStyle(el).pointerEvents === 'none' &&
              el.getAttribute('aria-hidden') === 'true'
            );
          }),
          buildingLayer: (() => {
            const b = document.querySelector('.building-site-window')?.getBoundingClientRect();
            return b && { w: b.width, h: b.height, x: b.x, y: b.y };
          })(),
          host: document.querySelector('.hero-model-widget')?.getAttribute('data-host'),
        };
      });
      expect(m.host).toBe('layer');
      expect(m.layer?.w ?? 0).toBeGreaterThanOrEqual(vp.width - 1);
      expect(m.layer?.h ?? 0).toBeGreaterThanOrEqual(vp.height * 0.95);
      expect(m.faces).toBeGreaterThan(30);
      // The house runs behind the headline and is not cut off at the sides
      expect(m.bottom).toBeGreaterThan(m.headTop);
      expect(m.top).toBeLessThan(m.headTop);
      expect(m.overHeadline).toBe(true);
      expect(m.scrollW).toBeLessThanOrEqual(m.innerW);
      expect(m.decorative).toEqual([true, true]);
      // The building is a full-screen layer too
      void testInfo;
      if (m.buildingLayer) {
        expect(m.buildingLayer.w).toBeGreaterThanOrEqual(vp.width - 1);
        expect(m.buildingLayer.h).toBeGreaterThanOrEqual(vp.height * 0.95);
      }
    });
  }

  test('the switch at 1024 is clean: stacked sheets and a side window from 1024, flowing sheets and a full-screen layer below', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'Layout switch is the same; motion project covers it');
    for (const [width, narrow] of [
      [1024, false],
      [1023, true],
      [1280, false],
      [820, true],
    ] as const) {
      await page.setViewportSize({ width, height: 768 });
      await openHero(page);
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const about = document.getElementById('foundation');
        const win = document.querySelector('.building-site-window')?.getBoundingClientRect();
        return {
          position: about ? getComputedStyle(about).position : '',
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          host: document.querySelector('.hero-model-widget')?.getAttribute('data-host'),
          backdrop: getComputedStyle(document.querySelector('.stage-backdrop') as Element).display,
          winLeft: win ? win.left : -1,
        };
      });
      expect(m.scrollW, `${width}: no sideways scroll`).toBeLessThanOrEqual(m.innerW);
      expect(m.position, `${width}: sheet position`).toBe(narrow ? 'relative' : 'sticky');
      expect(m.host, `${width}: house host`).toBe(narrow ? 'layer' : 'hero');
      expect(m.backdrop, `${width}: backdrop`).toBe(narrow ? 'block' : 'none');
    }
    // Rotating a tablet from portrait to landscape does not jump the page
    await page.setViewportSize({ width: 768, height: 1024 });
    await openHero(page);
    await page.waitForTimeout(800);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  for (const vp of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    test(`${vp.width}x${vp.height}: text keeps its contrast over the background at every scroll position`, async ({
      page,
    }, testInfo) => {
      test.skip(isReduced(testInfo), 'Same layout; the motion project samples it');
      test.setTimeout(240_000);
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForTimeout(1500);
      const end = await page.evaluate(
        () => (document.getElementById('founder')?.offsetTop ?? 0) - window.innerHeight,
      );
      const heroH = await page.evaluate(() => document.getElementById('hero')?.offsetHeight ?? 0);
      // From the page top to the end of Projects. The hero is read over the house and checked on its
      // own; the short stretch where the backdrop turns from concrete to formwork carries no text
      // (the hero text has faded and About has not arrived) and is stepped over.
      const positions: number[] = [0];
      for (let y = heroH; y < end; y += Math.round(vp.height * 0.45)) positions.push(y);
      positions.push(end);

      const failures: string[] = [];
      let sampled = 0;
      for (const y of positions) {
        await walkTo(page, y);
        // Text colour of every visible text block, measured before the text is hidden
        const blocks = await page.evaluate(() => {
          const nav = document.querySelector('.nav-bar')?.getBoundingClientRect().bottom ?? 0;
          const out: {
            text: string;
            x: number;
            y: number;
            w: number;
            h: number;
            color: number[];
            large: boolean;
          }[] = [];
          // Resolve a computed colour (possibly a colour mix) to RGB through a canvas
          const ctx = document.createElement('canvas').getContext('2d');
          const resolve = (value: string) => {
            if (!ctx) return [0, 0, 0];
            ctx.fillStyle = '#000';
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          };
          const scope = [
            ...document.querySelectorAll(
              '#hero .hero-headline, #hero .hero-tagline, .sheet-stage :is(h1,h2,h3,p,li,span,td,div)',
            ),
          ];
          for (const el of scope) {
            const own = [...el.childNodes].some(
              (n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0,
            );
            if (!own) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
            const range = document.createRange();
            range.selectNodeContents(el);
            for (const r of range.getClientRects()) {
              const top = Math.max(r.top, nav + 1);
              const bottom = Math.min(r.bottom, window.innerHeight);
              if (bottom - top < 4 || r.width < 4) continue;
              const px = parseFloat(cs.fontSize);
              const weight = Number(cs.fontWeight);
              out.push({
                text: (el.textContent ?? '').trim().slice(0, 28),
                x: r.left,
                y: top,
                w: r.width,
                h: bottom - top,
                color: resolve(cs.color),
                large: px >= 24 || (px >= 18.66 && weight >= 700),
              });
            }
          }
          return out;
        });
        // Hide all text, then read the pixels that were behind it
        await page.addStyleTag({
          content:
            '*{color:transparent !important;text-shadow:none !important;caret-color:transparent !important}',
        });
        await page.waitForTimeout(120);
        const png = await page.screenshot();
        await page.evaluate(() => {
          document.head.lastElementChild?.remove();
        });
        const worst = await page.evaluate(
          async ([b64, list]) => {
            const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
            const bmp = await createImageBitmap(blob);
            const c = document.createElement('canvas');
            c.width = bmp.width;
            c.height = bmp.height;
            const ctx = c.getContext('2d');
            if (!ctx) return [];
            ctx.drawImage(bmp, 0, 0);
            const scale = bmp.width / window.innerWidth;
            const lumOf = (rgb: number[]) => {
              const f = (v: number) => {
                const k = v / 255;
                return k <= 0.03928 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4;
              };
              return 0.2126 * f(rgb[0] ?? 0) + 0.7152 * f(rgb[1] ?? 0) + 0.0722 * f(rgb[2] ?? 0);
            };
            const results: { text: string; ratio: number; large: boolean }[] = [];
            for (const b of list as {
              text: string;
              x: number;
              y: number;
              w: number;
              h: number;
              color: number[];
              large: boolean;
            }[]) {
              const fg = lumOf(b.color);
              let min = Infinity;
              for (let yy = b.y + 1; yy < b.y + b.h; yy += 3) {
                for (let xx = b.x + 1; xx < b.x + b.w; xx += 3) {
                  const d = ctx.getImageData(
                    Math.round(xx * scale),
                    Math.round(yy * scale),
                    1,
                    1,
                  ).data;
                  const bg = lumOf([d[0] ?? 0, d[1] ?? 0, d[2] ?? 0]);
                  const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
                  if (ratio < min) min = ratio;
                }
              }
              results.push({ text: b.text, ratio: min, large: b.large });
            }
            return results;
          },
          [png.toString('base64'), blocks] as const,
        );
        for (const r of worst) {
          sampled += 1;
          const need = r.large ? 3 : 4.5;
          if (r.ratio < need) failures.push(`y=${y} "${r.text}" ${r.ratio.toFixed(2)} < ${need}`);
        }
      }
      expect(sampled, 'text blocks were sampled').toBeGreaterThan(40);
      expect(failures).toEqual([]);
    });
  }

  test('the hero text keeps 4.5:1 over the house on a phone', async ({ page }, testInfo) => {
    test.skip(isReduced(testInfo), 'Same layout');
    await page.setViewportSize({ width: 390, height: 844 });
    await openHero(page);
    await page.waitForTimeout(4800);
    await stopAuto(page);
    const result = await page.evaluate(() => {
      const ink = getComputedStyle(document.querySelector('.hero-headline') as Element).color;
      const resolve = (value: string) => {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return [0, 0, 0];
        ctx.fillStyle = '#000';
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      // A face's colour is carried by `color` (fill is currentcolor); stroke-only paths have no fill
      const fills = ['wall', 'roof', 'trim', 'stone', 'glass', 'door'].flatMap((k) =>
        [...document.querySelectorAll(`.hm-${k}`)]
          .filter((el) => getComputedStyle(el).fill !== 'none')
          .slice(0, 6)
          .map((el) => [k, resolve(getComputedStyle(el).color)]),
      );
      return { ink: resolve(ink), fills };
    });
    for (const [kind, rgb] of result.fills as [string, number[]][]) {
      expect(contrast(result.ink, rgb), `ink on ${kind}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('no console errors, and axe finds nothing, with the house and then the building behind the text', async ({
    page,
    browserName,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (browserName === 'webkit' && /preloaded using link preload but not used/.test(m.text()))
        return;
      // Firefox's advisory about scroll-linked effects is about the design (a scrubbed building
      // and smooth scroll), not an error in our code, and it appears only at times
      if (browserName === 'firefox' && /scroll-linked positioning effect/.test(m.text())) return;
      if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
    });
    for (const vp of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(vp);
      await openHero(page);
      await page.waitForTimeout(1800);
      expect((await new AxeBuilder({ page }).analyze()).violations, `${vp.width} hero`).toEqual([]);
      await page.goto('about:blank');
      await page.goto('/#fitout');
      await page.waitForTimeout(2000);
      expect((await new AxeBuilder({ page }).analyze()).violations, `${vp.width} process`).toEqual(
        [],
      );
    }
    expect(errors).toEqual([]);
  });
});

test.describe('Phase 14D: no JavaScript', () => {
  test('the static house is in the hero', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.locator('.hero-model-static .hm-face').count()).toBeGreaterThan(100);
    await context.close();
  });
});
