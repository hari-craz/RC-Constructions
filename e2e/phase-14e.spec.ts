/* global window */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { buildHouseSource } from '../src/lib/model3d/house.ts';
import { pose as poseMatrix, type Vec3 } from '../src/lib/model3d/math.ts';
import { compareIds, zbufferIds, type RefPolygon } from '../src/lib/model3d/reference.ts';
import { decodePng, encodePng } from './helpers/png.ts';

/*
 * Phase 14E: the house renders correctly at every angle. The real SVG is drawn with each body piece
 * in its own flat colour (?hm-test, idMode: no edges, detail or anti-aliasing) and compared pixel by
 * pixel with an independent z-buffer render of the source geometry (src/lib/model3d/reference.ts).
 * Fewer than 0.3 percent of the model's pixels may differ, ignoring a 1 px band round face edges.
 */
const THRESHOLD = 0.003;
const source = buildHouseSource();
const bodies: RefPolygon[] = source.faces
  .map((f, id) => ({ f, id }))
  .filter(({ f }) => f.role !== 'detail')
  .map(({ f, id }) => ({ id, pts: f.v.map((i) => source.vertices[i] as Vec3) }));

interface HmState {
  cx: number;
  cy: number;
  scale: number;
  invDistance: number;
  centre: [number, number, number];
  width: number;
  height: number;
}
type HmWindow = Window & {
  __hm: {
    setPose: (a: number, b: number, c: number) => void;
    idMode: (on: boolean) => void;
    state: () => HmState;
  };
};

const SIZES = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
] as const;

async function openTest(page: Page) {
  await page.goto('/?hm-test');
  await page.waitForFunction(
    () => (window as unknown as { __hm?: unknown }).__hm !== undefined,
    null,
    {
      timeout: 30_000,
    },
  );
  await page.waitForTimeout(400);
}

/** Render each pose with the real SVG in id colours and compare it with the reference. */
async function checkPoses(
  page: Page,
  testInfo: TestInfo,
  poses: [number, number, number][],
  label: string,
) {
  await openTest(page);
  await page.evaluate(() => (window as unknown as HmWindow).__hm.idMode(true));
  const st = await page.evaluate(() => (window as unknown as HmWindow).__hm.state());
  const failures: string[] = [];
  let worst = 0;
  for (const [rx, ry, rz] of poses) {
    await page.evaluate(
      ([a, b, c]) =>
        (window as unknown as HmWindow).__hm.setPose(a as number, b as number, c as number),
      [rx, ry, rz] as number[],
    );
    const img = decodePng(await page.screenshot({ type: 'png' }));
    const test = new Int32Array(img.width * img.height);
    for (let i = 0; i < test.length; i++) {
      const o = i * 4;
      // Ids are written eight apart per channel (blue is a marker), so rounding recovers them
      test[i] =
        Math.abs((img.data[o + 2] as number) - 200) <= 3
          ? Math.round((img.data[o] as number) / 8) +
            32 * Math.round((img.data[o + 1] as number) / 8)
          : -1;
    }
    const ref = zbufferIds(bodies, {
      width: img.width,
      height: img.height,
      matrix: poseMatrix(rx, ry, rz),
      centre: st.centre,
      cx: st.cx,
      cy: st.cy,
      scale: st.scale,
      invDistance: st.invDistance,
    });
    const cmp = compareIds(ref, test);
    const frac = cmp.bad / Math.max(1, cmp.model);
    worst = Math.max(worst, frac);
    if (cmp.model < 2000)
      failures.push(`${label} ${rx},${ry},${rz}: only ${cmp.model} model pixels`);
    if (frac >= THRESHOLD) {
      failures.push(`${label} ${rx},${ry},${rz}: ${(frac * 100).toFixed(2)}% differ`);
      // A diff image: red where the SVG and the reference disagree
      const out = new Uint8Array(img.data);
      for (let i = 0; i < cmp.mask.length; i++) {
        if (cmp.mask[i]) {
          out[i * 4] = 255;
          out[i * 4 + 1] = 0;
          out[i * 4 + 2] = 0;
        }
      }
      await testInfo.attach(`diff-${label}-${rx}_${ry}_${rz}.png`, {
        body: encodePng({ width: img.width, height: img.height, data: out }),
        contentType: 'image/png',
      });
    }
  }
  testInfo.annotations.push({
    type: 'worst-mismatch',
    description: `${(worst * 100).toFixed(3)}%`,
  });
  expect(failures).toEqual([]);
}

test.describe('Phase 14E: draw order against the z-buffer reference', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const size of SIZES) {
    for (let ry = 0; ry < 360; ry += 15) {
      test(`${size.width}x${size.height}: turn ${ry}, every tilt and roll of the grid`, async ({
        page,
        browserName,
        isMobile,
      }, testInfo) => {
        test.skip(browserName !== 'chromium' || isMobile, 'Desktop Chromium only');
        test.skip(
          testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
          'Same drawing; the motion project covers it',
        );
        test.setTimeout(180_000);
        await page.setViewportSize(size);
        const poses: [number, number, number][] = [];
        for (let rx = -80; rx <= 80; rx += 20) {
          for (let rz = -45; rz <= 45; rz += 15) poses.push([rx, ry, rz]);
        }
        await checkPoses(page, testInfo, poses, `${size.width}x${size.height}`);
      });
    }

    test(`${size.width}x${size.height}: fifty random orientations`, async ({
      page,
      browserName,
      isMobile,
    }, testInfo) => {
      test.skip(browserName !== 'chromium' || isMobile, 'Desktop Chromium only');
      test.skip(
        testInfo.project.use?.contextOptions?.reducedMotion === 'reduce',
        'Same drawing; the motion project covers it',
      );
      test.setTimeout(180_000);
      await page.setViewportSize(size);
      let s = size.width * 7919;
      const next = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
      };
      const poses: [number, number, number][] = Array.from({ length: 50 }, () => [
        next() * 180 - 90,
        next() * 360,
        next() * 360 - 180,
      ]);
      await checkPoses(page, testInfo, poses, `${size.width}x${size.height} random`);
    });
  }
});
