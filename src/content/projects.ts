interface ProjectGallerySlot {
  id: string;
  caption: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  number: string;
  name: string;
  type: string;
  /** Area and city. */
  location: string;
  year: string;
  builtArea: string;
  duration: string;
  clientType: string;
  /** The one specific problem the site presented. */
  challenge: string;
  /** What the company did about it. */
  response: string;
  /** What came out of it, in plain terms. */
  outcome: string;
  gallery: ProjectGallerySlot[];
}

export interface ProjectsContent {
  sectionId: string;
  title: string;
  /** One quiet line shown once for the whole set. */
  sampleNote: string;
  projects: ProjectItem[];
}

/*
 * SAMPLE CONTENT. These six records are written for this demo and describe no real client.
 * Replace them with real projects before launch (docs/CONTENT-INTAKE.md, "Projects"):
 * one entry per project, photos named by the gallery ids below.
 */
export const PROJECTS_CONTENT: ProjectsContent = {
  sectionId: 'projects',
  title: 'Selected projects',
  sampleNote: 'Sample projects for this demo.',
  projects: [
    {
      id: 'project-residential-enclave',
      slug: 'residential-enclave',
      number: '01',
      name: 'South Enclave Residences',
      type: 'Residential',
      location: 'Eastern suburb, Chennai',
      year: '2024',
      builtArea: '14,200 sq ft',
      duration: '14 months',
      clientType: 'Family group',
      challenge:
        'The plot sat on soft alluvial soil beside a seasonal stream, with groundwater about a metre and a half below the surface.',
      response:
        'We bored eighteen piles and tied them with grade beams, and pumped the pile cap excavations dry before each pour. The ground floor was left open for parking.',
      outcome: 'Eight flats on four floors, handed over after a joint snag walk with the owners.',
      gallery: [
        { id: 'gallery-res-1', caption: 'Pile cap reinforcement before the pour' },
        { id: 'gallery-res-2', caption: 'Second-floor slab shuttering' },
        { id: 'gallery-res-3', caption: 'Terrace screed and brick infill' },
      ],
    },
    {
      id: 'project-commercial-tower',
      slug: 'commercial-tower',
      number: '02',
      name: 'Apex Commercial Chambers',
      type: 'Commercial',
      location: 'Central business district, Chennai',
      year: '2023',
      builtArea: '28,500 sq ft',
      duration: '18 months',
      clientType: 'Private company',
      challenge:
        'The basement excavation ran two metres from a live water main and telecom ducts, on a street that could not be closed.',
      response:
        'We shored the cut with soldier piles, exposed and propped the main, and read settlement pegs each morning. Post-tensioned slabs gave open office floors.',
      outcome: 'A five-storey office block with one level of basement parking.',
      gallery: [
        { id: 'gallery-com-1', caption: 'Soldier pile shoring beside the water main' },
        { id: 'gallery-com-2', caption: 'Post-tensioning cables on the second floor' },
        { id: 'gallery-com-3', caption: 'Lift core wall formwork at roof level' },
      ],
    },
    {
      id: 'project-industrial-warehouse',
      slug: 'industrial-warehouse',
      number: '03',
      name: 'Corridor Logistics Hub',
      type: 'Industrial',
      location: 'Western industrial estate, Coimbatore',
      year: '2023',
      builtArea: '45,000 sq ft',
      duration: '10 months',
      clientType: 'Logistics operator',
      challenge:
        'Reach trucks need a very flat floor, and the floor slab had to be cast while the monsoon was still on.',
      response:
        'We erected the steel frame and roof sheeting first, then cast the slab in bays under cover. A laser screed set the levels and joints were saw-cut the next day.',
      outcome: 'A twenty-four bay warehouse with a floor ready for racking.',
      gallery: [
        { id: 'gallery-ind-1', caption: 'Footing layout and holding-down bolts' },
        { id: 'gallery-ind-2', caption: 'Portal frame erection' },
        { id: 'gallery-ind-3', caption: 'Laser screed pass on a floor bay' },
      ],
    },
    {
      id: 'project-institutional-campus',
      slug: 'institutional-campus',
      number: '04',
      name: 'Lakeside School Block',
      type: 'Institutional',
      location: 'Eastern district, Madurai',
      year: '2022',
      builtArea: '22,000 sq ft',
      duration: '12 months',
      clientType: 'Trust-run school',
      challenge:
        'The new block went up inside a working school campus, with children crossing the site daily.',
      response:
        'We fenced the works from the playground, gave deliveries a separate gate, and kept noisy work to hours agreed with the school. Laboratory services were laid in shafts before the slabs.',
      outcome: 'Sixteen classrooms and three laboratories, in use from the next school year.',
      gallery: [
        { id: 'gallery-inst-1', caption: 'Hoarding between the site and the playground' },
        { id: 'gallery-inst-2', caption: 'Corridor beam reinforcement' },
        { id: 'gallery-inst-3', caption: 'Concrete louvres on the west face' },
      ],
    },
    {
      id: 'project-infrastructure-culvert',
      slug: 'infrastructure-culvert',
      number: '05',
      name: 'Industrial Trunk Road and Drain',
      type: 'Infrastructure',
      location: 'North bypass, Salem',
      year: '2021',
      builtArea: '1.8 km of road',
      duration: '8 months',
      clientType: 'Industrial park authority',
      challenge:
        'The road crossed black cotton soil, which swells in the wet season and cracks road surfaces built straight on it.',
      response:
        'We trialled lime stabilisation on a test strip, laid the sub-base in layers with density checks, and cast two box culverts for the stormwater crossing before paving.',
      outcome: 'A dual-lane road with a paired box culvert, opened to trucks at month eight.',
      gallery: [
        { id: 'gallery-infra-1', caption: 'Culvert base slab reinforcement' },
        { id: 'gallery-infra-2', caption: 'Lime-treated sub-grade under the roller' },
        { id: 'gallery-infra-3', caption: 'Wearing course and kerb channel' },
      ],
    },
    {
      id: 'project-heritage-renovation',
      slug: 'heritage-renovation',
      number: '06',
      name: 'Old Town House Remodel',
      type: 'Renovation',
      location: 'Old town ward, Tiruchirappalli',
      year: '2020',
      builtArea: '8,600 sq ft',
      duration: '6 months',
      clientType: 'Owner-occupier',
      challenge:
        'A load-bearing brick house from the early twentieth century had cracked piers and rotted timber floors, and the owners wanted the street facade kept.',
      response:
        'We propped the floors on needle beams, wrapped the weakest piers in reinforced micro-concrete, and replaced the timber floors with steel joists behind the original facade.',
      outcome: 'A three-storey house with a strengthened frame and its street face unchanged.',
      gallery: [
        { id: 'gallery-herit-1', caption: 'Needle beams and props under the first floor' },
        { id: 'gallery-herit-2', caption: 'Micro-concrete jacket around a brick pier' },
        { id: 'gallery-herit-3', caption: 'Steel joists laid for the new floor' },
      ],
    },
  ],
};

export function getProjectBySlug(slug: string): ProjectItem | undefined {
  return PROJECTS_CONTENT.projects.find((p) => p.slug === slug || p.id === slug);
}

export function getProjectById(id: string): ProjectItem | undefined {
  return PROJECTS_CONTENT.projects.find((p) => p.id === id || p.slug === id);
}
