export type StageId = 'survey' | 'foundation' | 'structure' | 'envelope' | 'fitout' | 'completion';

interface StageMetric {
  label: string;
  value: string;
}

export interface StageConfig {
  id: StageId;
  sectionId: string;
  name: string;
  kicker: string;
  title: string;
  tone: 'dark' | 'light' | 'concrete' | 'raised';
  range: [number, number];
  copy: {
    lead: string;
    description: string;
    metrics: StageMetric[];
  };
}

const SURVEY_STAGE: StageConfig = {
  id: 'survey',
  sectionId: 'hero',
  name: 'Survey',
  kicker: 'Section 01',
  title: 'Site Survey & Excavation',
  tone: 'concrete',
  range: [0.0, 0.16],
  copy: {
    lead: 'Boundary verification, topographical zoning, and legal setback coordinates.',
    description:
      '// PLACEHOLDER: Precise laser-measured boundary coordinates establish structural grid origins.',
    metrics: [
      { label: 'Frontage', value: '18.40 m' },
      { label: 'Depth', value: '24.80 m' },
      { label: 'Setback', value: '3.00 m' },
    ],
  },
};

export const FOUNDATION_STAGE: StageConfig = {
  id: 'foundation',
  sectionId: 'foundation',
  name: 'Foundation',
  kicker: 'Section 02',
  title: 'Substructure & Earthwork',
  tone: 'dark',
  range: [0.16, 0.33],
  copy: {
    lead: 'Deep excavation cuts, stepped pad footings, and reinforced tie-beam grids.',
    description:
      '// PLACEHOLDER: Excavation down to bed strata with cast-in-place reinforced concrete ground beams.',
    metrics: [
      { label: 'Depth Below Datum', value: '-3.20 m' },
      { label: 'Pad Thickness', value: '900 mm' },
      { label: 'Concrete Grade', value: 'M35 Reinforced' },
    ],
  },
};

export const STRUCTURE_STAGE: StageConfig = {
  id: 'structure',
  sectionId: 'structure',
  name: 'Structure',
  kicker: 'Section 03',
  title: 'Column Assembly & Floor Slabs',
  tone: 'concrete',
  range: [0.33, 0.5],
  copy: {
    lead: 'Continuous reinforced concrete columns, post-tensioned slabs, and vertical core.',
    description:
      '// PLACEHOLDER: Level-by-level superstructure erection anchoring high-load architectural bays.',
    metrics: [
      { label: 'Column Pitch', value: '6.00 m' },
      { label: 'Storeys', value: '4 Levels' },
      { label: 'Floor-to-Floor', value: '3.60 m' },
    ],
  },
};

export const ENVELOPE_STAGE: StageConfig = {
  id: 'envelope',
  sectionId: 'envelope',
  name: 'Envelope',
  kicker: 'Section 04',
  title: 'Weatherproof Enclosure & Walls',
  tone: 'dark',
  range: [0.5, 0.67],
  copy: {
    lead: 'Engineered masonry, precision punched openings, and insulated roof parapets.',
    description:
      '// PLACEHOLDER: Weather-tight skin establishing thermal barrier and calibrated structural apertures.',
    metrics: [
      { label: 'Cavity Depth', value: '250 mm' },
      { label: 'Parapet Height', value: '+15.40 m' },
      { label: 'Aperture Ratio', value: '38%' },
    ],
  },
};

export const FITOUT_STAGE: StageConfig = {
  id: 'fitout',
  sectionId: 'fitout',
  name: 'Fit-out',
  kicker: 'Section 05',
  title: 'Architectural Glazing & MEP',
  tone: 'concrete',
  range: [0.67, 0.84],
  copy: {
    lead: 'Internal technical partitions, circulation staircases, and window fenestration.',
    description:
      '// PLACEHOLDER: Precise architectural mullions and division walls resolving spatial programming.',
    metrics: [
      { label: 'Glazing Type', value: 'Low-E Double' },
      { label: 'Stair Pitch', value: '175 / 260 mm' },
      { label: 'Acoustic Rating', value: 'Rw 48 dB' },
    ],
  },
};

export const COMPLETION_STAGE: StageConfig = {
  id: 'completion',
  sectionId: 'completion',
  name: 'Completion',
  kicker: 'Section 06',
  title: 'Commissioning & Commissioned Handover',
  tone: 'dark',
  range: [0.84, 1.0],
  copy: {
    lead: 'Full architectural illumination, dimensional verification, and client handover.',
    description:
      '// PLACEHOLDER: Architectural commissioning complete with energized illumination and finished access.',
    metrics: [
      { label: 'Total Height', value: '15.40 m' },
      { label: 'Gross Area', value: '1,825 m²' },
      { label: 'Status', value: 'Commissioned' },
    ],
  },
};

export const STAGES: readonly StageConfig[] = [
  SURVEY_STAGE,
  FOUNDATION_STAGE,
  STRUCTURE_STAGE,
  ENVELOPE_STAGE,
  FITOUT_STAGE,
  COMPLETION_STAGE,
];

export function getStageByProgress(progress: number): StageConfig {
  const clamped = Math.max(0, Math.min(1, progress));
  for (const stage of STAGES) {
    if (stage === COMPLETION_STAGE && clamped >= stage.range[0]) {
      return stage;
    }
    if (clamped >= stage.range[0] && clamped < stage.range[1]) {
      return stage;
    }
  }
  return SURVEY_STAGE;
}

export function getStageBySectionId(sectionId: string): StageConfig | undefined {
  return STAGES.find((s) => s.sectionId === sectionId);
}
