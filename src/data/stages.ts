export type StageId = 'survey' | 'foundation' | 'structure' | 'envelope' | 'fitout' | 'completion';

type Tone = 'dark' | 'light' | 'concrete' | 'raised';

/**
 * Page sections in reading order. Section ids are stable (old links keep working) even though
 * the story order changed: the id `foundation` is About, `fitout` is the Construction process,
 * `structure` is Services and `envelope` is Projects.
 */
export interface SectionConfig {
  sectionId: string;
  name: string;
  tone: Tone;
  /** The fixed building window is showing beside this section. */
  window: boolean;
  /** Label in the header section indicator; sections without one are not listed. */
  navLabel?: string;
}

const HERO_SECTION: SectionConfig = {
  sectionId: 'hero',
  name: 'Hero',
  tone: 'concrete',
  window: false,
};

export const ABOUT_SECTION: SectionConfig = {
  sectionId: 'foundation',
  name: 'About',
  tone: 'light',
  window: true,
  navLabel: 'Principles',
};

export const PROCESS_SECTION: SectionConfig = {
  sectionId: 'fitout',
  name: 'Construction process',
  tone: 'concrete',
  window: true,
  navLabel: 'Process',
};

export const COMPLETION_SECTION: SectionConfig = {
  sectionId: 'completion',
  name: 'Work delivered',
  tone: 'light',
  window: true,
  navLabel: 'Track record',
};

export const SERVICES_SECTION: SectionConfig = {
  sectionId: 'structure',
  name: 'Services',
  tone: 'concrete',
  window: true,
  navLabel: 'Services',
};

export const PROJECTS_SECTION: SectionConfig = {
  sectionId: 'envelope',
  name: 'Projects',
  tone: 'light',
  window: true,
  navLabel: 'Projects',
};

const FOUNDER_SECTION: SectionConfig = {
  sectionId: 'founder',
  name: 'Founder',
  tone: 'concrete',
  window: false,
};

const CONTACT_SECTION: SectionConfig = {
  sectionId: 'contact',
  name: 'Contact',
  tone: 'light',
  window: false,
  navLabel: 'Contact',
};

export const SECTIONS: readonly SectionConfig[] = [
  HERO_SECTION,
  ABOUT_SECTION,
  PROCESS_SECTION,
  COMPLETION_SECTION,
  SERVICES_SECTION,
  PROJECTS_SECTION,
  FOUNDER_SECTION,
  CONTACT_SECTION,
];

/** Building stages in build order; `parts` is how many scrubbed timelines make up the stage. */
export const STAGES: readonly { id: StageId; parts: number }[] = [
  { id: 'survey', parts: 0 },
  { id: 'foundation', parts: 1 },
  { id: 'structure', parts: 2 },
  { id: 'envelope', parts: 2 },
  { id: 'fitout', parts: 2 },
  { id: 'completion', parts: 1 },
];

/**
 * Which stage each Construction process step draws (step number minus one), and which part of
 * that stage. Foundation is drawn by About, completion by Work delivered.
 */
export const PROCESS_STEP_STAGES: readonly { stage: StageId; part: number }[] = [
  { stage: 'structure', part: 0 },
  { stage: 'structure', part: 1 },
  { stage: 'envelope', part: 0 },
  { stage: 'envelope', part: 1 },
  { stage: 'fitout', part: 0 },
  { stage: 'fitout', part: 1 },
];

/** The building stage that is complete while a section is the one in view. */
const STAGE_IN_VIEW: Record<string, StageId> = {
  hero: 'survey',
  foundation: 'foundation',
  fitout: 'fitout',
  completion: 'completion',
  structure: 'completion',
  envelope: 'completion',
  founder: 'completion',
  contact: 'completion',
};

export function getSectionById(sectionId: string): SectionConfig | undefined {
  if (sectionId === 'about') return ABOUT_SECTION;
  return SECTIONS.find((s) => s.sectionId === sectionId);
}

export function getStageInView(sectionId: string): StageId {
  return STAGE_IN_VIEW[sectionId === 'about' ? 'foundation' : sectionId] ?? 'survey';
}

/** The fixed site window is showing beside About, Process, Work delivered, Services and Projects. */
export function isSiteWindowVisible(sectionId: string): boolean {
  return Boolean(getSectionById(sectionId)?.window);
}

export const NAV_SECTIONS = SECTIONS.filter((s) => s.navLabel);
