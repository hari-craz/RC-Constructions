export interface ProjectItem {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly category: string;
  readonly location: string;
  readonly year: string;
  readonly builtArea: string;
  readonly outcome: string;
}

export interface ProjectsContent {
  readonly kicker: string;
  readonly title: string;
  readonly registerCode: string;
  readonly projects: readonly ProjectItem[];
}

export const PROJECTS_CONTENT: ProjectsContent = {
  kicker: 'Section 04 — Envelope',
  title: 'Selected Projects Register',
  registerCode: 'REG-PRJ-01',
  projects: [
    {
      id: 'project-residential-enclave',
      number: '01',
      name: 'South Enclave Residences',
      category: 'Residential',
      location: 'South Suburban Sector // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '14,200 sq ft // PLACEHOLDER',
      outcome: 'Four storeys, eight family apartments, delivered in 14 months // PLACEHOLDER',
    },
    {
      id: 'project-commercial-tower',
      number: '02',
      name: 'Apex Commercial Chambers',
      category: 'Commercial',
      location: 'Central Ring Road // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '28,500 sq ft // PLACEHOLDER',
      outcome:
        'Five floors of office bays and basement parking, completed in 18 months // PLACEHOLDER',
    },
    {
      id: 'project-industrial-warehouse',
      number: '03',
      name: 'Corridor Logistics Hub',
      category: 'Industrial',
      location: 'Western Industrial Zone // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '45,000 sq ft // PLACEHOLDER',
      outcome:
        'Steel portal frame warehouse with heavy laser-screed flooring in 10 months // PLACEHOLDER',
    },
    {
      id: 'project-institutional-campus',
      number: '04',
      name: 'St. Jude Educational Block',
      category: 'Institutional',
      location: 'East District Hub // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '22,000 sq ft // PLACEHOLDER',
      outcome:
        'Classrooms, laboratory wings, and central assembly courtyard in 12 months // PLACEHOLDER',
    },
    {
      id: 'project-infrastructure-culvert',
      number: '05',
      name: 'Industrial Trunk Road & Drain',
      category: 'Infrastructure',
      location: 'North Bypass Sector // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '1.8 km road length // PLACEHOLDER',
      outcome: 'Reinforced stormwater box culverts and asphalt pavement in 8 months // PLACEHOLDER',
    },
    {
      id: 'project-heritage-renovation',
      number: '06',
      name: 'Old Town Heritage Remodel',
      category: 'Renovation & Remodelling',
      location: 'Civil Station Ward // PLACEHOLDER',
      year: '20XX // PLACEHOLDER',
      builtArea: '8,600 sq ft // PLACEHOLDER',
      outcome:
        'Column jacketing, floor beam strengthening, and facade repair in 6 months // PLACEHOLDER',
    },
  ],
};
