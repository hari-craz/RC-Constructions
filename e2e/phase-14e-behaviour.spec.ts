/* global window, document */
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/*
 * Phase 14E: the house never clips, and the new quaternion orientation never flips or jumps.
 * (The pixel comparison with the z-buffer reference is in phase-14e.spec.ts.)
 */
type HmWindow = Window & {
  __hm: { setPose: (a: number, b: number, c: number) => void };
};

const SIZES = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
] as const;

const isReduced = (info: TestInfo) => info.project.use?.contextOptions?.reducedMotion === 'reduce';

async function openTest(page: Page) {
  await page.goto('/?hm-test');
  await page.waitForFunction(
    () => (window as unknown as { __hm?: unknown }).__hm !== undefined,
    null,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(400);
}

/** The union of the house's drawn face paths, in viewport pixels. */
const houseBox = (page: Page) =>
  page.evaluate(() => {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const el of document.querySelectorAll('.hm-face')) {
      if ((el as SVGElement).style.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      x0 = Math.min(x0, r.left);
      y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right);
      y1 = Math.max(y1, r.bottom);
    }
    return { x0, y0, x1, y1 };
  });

const walkTo = async (page: Page, target: number) => {
  const from = await page.evaluate(() => window.scrollY);
  const step = 80 * Math.sign(target - from || 1);
  for (let y = from; Math.abs(target - y) > 80; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(12);
  }
  await page.evaluate((v) => window.scrollTo(0, v), target);
  await page.waitForTimeout(260);
};

const readPose = (page: Page) =>
  page.locator('.hero-model-widget').evaluate((el) => ({
    rx: Number((el as HTMLElement).dataset.rx),
    ry: Number((el as HTMLElement).dataset.ry),
    rz: Number((el as HTMLElement).dataset.rz),
  }));

/** Record the tilt and the gizmo tips on every animation frame, so no frame can be missed. */
const startRecorder = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __rec: { rx: number; tips: number[] }[]; __recStop: boolean };
    w.__rec = [];
    w.__recStop = false;
    const tick = () => {
      if (w.__recStop) return;
      const el = document.querySelector('.hero-model-widget') as HTMLElement;
      const d = document.querySelector('.hm-axis')?.getAttribute('d') ?? '';
      w.__rec.push({
        rx: Number(el.dataset.rx),
        tips: [...d.matchAll(/L(-?[\d.]+) (-?[\d.]+)/g)].flatMap((m) => [
          Number(m[1]),
          Number(m[2]),
        ]),
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const stopRecorder = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __rec: { rx: number; tips: number[] }[]; __recStop: boolean };
    w.__recStop = true;
    return w.__rec;
  });
/** The largest move of any axis tip between neighbouring frames, and of the tilt. */
const worstSteps = (rec: { rx: number; tips: number[] }[]) => {
  let tip = 0;
  let tilt = 0;
  let top = 0;
  for (let i = 1; i < rec.length; i++) {
    const a = rec[i - 1] as { rx: number; tips: number[] };
    const b = rec[i] as { rx: number; tips: number[] };
    tilt = Math.max(tilt, Math.abs(b.rx - a.rx));
    top = Math.max(top, Math.abs(b.rx));
    b.tips.forEach((v, k) => {
      tip = Math.max(tip, Math.abs(v - (a.tips[k] ?? v)));
    });
  }
  return { tip, tilt, top };
};

test.describe('Phase 14E: no clipping, no flips', () => {
  for (const size of SIZES) {
    test(`${size.width}x${size.height}: the house stays inside its container at every rotation`, async ({
      page,
      browserName,
      isMobile,
    }, testInfo) => {
      test.skip(browserName !== 'chromium' || isMobile, 'Desktop Chromium only');
      test.skip(isReduced(testInfo), 'Same drawing; the motion project covers it');
      test.setTimeout(120_000);
      await page.setViewportSize(size);
      await openTest(page);
      const stage = await page.locator('.hero-model-stage').boundingBox();
      const narrow = size.width < 1024;
      const box = {
        x0: narrow ? 0 : (stage?.x ?? 0),
        y0: narrow ? 0 : (stage?.y ?? 0),
        x1: narrow ? size.width : (stage?.x ?? 0) + (stage?.width ?? 0),
        y1: narrow ? size.height : (stage?.y ?? 0) + (stage?.height ?? 0),
      };
      const outside: string[] = [];
      for (let rx = -80; rx <= 80; rx += 20) {
        for (let ry = 0; ry < 360; ry += 45) {
          for (const rz of [-45, 0, 45]) {
            await page.evaluate(
              ([a, b, c]) =>
                (window as unknown as HmWindow).__hm.setPose(a as number, b as number, c as number),
              [rx, ry, rz] as number[],
            );
            const b = await houseBox(page);
            const slack = 2;
            if (
              b.x0 < box.x0 - slack ||
              b.y0 < box.y0 - slack ||
              b.x1 > box.x1 + slack ||
              b.y1 > box.y1 + slack
            ) {
              outside.push(`${rx},${ry},${rz}: ${JSON.stringify(b)}`);
            }
          }
        }
      }
      expect(outside).toEqual([]);
    });
  }

  test('on a phone the house stays inside the screen width all through the morph', async ({
    page,
  }, testInfo) => {
    test.skip(isReduced(testInfo), 'No morph under reduced motion');
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.hero-model-widget').waitFor();
    await page.waitForTimeout(4800);
    const heroH = await page.evaluate(() => document.getElementById('hero')?.offsetHeight ?? 0);
    const outside: string[] = [];
    for (let m = 0; m <= 1.0001; m += 0.04) {
      await walkTo(page, Math.round(heroH - 844 + m * 844));
      const b = await houseBox(page);
      if (b.x1 > -Infinity && (b.x0 < -2 || b.x1 > 392)) {
        outside.push(`m=${m.toFixed(2)}: ${Math.round(b.x0)} to ${Math.round(b.x1)}`);
      }
    }
    expect(outside).toEqual([]);
  });

  test('dragging over the poles and rolling never flips the house or passes the tilt limit', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(isMobile, 'Mouse drag');
    test.skip(isReduced(testInfo), 'Same behaviour; the motion project covers it');
    test.setTimeout(60_000);
    await page.goto('/');
    await page.locator('.hero-model-widget').waitFor();
    await page.waitForTimeout(4800);
    await page.getByRole('switch', { name: 'Auto-rotate' }).click();
    const box = await page.locator('.hero-model-stage').boundingBox();
    const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    // Roll the house, then drag up and down through (and past) the pole several times
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Roll left' }).click();
    await page.waitForTimeout(400);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await startRecorder(page);
    // Continuous moves (each one a small step from the last, like a hand)
    let y = cy;
    for (const dy of [260, -520, 520, -520]) {
      for (let s = 0; s < 14; s++) {
        y += dy / 14;
        await page.mouse.move(cx, y, { steps: 1 });
        await page.waitForTimeout(16);
      }
    }
    await page.mouse.up();
    const { tilt: jump, top: worst, tip } = worstSteps(await stopRecorder(page));
    expect(tip, 'no axis tip jumps between frames').toBeLessThan(20);
    expect(worst, 'tilt never passes the limit').toBeLessThanOrEqual(80.5);
    expect(jump, 'tilt never jumps').toBeLessThan(25);
  });

  test('a fling never spins faster than the cap, however fast the pointer events arrive', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(isMobile, 'Mouse drag');
    test.skip(isReduced(testInfo), 'Same behaviour; the motion project covers it');
    await page.goto('/');
    await page.locator('.hero-model-widget').waitFor();
    await page.waitForTimeout(4800);
    await page.getByRole('switch', { name: 'Auto-rotate' }).click();
    const box = await page.locator('.hero-model-stage').boundingBox();
    const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // Many tiny moves with no pause: the smoothed release speed must still be capped
    for (let i = 0; i < 40; i++) await page.mouse.move(cx + i * 6, cy, { steps: 1 });
    await page.mouse.up();
    const a = await readPose(page);
    await page.waitForTimeout(250);
    const b = await readPose(page);
    const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180;
    // At most the cap in a quarter of a second, plus a little for timing
    expect(Math.abs(wrap(b.ry - a.ry))).toBeLessThan(360 * 0.25 + 40);
  });

  test('Reset view returns by the shortest way, without flipping, from any orientation', async ({
    page,
    browserName,
    isMobile,
  }, testInfo) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Desktop Chromium only');
    test.skip(isReduced(testInfo), 'Under reduced motion it snaps');
    await openTest(page);
    for (const [rx, ry, rz] of [
      [60, 170, 120],
      [-70, -175, -100],
      [10, 200, 179],
    ] as const) {
      await page.evaluate(
        ([a, b, c]) =>
          (window as unknown as HmWindow).__hm.setPose(a as number, b as number, c as number),
        [rx, ry, rz] as number[],
      );
      await startRecorder(page);
      await page.locator('.hero-model-stage').focus();
      await page.keyboard.press('0');
      await page.waitForTimeout(450);
      const rec = await stopRecorder(page);
      // Independent of the frame rate: every axis tip comes steadily nearer its final place, so the
      // way back is one arc (a flip or a long way round would move a tip away at some frame)
      const last = (rec[rec.length - 1] as { tips: number[] }).tips;
      const away = (tips: number[]) => Math.hypot(...tips.map((v, k) => v - (last[k] ?? v)));
      let worst = 0;
      for (let i = 1; i < rec.length; i++) {
        worst = Math.max(
          worst,
          away((rec[i] as { tips: number[] }).tips) - away((rec[i - 1] as { tips: number[] }).tips),
        );
      }
      expect(worst, `from ${rx},${ry},${rz}: no tip moves away from its final place`).toBeLessThan(
        1.5,
      );
      expect((await readPose(page)).rx).toBeCloseTo(16, 0);
    }
  });
});
