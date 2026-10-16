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
    // PLACEHOLDER: Company founding year and geographic scope
    'RC Constructions is a general contracting firm founded by Gokul, who spent fifteen years directing commercial structural works before starting the firm. We build residential houses, commercial premises, industrial sheds, and civil infrastructure across the region.',
    // PLACEHOLDER: Operational model and direct site supervision statement
    'We handle our own earthwork, structural framing, and on-site coordination. We do not subcontract core structural trades or manage projects from an off-site office. Our supervisors remain on the slab every day until final handover.',
  ],
  principlesTitle: 'Working Principles',
  principles: [
    {
      id: 'principle-strata',
      statement:
        'Soil strata and foundation depths are verified by engineer bore tests before casting.',
      consequence: 'Foundation design follows measured ground conditions rather than assumption.',
    },
    {
      id: 'principle-inspection',
      statement:
        'Reinforcement schedules, bar bending, and pour records are photographed daily and shared with the owner.',
      consequence: 'Structural work is recorded and traceable.',
    },
    {
      id: 'principle-curing',
      statement:
        'Concrete test cubes are crushed for compressive strength verification at seven and twenty-eight days.',
      consequence: 'Structural strength is documented before masonry commences.',
    },
  ],
};
