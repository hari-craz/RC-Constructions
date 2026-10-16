/**
 * Phase 7C: Founder section content data model.
 *
 * Editorial monograph profile of Gokul, Founder.
 * Credentials that are not yet verified are deliberately omitted rather than shown as placeholders.
 */

interface FounderFact {
  id: string;
  label: string;
  value: string;
}

export interface FounderContent {
  sectionId: string;
  name: string;
  role: string;
  bioParagraphs: readonly [string, string, string];
  pullQuote: string;
  facts: readonly [FounderFact, FounderFact, FounderFact];
}

export const FOUNDER_CONTENT: FounderContent = {
  sectionId: 'founder',
  name: 'Gokul', // PLACEHOLDER: Surname to be supplied
  role: 'Founder', // PLACEHOLDER: Official title
  bioParagraphs: [
    'Gokul founded RC Constructions after fifteen years directing commercial structural works.',
    'He oversees site operations directly, from initial setting out through structural completion and commissioning.',
    'The practice maintains a single-contract responsibility model on every build.',
  ],
  pullQuote:
    'A building is only as reliable as the concrete under its columns and the supervisor on its deck.',
  facts: [
    {
      id: 'fact-experience',
      label: 'Experience',
      value: 'Fifteen years directing structural works before founding the firm',
    },
    {
      id: 'fact-sector',
      label: 'Areas of Work',
      value: 'Commercial structural frames and industrial groundworks', // PLACEHOLDER
    },
    {
      id: 'fact-licence',
      label: 'Registration',
      value: 'Contractor registration details available on request',
    },
  ],
};
