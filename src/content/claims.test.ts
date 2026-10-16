import { describe, expect, it } from 'vitest';
import { ABOUT_CONTENT } from './about';
import { findBannedClaims } from './claims';
import { COMPLETION_CONTENT } from './completion';
import { CONTACT_CONTENT } from './contact';
import { FOUNDER_CONTENT } from './founder';
import { PROCESS_CONTENT } from './process';
import { PROJECTS_CONTENT } from './projects';
import { SERVICES_CONTENT } from './services';
import { SITE } from './site';

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

const MODULES = {
  about: ABOUT_CONTENT,
  completion: COMPLETION_CONTENT,
  contact: CONTACT_CONTENT,
  founder: FOUNDER_CONTENT,
  process: PROCESS_CONTENT,
  projects: PROJECTS_CONTENT,
  services: SERVICES_CONTENT,
  site: SITE,
};

describe('claims review: no absolute or guarantee-style wording in content', () => {
  for (const [name, content] of Object.entries(MODULES)) {
    it(`${name} has no banned claim words`, () => {
      const hits = strings(content)
        .map((text) => ({ text, words: findBannedClaims(text) }))
        .filter((h) => h.words.length > 0);
      expect(hits).toEqual([]);
    });
  }

  it('the matcher catches each banned word', () => {
    for (const sample of [
      'zero defects',
      'never fails',
      'always on time',
      'every site',
      'we guarantee',
      '100% sure',
      'fully tested',
      'we ensure',
      'no defects',
      'certified',
      'accredited',
      'licensed',
      'registered body',
      'award winning',
    ]) {
      expect(findBannedClaims(sample), sample).not.toEqual([]);
    }
  });
});
