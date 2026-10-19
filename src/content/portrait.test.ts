import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMPANY } from './company';

/*
 * The founder portrait is only rendered when COMPANY.founder.photoAvailable is true. Turning the
 * flag on without real files would render a broken image, so the files must exist and be what
 * their extensions say.
 */
describe('founder portrait files', () => {
  it('exist and match their types whenever the portrait is switched on', () => {
    if (!COMPANY.founder.photoAvailable) {
      expect(COMPANY.founder.photoAvailable).toBe(false);
      return;
    }
    const jpg = 'public/images/founder-gokul.jpg';
    const webp = 'public/images/founder-gokul.webp';
    expect(existsSync(jpg)).toBe(true);
    expect(existsSync(webp)).toBe(true);
    expect(readFileSync(jpg).subarray(0, 3).toString('hex')).toBe('ffd8ff');
    const head = readFileSync(webp).subarray(0, 12);
    expect(head.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(head.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });
});
