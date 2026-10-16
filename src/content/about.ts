interface PrincipleItem {
  readonly id: string;
  readonly statement: string;
  readonly consequence: string;
}

export interface AboutContent {
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly principlesTitle: string;
  readonly principles: readonly PrincipleItem[];
}

export const ABOUT_CONTENT: AboutContent = {
  headline: 'We work from the ground up.',
  paragraphs: [
    'RC Constructions is a general contracting company. We build houses, commercial premises, industrial sheds and civil works.',
    'We handle earthwork, structural framing and on-site coordination ourselves, and our supervisors are on the slab while work is in progress.',
  ],
  principlesTitle: 'How we work',
  principles: [
    {
      id: 'principle-strata',
      statement: 'We check soil strata and foundation depths with bore tests before casting.',
      consequence: 'The results decide the footing type and depth.',
    },
    {
      id: 'principle-inspection',
      statement:
        'We photograph reinforcement, bar bending and pours each day and share the photos with the owner.',
      consequence: 'The owner can see each structural member before it is covered.',
    },
    {
      id: 'principle-curing',
      statement: 'We test concrete cubes for compressive strength at seven and twenty-eight days.',
      consequence: 'The results are on record before masonry begins.',
    },
  ],
};
