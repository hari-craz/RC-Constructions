export interface ProcessStep {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly deliverable: string;
}

export interface ProcessContent {
  readonly title: string;
  readonly steps: readonly ProcessStep[];
}

export const PROCESS_CONTENT: ProcessContent = {
  title: 'Construction Process',
  steps: [
    {
      id: 'step-01-enquiry',
      number: '01',
      title: 'Enquiry & Site Visit',
      description:
        'We inspect the plot, review boundary markings, and assess access roads and soil strata. Our founder Gokul meets the client on site to record structural intentions and physical site constraints.',
      deliverable:
        'Site inspection notes, topographical baseline, and boundary verification report.',
    },
    {
      id: 'step-02-scope',
      number: '02',
      title: 'Scope & Estimate',
      description:
        'We prepare an itemised bill of quantities based on structural Bay dimensions and material grades. Every quantity of steel, cement, aggregate, and labour is priced transparently before signing.',
      deliverable:
        'Itemised bill of quantities with fixed line-item rates and stage payment milestones.',
    },
    {
      id: 'step-03-design',
      number: '03',
      title: 'Design & Approvals',
      description:
        'Our structural engineers draft working drawings, reinforcement schedules, and foundation layouts. We coordinate statutory building permits and municipal planning clearances.',
      deliverable:
        'Signed municipal planning approval, structural drawings, and bar-bending schedules.',
    },
    {
      id: 'step-04-mobilisation',
      number: '04',
      title: 'Mobilisation',
      description:
        'We erect site fencing, set up water and electrical supplies, and mobilise earthmoving machinery. Laser-calibrated survey pegs establish the building grid on ground.',
      deliverable:
        'Established survey grid markers, safety perimeter, and material test certificates.',
    },
    {
      id: 'step-05-build',
      number: '05',
      title: 'Build & Supervision',
      description:
        'Our permanent site supervisors manage daily formwork, column casting, and curing schedules on the slab. Daily photo logs and concrete test results are shared directly with the client.',
      deliverable:
        'Daily site pour logs, seven-day cube test reports, and milestone stage inspections.',
    },
    {
      id: 'step-06-handover',
      number: '06',
      title: 'Handover & Care',
      description:
        'We conduct complete MEP testing, drainage flow verification, and door-window operational checks. Keys are handed over with structural as-built drawings and an ongoing defects liability commitment.',
      deliverable:
        'As-built structural dossier, testing completion certificates, and physical keys handover.',
    },
  ],
};
