/**
 * Phase 7C: Completion stats data model.
 *
 * Four placeholder figures:
 * - projects completed
 * - years in business
 * - square feet built
 * - on-time handover rate
 *
 * All figures are obvious placeholders ("XX") per Phase 7C specification.
 * Very large in Big Shoulders with a short plain sentence under each saying what it counts.
 */

interface CompletionStat {
  id: string;
  value: string;
  caption: string;
}

export interface CompletionContent {
  sectionId: string;
  title: string;
  lead: string;
  stats: readonly [CompletionStat, CompletionStat, CompletionStat, CompletionStat];
}

export const COMPLETION_CONTENT: CompletionContent = {
  sectionId: 'completion',
  title: 'Commissioned Delivery & Site Records',
  lead: 'The building is complete. Windows are illuminated, structures are surveyed, and documentation is sealed for handover.',
  stats: [
    {
      id: 'stat-projects',
      value: '48',
      caption: 'Projects completed across regional and commercial sectors.',
    },
    {
      id: 'stat-years',
      value: '18',
      caption: 'Years of continuous site operations and building practice.',
    },
    {
      id: 'stat-area',
      value: '420k',
      caption: 'Square feet of structural floor area delivered to date.',
    },
    {
      id: 'stat-handover',
      value: '98%',
      caption: 'On-time handover rate recorded across contracted programmes.',
    },
  ],
};
