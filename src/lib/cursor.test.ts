import { describe, expect, it } from 'vitest';
import { resolveCursorState, resolveCursorTone } from './cursor';

describe('cursor state resolver', () => {
  it('returns hidden over form inputs, textareas, and selects', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');

    expect(resolveCursorState(input)).toBe('hidden');
    expect(resolveCursorState(textarea)).toBe('hidden');
    expect(resolveCursorState(select)).toBe('hidden');
  });

  it('returns project for project rows', () => {
    const row = document.createElement('li');
    row.setAttribute('data-project-id', 'project-commercial-tower');
    const btn = document.createElement('button');
    row.appendChild(btn);

    expect(resolveCursorState(btn)).toBe('project');
  });

  it('returns link for buttons and links', () => {
    const btn = document.createElement('button');
    const link = document.createElement('a');

    expect(resolveCursorState(btn)).toBe('link');
    expect(resolveCursorState(link)).toBe('link');
  });

  it('honors explicit data-cursor attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-cursor', 'link');
    expect(resolveCursorState(el)).toBe('link');

    el.setAttribute('data-cursor', 'hidden');
    expect(resolveCursorState(el)).toBe('hidden');
  });

  it('defaults to default state for general elements', () => {
    const div = document.createElement('div');
    const p = document.createElement('p');

    expect(resolveCursorState(div)).toBe('default');
    expect(resolveCursorState(p)).toBe('default');
    expect(resolveCursorState(null)).toBe('default');
  });
});

describe('cursor tone resolver', () => {
  it('resolves dark tone on dark surfaces', () => {
    const darkSection = document.createElement('section');
    darkSection.setAttribute('data-sheet-tone', 'dark');
    const child = document.createElement('span');
    darkSection.appendChild(child);

    expect(resolveCursorTone(child)).toBe('dark');
  });

  it('resolves light tone on light surfaces', () => {
    const lightSection = document.createElement('section');
    lightSection.setAttribute('data-sheet-tone', 'light');
    const child = document.createElement('span');
    lightSection.appendChild(child);

    expect(resolveCursorTone(child)).toBe('light');
    expect(resolveCursorTone(null)).toBe('light');
  });
});
