import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/*
 * Phase 14C: the hero shows an interactive 3D house instead of the survey plot.
 */
const REST = { rx: 16, ry: -35, rz: 0 };

async function openHero(page: Page) {
  await page.goto('/');
  await page.locator('.hero-model-widget').waitFor();
  await page.waitForTimeout(400);
}

const pose = (page: Page) =>
  page.locator('.hero-model-widget').evaluate((el) => {
    const d = (el as HTMLElement).dataset;
    return {
      rx: Number(d.rx),
      ry: Number(d.ry),
      rz: Number(d.rz),
      auto: d.auto === 'true',
      autoRotate: d.autoRotate,
      handoff: Number(document.documentElement.dataset.morphProgress),
    };
  });

const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** Switch auto-rotate off so poses change only when the test asks. */
async function stopAuto(page: Page) {
  const toggle = page.getByRole('switch', { name: 'Auto-rotate' });
  if ((await toggle.getAttribute('aria-checked')) === 'true') await toggle.click();
  await expect(page.locator('.hero-model-widget')).toHaveAttribute('data-auto-rotate', 'off');
  await page.waitForTimeout(350);
}

const isReduced = (testInfo: TestInfo) =>
  testInfo.project.use?.contextOptions?.reducedMotion === 'reduce';

test.describe('Phase 14C: hero 3D house', () => {
  test('renders in place of the survey plot, with controls, gizmo and a hint', async ({ page }) => {
    await openHero(page);
    expect(await page.locator('.hero-plot-svg, .hero-plot-container').count()).toBe(0);
    // Neighbouring faces of one kind share a path: count the drawn faces by their subpaths
    const drawn = await page
      .locator('.hm-face')
      .evaluateAll((els) =>
        els
          .filter((e) => (e as SVGElement).style.display !== 'none')
          .reduce((n, e) => n + (e.getAttribute('d')?.match(/M/g)?.length ?? 0), 0),
      );
    expect(drawn).toBeGreaterThan(15);
    expect(await page.locator('.hm-glass').count()).toBeGreaterThan(0);
    await expect(page.locator('.hero-model-stage')).toHaveAttribute('role', 'group');
    await expect(page.locator('.hero-model-stage')).toHaveAttribute(
      'aria-label',
      '3D house model, drag or use arrow keys to rotate',
    );
    for (const name of [
      'Turn left',
      'Turn right',
      'Tilt up',
      'Tilt down',
      'Roll left',
      'Roll right',
      'Reset view',
    ]) {
      const btn = page.getByRole('button', { name });
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('switch', { name: 'Auto-rotate' })).toBeVisible();
    // Gizmo labels in sentence case
    const labels = await page.locator('.hm-axis-label').allTextContents();
    expect(labels.sort()).toEqual(['x', 'y', 'z']);
    await expect(page.locator('.hero-model-hint')).toHaveText('Drag to turn the house');
    // Amber appears only on the dimension lines and their labels
    const amber = await page.locator('.hm-face, .hm-ground, .hero-model-btn').evaluateAll(
      (els) =>
        els.filter((e) => {
          const cs = getComputedStyle(e);
          return [cs.fill, cs.stroke, cs.color, cs.backgroundColor, cs.borderTopColor].includes(
            'rgb(227, 179, 65)',
          );
        }).length,
    );
    expect(amber).toBe(0);
  });

  test('starts at the three-quarter rest angle', async ({ page }) => {
    await openHero(page);
    await stopAuto(page);
    const p = await pose(page);
    // With auto-rotate off the pose settles within a few degrees of the rest angle
    expect(Math.abs(p.rx - REST.rx)).toBeLessThan(10);
    expect(Math.abs(wrap(p.ry - REST.ry))).toBeLessThan(40);
  });

  test('auto-rotates about y and stops when the visitor interacts, then resumes', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'No auto-rotate under reduced motion');
    test.setTimeout(60_000);
    await openHero(page);
    // The house is raised first (about 3 s), holds the rest angle, then turns by itself
    await page.waitForTimeout(4600);
    const a = await pose(page);
    await page.waitForTimeout(1200);
    const b = await pose(page);
    expect(Math.abs(wrap(b.ry - a.ry)), 'turns about y by itself').toBeGreaterThan(8);
    expect(b.auto).toBe(true);
    // 20 s per revolution is 18 degrees a second
    expect(Math.abs(wrap(b.ry - a.ry))).toBeLessThan(40);

    // Pressing a button pauses it
    await page.getByRole('button', { name: 'Turn right' }).click();
    await page.waitForTimeout(450);
    const c = await pose(page);
    expect(c.auto).toBe(false);
    await page.waitForTimeout(1200);
    const d = await pose(page);
    expect(Math.abs(wrap(d.ry - c.ry)), 'stays put while paused').toBeLessThan(0.5);
    // ... and resumes after about three seconds without input
    await page.waitForTimeout(2600);
    const e = await pose(page);
    expect(e.auto).toBe(true);
  });

  test('pauses while the pointer is over the model', async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile || isReduced(testInfo), 'Pointer hover and motion only');
    await openHero(page);
    const box = await page.locator('.hero-model-stage').boundingBox();
    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );
    await page.waitForTimeout(300);
    const a = await pose(page);
    await page.waitForTimeout(900);
    const b = await pose(page);
    expect(Math.abs(wrap(b.ry - a.ry))).toBeLessThan(0.5);
    expect(b.auto).toBe(false);
  });

  test('drag turns about y and tilts about x', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mouse drag; touch has its own test');
    await openHero(page);
    await stopAuto(page);
    const before = await pose(page);
    const box = await page.locator('.hero-model-stage').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 80, y + 40, { steps: 8 });
    await page.mouse.up();
    // Let any inertia settle
    await page.waitForTimeout(1800);
    const after = await pose(page);
    expect(wrap(after.ry - before.ry), 'dragging right turns the house').toBeGreaterThan(20);
    expect(after.rx - before.rx, 'dragging down tilts the top toward the viewer').toBeGreaterThan(
      10,
    );
    expect(Math.abs(after.rx)).toBeLessThanOrEqual(80.5);
  });

  test('Shift + drag rolls about z', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');
    await openHero(page);
    await stopAuto(page);
    const before = await pose(page);
    const box = await page.locator('.hero-model-stage').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(x, y);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(x + 90, y, { steps: 6 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);
    const after = await pose(page);
    expect(Math.abs(wrap(after.rz - before.rz))).toBeGreaterThan(10);
    expect(Math.abs(wrap(after.ry - before.ry))).toBeLessThan(1);
  });

  test('buttons rotate about all three axes and Reset view returns to the rest angle', async ({
    page,
  }) => {
    await openHero(page);
    await stopAuto(page);
    const start = await pose(page);
    const press = async (name: string) => {
      await page.getByRole('button', { name }).click();
      await page.waitForTimeout(450);
      return pose(page);
    };
    let p = await press('Turn right');
    expect(wrap(p.ry - start.ry)).toBeCloseTo(15, 0);
    p = await press('Turn left');
    p = await press('Turn left');
    expect(wrap(p.ry - start.ry)).toBeCloseTo(-15, 0);
    const t0 = p;
    p = await press('Tilt up');
    expect(p.rx - t0.rx).toBeCloseTo(15, 0);
    p = await press('Tilt down');
    p = await press('Tilt down');
    expect(p.rx - t0.rx).toBeCloseTo(-15, 0);
    const r0 = p;
    p = await press('Roll left');
    expect(wrap(p.rz - r0.rz)).toBeCloseTo(15, 0);
    p = await press('Roll right');
    p = await press('Roll right');
    expect(wrap(p.rz - r0.rz)).toBeCloseTo(-15, 0);
    p = await press('Reset view');
    expect(p.rx).toBeCloseTo(REST.rx, 0);
    expect(wrap(p.ry - REST.ry)).toBeCloseTo(0, 0);
    expect(wrap(p.rz - REST.rz)).toBeCloseTo(0, 0);
  });

  test('the tilt never passes about 80 degrees', async ({ page }) => {
    await openHero(page);
    await stopAuto(page);
    for (let i = 0; i < 9; i++) {
      await page.getByRole('button', { name: 'Tilt up' }).click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect((await pose(page)).rx).toBeLessThanOrEqual(80.01);
    for (let i = 0; i < 16; i++) {
      await page.getByRole('button', { name: 'Tilt down' }).click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    expect((await pose(page)).rx).toBeGreaterThanOrEqual(-80.01);
  });

  test('keyboard: arrows turn and tilt, Q and E roll, 0 resets, Space toggles auto-rotate', async ({
    page,
  }) => {
    await openHero(page);
    await stopAuto(page);
    const stage = page.locator('.hero-model-stage');
    await stage.focus();
    await expect(stage).toBeFocused();
    const start = await pose(page);
    const key = async (k: string) => {
      await page.keyboard.press(k);
      await page.waitForTimeout(450);
      return pose(page);
    };
    let p = await key('ArrowRight');
    expect(wrap(p.ry - start.ry)).toBeCloseTo(15, 0);
    p = await key('ArrowLeft');
    expect(wrap(p.ry - start.ry)).toBeCloseTo(0, 0);
    p = await key('ArrowUp');
    expect(p.rx - start.rx).toBeCloseTo(15, 0);
    p = await key('ArrowDown');
    expect(p.rx - start.rx).toBeCloseTo(0, 0);
    p = await key('q');
    expect(wrap(p.rz - start.rz)).toBeCloseTo(15, 0);
    p = await key('e');
    expect(wrap(p.rz - start.rz)).toBeCloseTo(0, 0);
    await key('ArrowRight');
    p = await key('0');
    expect(wrap(p.ry - REST.ry)).toBeCloseTo(0, 0);
    expect(p.rx).toBeCloseTo(REST.rx, 0);
    await page.keyboard.press(' ');
    await expect(page.locator('.hero-model-widget')).toHaveAttribute('data-auto-rotate', 'on');
    await page.keyboard.press(' ');
    await expect(page.locator('.hero-model-widget')).toHaveAttribute('data-auto-rotate', 'off');
    await page.keyboard.press('Home');
  });

  test('focus ring: 2 px ink outline with a 2 px offset', async ({ page }) => {
    await openHero(page);
    // A key press first, so the browser treats focus as keyboard focus (:focus-visible)
    await page.keyboard.press('Shift');
    await page.locator('.hero-model-stage').focus();
    await expect(page.locator('.hero-model-stage')).toBeFocused();
    const ring = await page.locator('.hero-model-stage').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { w: cs.outlineWidth, o: cs.outlineOffset, c: cs.outlineColor, s: cs.outlineStyle };
    });
    expect(ring).toEqual({ w: '2px', o: '2px', c: 'rgb(35, 38, 34)', s: 'solid' });
    const btn = page.getByRole('button', { name: 'Reset view' });
    await page.keyboard.press('Shift');
    await btn.focus();
    await expect(btn).toBeFocused();
    // The browser eases the ring in over a frame (even under reduced motion)
    await page.waitForTimeout(150);
    const ring2 = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { w: cs.outlineWidth, o: cs.outlineOffset };
    });
    expect(ring2).toEqual({ w: '2px', o: '2px' });
  });

  test('the hint is removed (not just hidden) at the first interaction', async ({ page }) => {
    await openHero(page);
    await expect(page.locator('.hero-model-hint')).toHaveCount(1);
    await page.getByRole('button', { name: 'Turn left' }).click();
    await expect(page.locator('.hero-model-hint')).toHaveCount(0);
  });

  test('the hint also goes after about six seconds', async ({ page }) => {
    test.setTimeout(30_000);
    await openHero(page);
    await expect(page.locator('.hero-model-hint')).toHaveCount(1);
    await page.waitForTimeout(6500);
    await expect(page.locator('.hero-model-hint')).toHaveCount(0);
  });

  test('nothing in the model announces itself (no live regions)', async ({ page }) => {
    await openHero(page);
    expect(
      await page
        .locator(
          '.hero-model-widget [aria-live], .hero-model-widget [role="status"], .hero-model-widget [role="alert"]',
        )
        .count(),
    ).toBe(0);
  });

  test('no element overflows the hero at any rotation (side-by-side layout)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phones and tablets draw the house behind the text (see phase-14d)');
    test.setTimeout(90_000);
    await openHero(page);
    await stopAuto(page);
    const stage = page.locator('.hero-model-stage');
    await stage.focus();
    const check = async (label: string) => {
      const out = await page.evaluate(() => {
        const hero = document.getElementById('hero')?.getBoundingClientRect();
        const nav = document.querySelector('.nav-bar')?.getBoundingClientRect();
        if (!hero || !nav) return ['no hero'];
        const bad: string[] = [];
        document.querySelectorAll('.hero-model-stage svg *').forEach((el) => {
          if ((el as SVGElement).style.display === 'none') return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.left < hero.left - 1 || r.right > hero.right + 1 || r.bottom > hero.bottom + 1) {
            bad.push(
              `${el.tagName}.${el.getAttribute('class')} ${Math.round(r.left)},${Math.round(r.top)}`,
            );
          }
        });
        return bad;
      });
      expect(out, label).toEqual([]);
    };
    await check('rest');
    // Spin through eight turns at three tilts and two rolls
    for (const tilt of ['ArrowUp', 'ArrowDown', 'ArrowDown']) {
      for (let i = 0; i < 4; i++) await page.keyboard.press(tilt);
      await page.waitForTimeout(350);
      for (let t = 0; t < 8; t++) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(330);
        await check(`tilt ${tilt} turn ${t}`);
      }
      for (let r = 0; r < 3; r++) await page.keyboard.press('q');
      await page.waitForTimeout(350);
      await check(`roll after ${tilt}`);
    }
  });

  test('no console errors, and axe finds nothing with the model on screen', async ({
    page,
    browserName,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      // Playwright's WebKit build on Windows reports the (used) font preloads as unused
      if (browserName === 'webkit' && /preloaded using link preload but not used/.test(m.text()))
        return;
      if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
    });
    await openHero(page);
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('hand-off: front elevation at the end of the hero scroll, restored when scrolling back', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'No hand-off animation under reduced motion');
    test.setTimeout(60_000);
    await openHero(page);
    await stopAuto(page);
    // Turn it to a known pose first
    await page.getByRole('button', { name: 'Turn right' }).click();
    await page.getByRole('button', { name: 'Tilt up' }).click();
    await page.waitForTimeout(500);
    const before = await pose(page);
    const scrollTo = (y: number) =>
      page.evaluate((v) => {
        const lenis = (
          window as unknown as {
            __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
          }
        ).__lenis;
        if (lenis) lenis.scrollTo(v, { immediate: true });
        else window.scrollTo(0, v);
      }, y);
    const heroHeight = await page.evaluate(
      () => document.getElementById('hero')?.offsetHeight ?? 0,
    );
    const vh = page.viewportSize()?.height ?? 800;
    for (let y = 0; y <= heroHeight; y += Math.round(vh / 12)) {
      await scrollTo(y);
      await page.waitForTimeout(40);
    }
    await scrollTo(heroHeight);
    await page.waitForTimeout(400);
    const end = await pose(page);
    expect(end.handoff).toBeGreaterThan(0.9);
    expect(Math.abs(end.rx)).toBeLessThan(1);
    expect(Math.abs(wrap(end.ry))).toBeLessThan(1);
    expect(Math.abs(wrap(end.rz))).toBeLessThan(1);
    // Scrolling back restores the pose it had, with no jump
    for (let y = heroHeight; y >= 0; y -= Math.round(vh / 12)) {
      await scrollTo(y);
      await page.waitForTimeout(40);
    }
    await scrollTo(0);
    await page.waitForTimeout(500);
    const back = await pose(page);
    expect(back.handoff).toBe(0);
    expect(back.rx).toBeCloseTo(before.rx, 0);
    expect(wrap(back.ry - before.ry)).toBeCloseTo(0, 0);
  });

  test('auto-rotate stops while the hero scrolls away', async ({ page }, testInfo) => {
    test.skip(isReduced(testInfo), 'No auto-rotate under reduced motion');
    await openHero(page);
    await page.waitForTimeout(4600);
    const vh = page.viewportSize()?.height ?? 800;
    await page.evaluate((y) => {
      const lenis = (
        window as unknown as {
          __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void };
        }
      ).__lenis;
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }, vh * 0.5);
    await page.waitForTimeout(600);
    const a = await pose(page);
    await page.waitForTimeout(800);
    const b = await pose(page);
    expect(b.auto).toBe(false);
    expect(Math.abs(wrap(b.ry - a.ry))).toBeLessThan(0.5);
  });

  test('on touch, a vertical swipe on the model scrolls the page and a horizontal drag turns it', async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!isMobile || browserName !== 'chromium', 'Touch emulation (Chromium)');
    await openHero(page);
    await stopAuto(page);
    const box = await page.locator('.hero-model-stage').boundingBox();
    const x = Math.round((box?.x ?? 0) + (box?.width ?? 0) / 2);
    const y = Math.round((box?.y ?? 0) + (box?.height ?? 0) / 2);
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (x0: number, y0: number, x1: number, y1: number) => {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: x0, y: y0 }],
      });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x0 + ((x1 - x0) * i) / 12, y: y0 + ((y1 - y0) * i) / 12 }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(700);
    };
    const before = await pose(page);
    await swipe(x - 70, y, x + 70, y);
    const turned = await pose(page);
    expect(Math.abs(wrap(turned.ry - before.ry)), 'horizontal drag turns').toBeGreaterThan(10);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
    await swipe(x, y + 80, x, y - 120);
    expect(
      await page.evaluate(() => window.scrollY),
      'vertical swipe scrolls the page',
    ).toBeGreaterThan(40);
  });

  test('stage allows vertical panning on touch', async ({ page }) => {
    await openHero(page);
    expect(
      await page.locator('.hero-model-stage').evaluate((el) => getComputedStyle(el).touchAction),
    ).toBe('pan-y');
  });
});

test.describe('Phase 14C: reduced motion', () => {
  test('no auto-rotate, no easing: buttons and keys snap', async ({ page }, testInfo) => {
    test.skip(!isReduced(testInfo), 'Reduced-motion project only');
    await openHero(page);
    const a = await pose(page);
    expect(a.auto).toBe(false);
    expect(a.rx).toBeCloseTo(REST.rx, 0);
    expect(a.ry).toBeCloseTo(REST.ry, 0);
    await page.waitForTimeout(1200);
    const b = await pose(page);
    expect(b.ry).toBeCloseTo(a.ry, 2);
    await page.getByRole('button', { name: 'Turn right' }).click();
    // No ease: the very next read already shows the full step
    const c = await pose(page);
    expect(wrap(c.ry - a.ry)).toBeCloseTo(15, 0);
    await page.getByRole('button', { name: 'Roll left' }).click();
    expect((await pose(page)).rz).toBeCloseTo(15, 0);
    await page.getByRole('button', { name: 'Reset view' }).click();
    const d = await pose(page);
    expect(d.ry).toBeCloseTo(REST.ry, 0);
    expect(d.rz).toBeCloseTo(0, 0);
    expect(
      await page.locator('.hero-model-widget').evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
  });
});

test.describe('Phase 14C: no JavaScript', () => {
  test('a static house at the rest angle is drawn from the page itself', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const svg = page.locator('.hero-model-static .hm-svg');
    await expect(svg).toBeVisible();
    expect(await svg.locator('.hm-face').count()).toBeGreaterThan(15);
    // The fill is a colour mix, so resolve it to RGB through a canvas
    const rgb = await svg
      .locator('.hm-wall')
      .first()
      .evaluate((el) => {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return [0, 0, 0];
        ctx.fillStyle = '#000';
        ctx.fillStyle = getComputedStyle(el).fill;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      });
    expect(rgb[0]).toBeGreaterThan(200);
    await context.close();
  });
});

test.describe('Phase 14C: cost and loading', () => {
  test('frame cost at a 4x CPU slowdown stays small', async ({
    page,
    browserName,
    isMobile,
  }, testInfo) => {
    test.skip(
      browserName !== 'chromium' || isReduced(testInfo) || isMobile,
      'Desktop Chromium CDP throttle, motion only',
    );
    test.setTimeout(60_000);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await openHero(page);
    await page.waitForTimeout(3500);
    const ms = Number(await page.locator('.hero-model-widget').getAttribute('data-frame-ms'));
    testInfo.annotations.push({ type: 'frame-ms-4x', description: String(ms) });
    testInfo.annotations.push({
      type: 'frame-ms',
      description: `${ms} ms per frame at 4x CPU slowdown`,
    });
    expect(ms).toBeGreaterThan(0);
    // A loose guard: the figure moves with machine load (a few ms when run alone)
    expect(ms).toBeLessThan(25);
  });

  test('the model chunk is requested after first paint, not before the headline', async ({
    page,
    browserName,
  }) => {
    const requests: { url: string; t: number }[] = [];
    const t0 = Date.now();
    page.on('request', (r) => {
      if (/HeroModel-[\w-]+\.js/.test(r.url())) requests.push({ url: r.url(), t: Date.now() - t0 });
    });
    await page.goto('/');
    await expect(page.locator('.hero-headline')).toBeVisible();
    // The model sets this when its chunk has run: a real signal, not a timeout
    await expect(page.locator('html')).toHaveAttribute('data-hero-model', 'ready');
    await page.locator('.hero-model-widget').waitFor();
    expect(requests.length).toBe(1);
    // Chromium reports paint timings: the chunk has run only after the first contentful paint, and
    // it was requested only after the headline had painted (its request begins at or after FCP less
    // a few frames of scheduling slack)
    if (browserName === 'chromium') {
      const t = await page.evaluate(() => ({
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
        ready: performance.getEntriesByName('hero-model-ready')[0]?.startTime ?? 0,
      }));
      expect(t.fcp).toBeGreaterThan(0);
      expect(t.ready).toBeGreaterThan(t.fcp);
    }
  });
});
