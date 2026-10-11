import { describe, expect, it } from 'vitest';
import { ABOUT_CONTENT } from './about';
import { PROCESS_CONTENT } from './process';
import { PROJECTS_CONTENT } from './projects';
import { SERVICES_CONTENT } from './services';

const BANNED_WORDS = [
  'cutting-edge',
  'state-of-the-art',
  'seamless',
  'world-class',
  'innovative',
  'passionate',
  'crafting',
  'elevate',
  'unlock',
  'journey',
  'solutions',
];

function checkBannedWords(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_WORDS.filter((word) => lower.includes(word));
}

function hasExclamationMark(text: string): boolean {
  return text.includes('!');
}

describe('About content model', () => {
  it('contains required fields with non-empty strings and no banned words', () => {
    expect(ABOUT_CONTENT.title.trim()).not.toBe('');
    expect(ABOUT_CONTENT.headline.trim()).not.toBe('');
    expect(ABOUT_CONTENT.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(ABOUT_CONTENT.principles.length).toBe(3);

    const fullAboutText = [
      ABOUT_CONTENT.title,
      ABOUT_CONTENT.headline,
      ...ABOUT_CONTENT.paragraphs,
      ...ABOUT_CONTENT.principles.flatMap((p) => [p.statement, p.consequence]),
    ].join(' ');

    expect(checkBannedWords(fullAboutText)).toEqual([]);
    expect(hasExclamationMark(fullAboutText)).toBe(false);
  });

  it('contains 3 working principles with statement and consequence', () => {
    const ids = new Set<string>();
    ABOUT_CONTENT.principles.forEach((principle) => {
      expect(principle.id).toBeTruthy();
      expect(ids.has(principle.id)).toBe(false);
      ids.add(principle.id);
      expect(principle.statement.trim()).not.toBe('');
      expect(principle.consequence.trim()).not.toBe('');
    });
  });
});

describe('Services content model', () => {
  it('contains exactly eight services with unique ids and non-empty strings', () => {
    expect(SERVICES_CONTENT.services.length).toBe(8);

    const ids = new Set<string>();
    const numbers = new Set<string>();

    SERVICES_CONTENT.services.forEach((service) => {
      expect(service.id.trim()).not.toBe('');
      expect(ids.has(service.id)).toBe(false);
      ids.add(service.id);

      expect(service.number.trim()).not.toBe('');
      expect(numbers.has(service.number)).toBe(false);
      numbers.add(service.number);

      expect(service.name.trim()).not.toBe('');
      expect(service.scope.trim()).not.toBe('');
      expect(service.typicalWork.trim()).not.toBe('');
    });
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullServicesText = [
      SERVICES_CONTENT.title,
      ...SERVICES_CONTENT.services.flatMap((s) => [s.name, s.scope, s.typicalWork]),
    ].join(' ');

    expect(checkBannedWords(fullServicesText)).toEqual([]);
    expect(hasExclamationMark(fullServicesText)).toBe(false);
  });
});

describe('Projects content model', () => {
  it('contains exactly six projects with unique ids and non-empty strings', () => {
    expect(PROJECTS_CONTENT.projects.length).toBe(6);

    const ids = new Set<string>();
    const numbers = new Set<string>();

    PROJECTS_CONTENT.projects.forEach((project) => {
      expect(project.id.trim()).not.toBe('');
      expect(ids.has(project.id)).toBe(false);
      ids.add(project.id);

      expect(project.number.trim()).not.toBe('');
      expect(numbers.has(project.number)).toBe(false);
      numbers.add(project.number);

      expect(project.name.trim()).not.toBe('');
      expect(project.category.trim()).not.toBe('');
      expect(project.location.trim()).not.toBe('');
      expect(project.year.trim()).not.toBe('');
      expect(project.builtArea.trim()).not.toBe('');
      expect(project.outcome.trim()).not.toBe('');
    });
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullProjectsText = [
      PROJECTS_CONTENT.title,
      ...PROJECTS_CONTENT.projects.flatMap((p) => [
        p.name,
        p.category,
        p.location,
        p.year,
        p.builtArea,
        p.outcome,
      ]),
    ].join(' ');

    expect(checkBannedWords(fullProjectsText)).toEqual([]);
    expect(hasExclamationMark(fullProjectsText)).toBe(false);
  });
});

describe('Process content model', () => {
  it('contains exactly six process steps in order with unique ids', () => {
    expect(PROCESS_CONTENT.steps.length).toBe(6);

    const ids = new Set<string>();
    const numbers = new Set<string>();

    PROCESS_CONTENT.steps.forEach((step, idx) => {
      expect(step.id.trim()).not.toBe('');
      expect(ids.has(step.id)).toBe(false);
      ids.add(step.id);

      expect(step.number).toBe(`0${idx + 1}`);
      numbers.add(step.number);

      expect(step.title.trim()).not.toBe('');
      expect(step.description.trim()).not.toBe('');
      expect(step.deliverable.trim()).not.toBe('');
    });
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullProcessText = [
      PROCESS_CONTENT.title,
      ...PROCESS_CONTENT.steps.flatMap((s) => [s.title, s.description, s.deliverable]),
    ].join(' ');

    expect(checkBannedWords(fullProcessText)).toEqual([]);
    expect(hasExclamationMark(fullProcessText)).toBe(false);
  });
});
