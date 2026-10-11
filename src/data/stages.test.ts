import { describe, expect, it } from 'vitest';
import { getStageByProgress, getStageBySectionId, STAGES } from './stages';

describe('stages config', () => {
  it('contains exactly 6 strictly ordered building stages', () => {
    expect(STAGES).toHaveLength(6);
    const expectedIds = ['survey', 'foundation', 'structure', 'envelope', 'fitout', 'completion'];
    expect(STAGES.map((s) => s.id)).toEqual(expectedIds);
  });

  it('has unique sectionId anchors for every stage', () => {
    const sectionIds = STAGES.map((s) => s.sectionId);
    const uniqueIds = new Set(sectionIds);
    expect(uniqueIds.size).toBe(STAGES.length);
  });

  it('defines contiguous, non-overlapping scroll intervals spanning 0 to 1', () => {
    expect(STAGES[0]?.range[0]).toBe(0.0);
    expect(STAGES[STAGES.length - 1]?.range[1]).toBe(1.0);

    for (let i = 0; i < STAGES.length - 1; i++) {
      const current = STAGES[i];
      const next = STAGES[i + 1];
      if (!current || !next) continue;

      expect(current.range[1]).toBe(next.range[0]);
      expect(current.range[0]).toBeLessThan(current.range[1]);
    }
  });

  it('retrieves stages correctly by progress and section id', () => {
    expect(getStageByProgress(0.0).id).toBe('survey');
    expect(getStageByProgress(0.2).id).toBe('foundation');
    expect(getStageByProgress(0.4).id).toBe('structure');
    expect(getStageByProgress(0.6).id).toBe('envelope');
    expect(getStageByProgress(0.75).id).toBe('fitout');
    expect(getStageByProgress(0.95).id).toBe('completion');
    expect(getStageByProgress(1.0).id).toBe('completion');

    expect(getStageBySectionId('structure')?.name).toBe('Structure');
    expect(getStageBySectionId('nonexistent')).toBeUndefined();
  });
});
