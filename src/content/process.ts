export interface ProcessStep {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  /** One short paragraph (about two sentences). */
  readonly description: string;
  /** The single thing the client receives at this step. */
  readonly deliverable: string;
}

export interface ProcessContent {
  readonly title: string;
  readonly deliverableLabel: string;
  readonly steps: readonly ProcessStep[];
}

export const PROCESS_CONTENT: ProcessContent = {
  title: 'Construction process',
  deliverableLabel: 'You receive',
  steps: [
    {
      id: 'step-01-enquiry',
      number: '01',
      title: 'Enquiry and site visit',
      description:
        'We visit the plot, check the boundary markings, and look at access roads and soil. We meet you on site to note what you want built and what limits the site.',
      deliverable: 'Site visit notes and a boundary check.',
    },
    {
      id: 'step-02-scope',
      number: '02',
      title: 'Scope and estimate',
      description:
        'We prepare an itemised bill of quantities from the structural dimensions and material grades. Steel, cement, aggregate and labour are priced as separate lines before you sign.',
      deliverable: 'An itemised estimate with stage payment milestones.',
    },
    {
      id: 'step-03-design',
      number: '03',
      title: 'Design and approvals',
      description:
        'Our engineers draft working drawings, reinforcement schedules and foundation layouts. We prepare the permit and planning applications and follow them through.',
      deliverable: 'Structural drawings and bar-bending schedules.',
    },
    {
      id: 'step-04-mobilisation',
      number: '04',
      title: 'Mobilisation',
      description:
        'We put up site fencing, arrange water and power, and bring in earthmoving machinery. Survey pegs mark the building grid on the ground.',
      deliverable: 'A marked building grid and a fenced site.',
    },
    {
      id: 'step-05-build',
      number: '05',
      title: 'Build and supervision',
      description:
        'Our site supervisors manage formwork, column casting and curing on the slab. We share daily photos and concrete test results with you.',
      deliverable: 'Pour records and cube test reports.',
    },
    {
      id: 'step-06-handover',
      number: '06',
      title: 'Handover and care',
      description:
        'We test mechanical, electrical and plumbing systems, check drainage flow, and operate doors and windows. We walk the building with you and list any snags.',
      deliverable: 'As-built drawings, test records and the keys.',
    },
  ],
};
