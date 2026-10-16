/**
 * Phase 7C: Founder section content data model.
 *
 * Editorial monograph profile of Gokul, Founder.
 * All details and credentials are placeholders ("20XX", "Registered body to come").
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
  portraitAlt: string;
  portraitNote: string;
  /** Set true once /images/founder-gokul.webp and .jpg are committed. Until then no <img> renders. */
  portraitAvailable: boolean;
}

export const FOUNDER_CONTENT: FounderContent = {
  sectionId: 'founder',
  name: 'Gokul', // PLACEHOLDER: Surname to be supplied
  role: 'Founder', // PLACEHOLDER: Official title
  bioParagraphs: [
    'Gokul founded RC Constructions in 20XX after fifteen years directing commercial structural works.', // PLACEHOLDER
    'He oversees site operations directly, from initial setting out through structural completion and commissioning.',
    'The practice maintains a single-contract responsibility model on every build.',
  ],
  pullQuote:
    'A building is only as reliable as the concrete under its columns and the supervisor on its deck.',
  facts: [
    {
      id: 'fact-experience',
      label: 'Experience',
      value: 'Site practice since 20XX', // PLACEHOLDER
    },
    {
      id: 'fact-sector',
      label: 'Areas of Work',
      value: 'Commercial structural frames and industrial groundworks', // PLACEHOLDER
    },
    {
      id: 'fact-licence',
      label: 'Accreditation',
      value: 'Registered body to come (Licence ref 20XX)', // PLACEHOLDER
    },
  ],
  portraitAlt: 'Portrait of Gokul, founder of RC Constructions',
  portraitAvailable: false,
  portraitNote: 'Photo to come, 1200 by 1500',
};
