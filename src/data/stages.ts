export type StageId = 'survey' | 'foundation' | 'structure' | 'envelope' | 'fitout' | 'completion';

export interface StageConfig {
  id: StageId;
  sectionId: string;
  name: string;
  tone: 'dark' | 'light' | 'concrete' | 'raised';
  range: [number, number];
}

const SURVEY_STAGE: StageConfig = {
  id: 'survey',
  sectionId: 'hero',
  name: 'Survey',
  tone: 'concrete',
  range: [0.0, 0.16],
};

export const FOUNDATION_STAGE: StageConfig = {
  id: 'foundation',
  sectionId: 'foundation',
  name: 'Foundation',
  tone: 'light',
  range: [0.16, 0.33],
};

export const STRUCTURE_STAGE: StageConfig = {
  id: 'structure',
  sectionId: 'structure',
  name: 'Structure',
  tone: 'concrete',
  range: [0.33, 0.5],
};

export const ENVELOPE_STAGE: StageConfig = {
  id: 'envelope',
  sectionId: 'envelope',
  name: 'Envelope',
  tone: 'light',
  range: [0.5, 0.67],
};

export const FITOUT_STAGE: StageConfig = {
  id: 'fitout',
  sectionId: 'fitout',
  name: 'Fit-out',
  tone: 'concrete',
  range: [0.67, 0.84],
};

const COMPLETION_STAGE: StageConfig = {
  id: 'completion',
  sectionId: 'completion',
  name: 'Completion',
  tone: 'light',
  range: [0.84, 1.0],
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

export interface SectionConfig {
  id: string;
  sectionId: string;
  name: string;
  tone: 'dark' | 'light' | 'concrete' | 'raised';
}

const FOUNDER_SECTION: SectionConfig = {
  id: 'founder',
  sectionId: 'founder',
  name: 'Founder',
  tone: 'concrete',
};

const CONTACT_SECTION: SectionConfig = {
  id: 'contact',
  sectionId: 'contact',
  name: 'Contact',
  tone: 'light',
};

const ALL_SECTIONS: readonly (StageConfig | SectionConfig)[] = [
  ...STAGES,
  FOUNDER_SECTION,
  CONTACT_SECTION,
];

export function getSectionById(sectionId: string): StageConfig | SectionConfig | undefined {
  if (sectionId === 'about') return FOUNDATION_STAGE;
  return ALL_SECTIONS.find((s) => s.sectionId === sectionId);
}

/** The fixed site window shows the building from Foundation through Completion only. */
export function isSiteWindowVisible(sectionId: string): boolean {
  const stage = getStageBySectionId(sectionId);
  return Boolean(stage && stage.id !== 'survey');
}
