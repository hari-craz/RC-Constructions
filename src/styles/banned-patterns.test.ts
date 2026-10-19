import { describe, expect, it } from 'vitest';

const raw = import.meta.glob(['../**/*.css', '../**/*.tsx', '../**/*.ts', '!../**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sources = Object.entries(raw);
const css = sources.filter(([f]) => f.endsWith('.css'));

describe('banned visual patterns', () => {
  const banned: [string, RegExp][] = [
    ['gradient', /gradient\(/],
    ['blur / backdrop filter', /backdrop-filter|blur\(/],
    ['drop or text shadow', /(?<!-)(box|text)-shadow:\s*(?!none)/],
    ['100vh', /100vh/],
    ['monospace', /monospace/],
    ['svg filter', /<filter|feGaussianBlur/],
  ];
  for (const [name, pattern] of banned) {
    it(`has no ${name}`, () => {
      const hits = sources.filter(([, text]) => pattern.test(text)).map(([f]) => f);
      expect(hits).toEqual([]);
    });
  }
});

describe('amber allowlist (source)', () => {
  const allowed = [
    'Building.css',
    'Button.css',
    'LoadingLine.css',
    'HeroModel.css',
    'Contact.css',
    'ErrorBoundary.css',
    'tokens.css',
  ];
  it('references amber only in files that draw dimension lines, lit windows, primary buttons or the loading line', () => {
    const hits = css
      .filter(([, text]) => /--color-accent\b|--color-work-lamp-amber|#e3b341/.test(text))
      .map(([f]) => f.split(/[\\/]/).pop() as string)
      .filter((name) => !allowed.includes(name));
    expect(hits).toEqual([]);
  });
});
