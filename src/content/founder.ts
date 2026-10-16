import { COMPANY, hasContent } from './company';

interface FounderFact {
  id: string;
  label: string;
  value: string;
}

export interface FounderContent {
  sectionId: string;
  name: string;
  role: string;
  bioParagraphs: readonly string[];
  /** Null until the founder supplies a quote; the quote block is hidden. */
  pullQuote: string | null;
  /** Only facts that are known; entries without a value are not listed. */
  facts: readonly FounderFact[];
  portraitAlt: string;
  portraitNote: string;
  /** Set in company.ts once /images/founder-gokul.webp and .jpg are committed. */
  portraitAvailable: boolean;
}

function buildFacts(): FounderFact[] {
  const facts: FounderFact[] = [
    {
      id: 'fact-sector',
      label: 'Areas of work',
      value: 'Houses, commercial premises, industrial sheds and civil works',
    },
  ];
  if (hasContent(COMPANY.founder.experienceNote)) {
    facts.push({
      id: 'fact-experience',
      label: 'Experience',
      value: COMPANY.founder.experienceNote,
    });
  }
  if (hasContent(COMPANY.facts.licenceOrRegistration)) {
    facts.push({
      id: 'fact-licence',
      label: 'Registration',
      value: COMPANY.facts.licenceOrRegistration,
    });
  }
  return facts;
}

const founderName = hasContent(COMPANY.founder.surname)
  ? `${COMPANY.founder.name} ${COMPANY.founder.surname}`
  : COMPANY.founder.name;

export const FOUNDER_CONTENT: FounderContent = {
  sectionId: 'founder',
  name: founderName,
  role: COMPANY.founder.role,
  bioParagraphs: [
    'Gokul founded RC Constructions after directing commercial structural works.',
    'He oversees site operations directly, from setting out through structural completion and handover.',
    'Each build runs under one contract with the client.',
  ],
  pullQuote: COMPANY.founder.quote,
  facts: buildFacts(),
  portraitAlt: COMPANY.founder.photoAlt,
  portraitNote: COMPANY.founder.photoNote,
  portraitAvailable: COMPANY.founder.photoAvailable,
};
