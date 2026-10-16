import { COMPANY, hasContent } from './company';

interface CompletionStat {
  id: string;
  value: string;
  caption: string;
}

interface HandoverItem {
  id: string;
  title: string;
  text: string;
}

export interface CompletionContent {
  sectionId: string;
  title: string;
  lead: string;
  handoverTitle: string;
  handover: readonly HandoverItem[];
  /** Figures the company has supplied in company.ts; empty until then (the band is hidden). */
  stats: readonly CompletionStat[];
}

function buildStats(): CompletionStat[] {
  const f = COMPANY.facts;
  const stats: CompletionStat[] = [];
  if (hasContent(f.projectsCompleted)) {
    stats.push({
      id: 'stat-projects',
      value: String(f.projectsCompleted),
      caption: 'Projects completed.',
    });
  }
  if (hasContent(f.yearsInBusiness)) {
    stats.push({
      id: 'stat-years',
      value: String(f.yearsInBusiness),
      caption: 'Years in business.',
    });
  }
  if (hasContent(f.areaBuiltSqFt)) {
    stats.push({ id: 'stat-area', value: String(f.areaBuiltSqFt), caption: 'Square feet built.' });
  }
  if (hasContent(f.onTimeHandoverPercent)) {
    stats.push({
      id: 'stat-handover',
      value: `${f.onTimeHandoverPercent}%`,
      caption: 'Projects handed over on the agreed date.',
    });
  }
  return stats;
}

export const COMPLETION_CONTENT: CompletionContent = {
  sectionId: 'completion',
  title: 'Work delivered',
  lead: 'A building is finished when it has been tested, walked through with you and handed over with its records.',
  handoverTitle: 'What a handover includes',
  handover: [
    {
      id: 'handover-drawings',
      title: 'As-built drawings',
      text: 'Structural drawings updated to what was built.',
    },
    {
      id: 'handover-tests',
      title: 'Test records',
      text: 'Concrete cube results and system test records.',
    },
    {
      id: 'handover-walkthrough',
      title: 'Walk-through',
      text: 'A site walk with you, with any snags listed.',
    },
    {
      id: 'handover-keys',
      title: 'Keys',
      text: 'Keys handed over once the snag list is agreed.',
    },
  ],
  stats: buildStats(),
};
