import { describe, expect, it } from 'vitest';
import { ABOUT_CONTENT } from './about';
import { COMPLETION_CONTENT } from './completion';
import { CONTACT_CONTENT } from './contact';
import { FOUNDER_CONTENT } from './founder';
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
    expect(ABOUT_CONTENT.headline.trim()).not.toBe('');
    expect(ABOUT_CONTENT.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(ABOUT_CONTENT.principles.length).toBe(3);

    const fullAboutText = [
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
      expect(project.type.trim()).not.toBe('');
      expect(project.clientType.trim()).not.toBe('');
      expect(project.location.trim()).not.toBe('');
      expect(project.year.trim()).not.toBe('');
      expect(project.builtArea.trim()).not.toBe('');
      expect(project.slug.trim()).not.toBe('');
      expect(project.duration.trim()).not.toBe('');
      expect(project.challenge.trim()).not.toBe('');
      expect(project.response.trim()).not.toBe('');
      expect(project.outcome.trim()).not.toBe('');
      expect(project.gallery).toHaveLength(3);
      project.gallery.forEach((g) => {
        expect(g.id.trim()).not.toBe('');
        expect(g.caption.trim()).not.toBe('');
      });
    });
  });

  it('gives every project a distinct situation, not template text', () => {
    const projects = PROJECTS_CONTENT.projects;
    for (const field of [
      'challenge',
      'response',
      'outcome',
      'location',
      'type',
      'clientType',
    ] as const) {
      expect(new Set(projects.map((p) => p[field])).size, field).toBe(projects.length);
    }
    // No two challenges share more than a third of their words
    const words = (t: string) => new Set(t.toLowerCase().match(/[a-z]{5,}/g) ?? []);
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const a = words(projects[i]?.challenge ?? '');
        const b = words(projects[j]?.challenge ?? '');
        const shared = [...a].filter((w) => b.has(w)).length;
        expect(shared / Math.min(a.size, b.size)).toBeLessThan(0.34);
      }
    }
  });

  it('labels the set once as sample content', () => {
    expect(PROJECTS_CONTENT.sampleNote).toBe('Sample projects for this demo.');
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullProjectsText = [
      PROJECTS_CONTENT.title,
      PROJECTS_CONTENT.sampleNote,
      ...PROJECTS_CONTENT.projects.flatMap((p) => [
        p.name,
        p.type,
        p.location,
        p.year,
        p.builtArea,
        p.duration,
        p.clientType,
        p.challenge,
        p.response,
        p.outcome,
        ...p.gallery.map((g) => g.caption),
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

describe('Completion content model', () => {
  it('has a plain title, a one-sentence lead and four handover items', () => {
    expect(COMPLETION_CONTENT.title).toBe('Work delivered');
    expect(COMPLETION_CONTENT.lead.split(/[.!?]/).filter((x) => x.trim()).length).toBe(1);
    expect(COMPLETION_CONTENT.handover).toHaveLength(4);
    expect(new Set(COMPLETION_CONTENT.handover.map((h) => h.id)).size).toBe(4);
  });

  it('only lists figures the company supplied (none are invented)', () => {
    expect(COMPLETION_CONTENT.stats.length).toBe(0);
    COMPLETION_CONTENT.stats.forEach((stat) => {
      expect(stat.value.trim()).not.toBe('');
      expect(stat.caption.trim()).not.toBe('');
    });
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullCompletionText = [
      COMPLETION_CONTENT.title,
      COMPLETION_CONTENT.lead,
      COMPLETION_CONTENT.handoverTitle,
      ...COMPLETION_CONTENT.handover.flatMap((h) => [h.title, h.text]),
      ...COMPLETION_CONTENT.stats.flatMap((s) => [s.value, s.caption]),
    ].join(' ');

    expect(checkBannedWords(fullCompletionText)).toEqual([]);
    expect(hasExclamationMark(fullCompletionText)).toBe(false);
  });
});

describe('Founder content model', () => {
  it('contains name, role, bio and only known facts', () => {
    expect(FOUNDER_CONTENT.name.trim()).not.toBe('');
    expect(FOUNDER_CONTENT.role.trim()).not.toBe('');
    expect(FOUNDER_CONTENT.bioParagraphs.length).toBeGreaterThanOrEqual(2);
    FOUNDER_CONTENT.bioParagraphs.forEach((sentence) => expect(sentence.trim()).not.toBe(''));
    FOUNDER_CONTENT.facts.forEach((fact) => {
      expect(fact.label.trim()).not.toBe('');
      expect(fact.value.trim()).not.toBe('');
    });
    expect(FOUNDER_CONTENT.portraitAlt).toBe('Portrait of Gokul, founder of RC Constructions');
  });

  it('has no placeholder text, invented years, quotes or credentials', () => {
    const text = [
      ...FOUNDER_CONTENT.bioParagraphs,
      ...FOUNDER_CONTENT.facts.flatMap((f) => [f.label, f.value]),
      FOUNDER_CONTENT.pullQuote ?? '',
    ].join(' ');
    expect(text).not.toMatch(/20XX|\bXX\b|to come|PLACEHOLDER/);
    expect(FOUNDER_CONTENT.pullQuote).toBeNull();
    expect(FOUNDER_CONTENT.facts.find((f) => f.id === 'fact-licence')).toBeUndefined();
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullFounderText = [
      FOUNDER_CONTENT.name,
      FOUNDER_CONTENT.role,
      ...FOUNDER_CONTENT.bioParagraphs,
      FOUNDER_CONTENT.pullQuote ?? '',
      ...FOUNDER_CONTENT.facts.flatMap((f) => [f.label, f.value]),
    ].join(' ');

    expect(checkBannedWords(fullFounderText)).toEqual([]);
    expect(hasExclamationMark(fullFounderText)).toBe(false);
  });
});

describe('Contact content model', () => {
  it('contains headline, subhead, channels, privacy notice, and footer', () => {
    expect(CONTACT_CONTENT.headline.trim()).not.toBe('');
    expect(CONTACT_CONTENT.subhead.trim()).not.toBe('');
    expect(CONTACT_CONTENT.privacyNotice.trim()).not.toBe('');
    expect(CONTACT_CONTENT.footer.companyName.trim()).not.toBe('');
    expect(CONTACT_CONTENT.footer.builtBy).toBe('Built by UnitaryX');
    expect(CONTACT_CONTENT.footer.backToTopLabel.trim()).not.toBe('');

    expect(CONTACT_CONTENT.channels.length).toBeGreaterThanOrEqual(4);
    expect(CONTACT_CONTENT.privacyLink.href).toBe('/privacy');
    CONTACT_CONTENT.channels.forEach((channel) => {
      expect(channel.id.trim()).not.toBe('');
      expect(channel.label.trim()).not.toBe('');
      expect(channel.value.trim()).not.toBe('');
    });
  });

  it('builds valid tel, mailto, and wa.me links', () => {
    const phoneChannel = CONTACT_CONTENT.channels.find((c) => c.id === 'phone');
    expect(phoneChannel?.href).toMatch(/^tel:\+/);

    const waChannel = CONTACT_CONTENT.channels.find((c) => c.id === 'whatsapp');
    if (waChannel) expect(waChannel.href).toMatch(/^https:\/\/wa\.me\/\d+/);

    const emailChannel = CONTACT_CONTENT.channels.find((c) => c.id === 'email');
    expect(emailChannel?.href).toMatch(/^mailto:.+@.+/);
  });

  it('contains no banned marketing words and no exclamation marks', () => {
    const fullContactText = [
      CONTACT_CONTENT.headline,
      CONTACT_CONTENT.subhead,
      CONTACT_CONTENT.privacyNotice,
      CONTACT_CONTENT.footer.companyName,
      CONTACT_CONTENT.footer.builtBy,
      ...CONTACT_CONTENT.channels.flatMap((c) => [c.label, c.value]),
    ].join(' ');

    expect(checkBannedWords(fullContactText)).toEqual([]);
    expect(hasExclamationMark(fullContactText)).toBe(false);
  });
});
