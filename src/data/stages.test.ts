import { describe, expect, it } from 'vitest';
import {
  getSectionById,
  getStageInView,
  isSiteWindowVisible,
  NAV_SECTIONS,
  PROCESS_STEP_STAGES,
  SECTIONS,
  STAGES,
} from './stages';

describe('story order and stage map', () => {
  it('lists the sections in the new reading order with unchanged ids', () => {
    expect(SECTIONS.map((s) => s.sectionId)).toEqual([
      'hero',
      'foundation',
      'fitout',
      'completion',
      'structure',
      'envelope',
      'founder',
      'contact',
    ]);
  });

  it('has six building stages in build order', () => {
    expect(STAGES.map((s) => s.id)).toEqual([
      'survey',
      'foundation',
      'structure',
      'envelope',
      'fitout',
      'completion',
    ]);
  });

  it('maps the six process steps to structure, envelope and fit-out in order, two parts each', () => {
    expect(PROCESS_STEP_STAGES.map((s) => `${s.stage}:${s.part}`)).toEqual([
      'structure:0',
      'structure:1',
      'envelope:0',
      'envelope:1',
      'fitout:0',
      'fitout:1',
    ]);
    for (const id of ['structure', 'envelope', 'fitout'] as const) {
      expect(STAGES.find((s) => s.id === id)?.parts).toBe(
        PROCESS_STEP_STAGES.filter((s) => s.stage === id).length,
      );
    }
  });

  it('shows the window beside About, Process, Work delivered, Services and Projects only', () => {
    const shown = SECTIONS.filter((s) => isSiteWindowVisible(s.sectionId)).map((s) => s.sectionId);
    expect(shown).toEqual(['foundation', 'fitout', 'completion', 'structure', 'envelope']);
    expect(isSiteWindowVisible('about')).toBe(true);
  });

  it('holds the finished building while Services and Projects are read', () => {
    expect(getStageInView('hero')).toBe('survey');
    expect(getStageInView('foundation')).toBe('foundation');
    expect(getStageInView('structure')).toBe('completion');
    expect(getStageInView('envelope')).toBe('completion');
  });

  it('lists indicator sections in page order and resolves the about alias', () => {
    expect(NAV_SECTIONS.map((s) => s.navLabel)).toEqual([
      'Principles',
      'Process',
      'Track record',
      'Services',
      'Projects',
      'Contact',
    ]);
    expect(getSectionById('about')?.sectionId).toBe('foundation');
  });
});
