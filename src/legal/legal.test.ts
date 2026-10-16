import { describe, expect, it } from 'vitest';
import { COMPANY, CONTACT_EMAIL } from '../content/company';
import { renderPrivacy } from './privacy';
import privacySource from './privacy?raw';
import { renderTerms } from './terms';
import termsSource from './terms?raw';

describe('privacy notice', () => {
  const html = renderPrivacy();

  it('is marked for review by the company adviser in the source', () => {
    expect(privacySource).toContain('REVIEW BY COMPANY ADVISER');
    expect(termsSource).toContain('REVIEW BY COMPANY ADVISER');
  });

  it('covers who, what, why, who else, how long, cookies, choices and complaints', () => {
    for (const heading of [
      'Who is responsible',
      'What the form collects',
      'Why we use it',
      'Who else handles it',
      'How long we keep it',
      'Cookies and analytics',
      'Your choices',
      'If you are not happy',
    ]) {
      expect(html).toContain(`<h2>${heading}</h2>`);
    }
    expect(html).toContain(COMPANY.legal.retentionPeriod);
    expect(html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(html).toContain('Formspree');
    expect(html).toContain('Digital Personal Data Protection Act, 2023');
  });

  it('lists exactly the fields the form collects', () => {
    for (const field of ['name', 'phone number', 'email address', 'project', 'message']) {
      expect(html).toContain(field);
    }
  });
});

describe('terms of use', () => {
  const html = renderTerms();

  it('is short and covers the required points', () => {
    for (const text of [
      'No offer or contract',
      'in writing',
      'Our content',
      'Links',
      'Liability',
    ]) {
      expect(html).toContain(text);
    }
  });

  it('shows the governing law only when the company supplies it', () => {
    expect(COMPANY.legal.governingLaw).toBeNull();
    expect(html).not.toContain('Governing law');
  });
});
