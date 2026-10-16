interface ProjectGallerySlot {
  id: string;
  caption: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  number: string;
  name: string;
  category: string;
  location: string;
  year: string;
  builtArea: string;
  duration: string;
  role: string;
  brief: string;
  scope: string[];
  outcome: string;
  gallery: ProjectGallerySlot[];
}

export interface ProjectsContent {
  sectionId: string;
  title: string;
  projects: ProjectItem[];
}

// All project records below represent client portfolio placeholders to be replaced with verified records before live release.
export const PROJECTS_CONTENT: ProjectsContent = {
  sectionId: 'projects',
  title: 'Selected Projects Register',
  projects: [
    {
      id: 'project-residential-enclave',
      slug: 'residential-enclave',
      number: '01',
      name: 'South Enclave Residences',
      category: 'Residential',
      location: 'South Suburban Sector', // PLACEHOLDER: Location
      year: '2024', // Completion year
      builtArea: '14,200 sq ft', // PLACEHOLDER: Built area
      duration: '14 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'Constructed as a four-storey residential block comprising eight individual family units over ground-level vehicle bays. The assignment required reinforced concrete frame construction on alluvial ground conditions, necessitating cast-in-place bored piling and continuous grade beams. RC Constructions managed all structural formwork, masonry infill, electrical conduits, and service risers. The structural shell completed within fourteen months, allowing interior carpentry and finishing trades to commence on schedule.',
      scope: [
        'Installed eighteen bored piles and cast continuous reinforced concrete grade beams to support the four-storey superstructure.',
        'Poured cast-in-place concrete slabs and erected load-bearing brick masonry partitions across all living quarters.',
        'Completed concealed plumbing mains, electrical conduit routing, and terrace waterproofing before the seasonal rains.',
      ],
      outcome: 'Delivered eight residential units in 14 months',
      gallery: [
        {
          id: 'gallery-res-1',
          caption: 'Bored piling and grade beam rebar inspection',
        },
        {
          id: 'gallery-res-2',
          caption: 'Second-floor structural slab casting and formwork removal',
        },
        {
          id: 'gallery-res-3',
          caption: 'Exterior brick masonry completion and terrace screed',
        },
      ],
    },
    {
      id: 'project-commercial-tower',
      slug: 'commercial-tower',
      number: '02',
      name: 'Apex Commercial Chambers',
      category: 'Commercial',
      location: 'Central Ring Road', // PLACEHOLDER: Location
      year: '2023', // Completion year
      builtArea: '28,500 sq ft', // PLACEHOLDER: Built area
      duration: '18 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'A five-storey commercial office facility designed for open floor plates and basement vehicle parking. RC Constructions operated as the principal structural contractor, executing earth retention shoring, deep basement excavation, post-tensioned floor slabs, and twin passenger lift shafts. The tight site boundary along a major arterial road demanded phased material deliveries and night-shift concrete pours to maintain transit clearances throughout the eighteen-month construction sequence.',
      scope: [
        'Executed soldier pile shoring and basement excavation adjacent to active public utility lines.',
        'Constructed post-tensioned reinforced concrete slabs allowing column-free commercial office floor layouts.',
        'Cast reinforced concrete core walls for twin lift shafts and emergency egress stairs.',
      ],
      outcome: 'Completed 28,500 square feet of commercial space and basement parking in 18 months',
      gallery: [
        {
          id: 'gallery-com-1',
          caption: 'Basement retention shoring and excavation base slab',
        },
        {
          id: 'gallery-com-2',
          caption: 'Post-tensioned tendon placement across second office level',
        },
        {
          id: 'gallery-com-3',
          caption: 'Concrete core wall formwork jump sequence at roof height',
        },
      ],
    },
    {
      id: 'project-industrial-warehouse',
      slug: 'industrial-warehouse',
      number: '03',
      name: 'Corridor Logistics Hub',
      category: 'Industrial',
      location: 'Western Industrial Zone', // PLACEHOLDER: Location
      year: '2023', // Completion year
      builtArea: '45,000 sq ft', // PLACEHOLDER: Built area
      duration: '10 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'An industrial logistics warehouse featuring twenty-four bays of structural steel portal framing on reinforced pedestal footings. The facility required high-tolerance laser-screed concrete flooring to accommodate reach trucks and heavy static rack loadings. External works included reinforced concrete apron paving, heavy vehicle drainage trenches, and perimeter security walls. Construction completed in ten months through simultaneous foundation pours and off-site structural steel fabrication.',
      scope: [
        'Excavated and cast sixty-four isolated reinforced pedestal footings on compacted sub-base.',
        'Erected structural steel portal frames with hot-dip galvanised purlins and insulated sheeting.',
        'Installed laser-screed burnished concrete floor slab with steel fibre reinforcement.',
      ],
      outcome: 'Delivered 45,000 square feet industrial storage depot in 10 months',
      gallery: [
        {
          id: 'gallery-ind-1',
          caption: 'Pedestal footing layout and holding-down bolt alignment',
        },
        {
          id: 'gallery-ind-2',
          caption: 'Steel portal frame erection and bracing connection',
        },
        {
          id: 'gallery-ind-3',
          caption: 'Laser-screed burnished floor pour with joint saw-cutting',
        },
      ],
    },
    {
      id: 'project-institutional-campus',
      slug: 'institutional-campus',
      number: '04',
      name: 'St. Jude Educational Block',
      category: 'Institutional',
      location: 'East District Hub', // PLACEHOLDER: Location
      year: '2022', // Completion year
      builtArea: '22,000 sq ft', // PLACEHOLDER: Built area
      duration: '12 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'A three-storey academic building housing sixteen standard classrooms, physics and chemistry laboratories, administrative offices, and a central covered assembly quadrangle. Built within an active educational campus, the works required rigorous safety hoarding, noise controls during examination periods, and designated material corridors. The reinforced concrete framed structure features wide verandahs, exposed concrete sunshades, and durable stone flooring intended for heavy student footfall.',
      scope: [
        'Constructed reinforced concrete framed building with cantilevered verandah corridors.',
        'Integrated specialist laboratory plumbing, gas distribution pipework, and exhaust duct shafts.',
        'Poured cast-in-place concrete louvres and external architectural sunshade projections.',
      ],
      outcome: 'Handed over 22,000 square feet of academic and laboratory facilities in 12 months',
      gallery: [
        {
          id: 'gallery-inst-1',
          caption: 'Assembly quadrangle ground slab and column starter bars',
        },
        {
          id: 'gallery-inst-2',
          caption: 'Cantilevered corridor formwork and beam rebar tying',
        },
        {
          id: 'gallery-inst-3',
          caption: 'Finished classroom masonry and external concrete louvres',
        },
      ],
    },
    {
      id: 'project-infrastructure-culvert',
      slug: 'infrastructure-culvert',
      number: '05',
      name: 'Industrial Trunk Road & Drain',
      category: 'Infrastructure',
      location: 'North Bypass Sector', // PLACEHOLDER: Location
      year: '2021', // Completion year
      builtArea: '1.8 km road length', // PLACEHOLDER: Built area
      duration: '8 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'A heavy-duty civil infrastructure assignment encompassing 1.8 kilometres of dual-lane industrial road pavement and twin reinforced concrete box culverts. The alignment crossed low-lying drainage channels, requiring granular sub-base stabilisation, geotextile fabric installation, and precast concrete slab bridges. Stormwater runoff is managed by cast-in-place trapezoidal side drains leading into municipal discharge canals. The project finished within eight months ahead of the monsoon.',
      scope: [
        'Excavated and poured twin 2.4-metre reinforced concrete stormwater box culverts.',
        'Prepared sub-grade with lime stabilisation and laid wet-mix macadam base course.',
        'Paved dense bituminous macadam and wearing course with concrete kerb channels.',
      ],
      outcome: 'Completed 1.8 km heavy-haul pavement and stormwater drainage in 8 months',
      gallery: [
        {
          id: 'gallery-infra-1',
          caption: 'Twin box culvert base slab rebar and formwork installation',
        },
        {
          id: 'gallery-infra-2',
          caption: 'Sub-grade stabilisation and granular sub-base roller compaction',
        },
        {
          id: 'gallery-infra-3',
          caption: 'Bituminous wearing course paving and precast kerb edging',
        },
      ],
    },
    {
      id: 'project-heritage-renovation',
      slug: 'heritage-renovation',
      number: '06',
      name: 'Old Town Heritage Remodel',
      category: 'Renovation & Remodelling',
      location: 'Civil Station Ward', // PLACEHOLDER: Location
      year: '2020', // Completion year
      builtArea: '8,600 sq ft', // PLACEHOLDER: Built area
      duration: '6 months', // PLACEHOLDER: Contract duration
      role: 'Main contractor', // PLACEHOLDER: Role
      brief:
        'Structural remediation and internal remodel of a load-bearing masonry building dating from the early twentieth century. The brief called for column jacketing to reinforce distressed brick piers, replacing decayed timber floor joists with rolled structural steel sections, and damp-proof chemical injection along perimeter foundation footings. All temporary props and needle beams were monitored with dial gauges to protect fragile adjacent party walls throughout the six-month contract.',
      scope: [
        'Installed structural steel needle beams and temporary shoring across three storeys.',
        'Executed reinforced micro-concrete jacketing around ten load-bearing brick masonry piers.',
        'Replaced degraded timber floor framing with structural steel universal beams.',
      ],
      outcome: 'Strengthened 8,600 square feet of historical building envelope in 6 months',
      gallery: [
        {
          id: 'gallery-herit-1',
          caption: 'Temporary needle beam shoring and structural prop monitoring',
        },
        {
          id: 'gallery-herit-2',
          caption: 'Micro-concrete column jacketing and rebar cage anchoring',
        },
        {
          id: 'gallery-herit-3',
          caption: 'Structural steel floor beam placement and floor deck leveling',
        },
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
