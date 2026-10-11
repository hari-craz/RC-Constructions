interface ServiceItem {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly scope: string;
  readonly typicalWork: string;
}

export interface ServicesContent {
  readonly kicker: string;
  readonly title: string;
  readonly scheduleCode: string;
  readonly services: readonly ServiceItem[];
}

export const SERVICES_CONTENT: ServicesContent = {
  kicker: 'Section 03 — Structure',
  title: 'Services & Construction Schedule',
  scheduleCode: 'DWG-SCH-01',
  services: [
    {
      id: 'residential',
      number: '01',
      name: 'Residential',
      scope: 'Individual houses, duplex villas, and multi-unit residential apartment blocks.',
      typicalWork:
        'RCC framed structures, load-bearing masonry, roof slab casting, and compound walls.',
    },
    {
      id: 'commercial',
      number: '02',
      name: 'Commercial',
      scope: 'Corporate offices, commercial complexes, retail units, and automotive showrooms.',
      typicalWork:
        'Large-span post-tensioned slabs, glazing substructures, core shafts, and basement parking.',
    },
    {
      id: 'industrial',
      number: '03',
      name: 'Industrial',
      scope: 'Manufacturing facilities, logistics warehouses, and heavy fabrication sheds.',
      typicalWork:
        'Heavy equipment raft foundations, pre-engineered steel framing, and laser-screed floor slabs.',
    },
    {
      id: 'institutional',
      number: '04',
      name: 'Institutional',
      scope: 'Educational institutions, community healthcare clinics, and public gathering halls.',
      typicalWork:
        'Wide-span corridors, durable masonry walling, compliant stair towers, and boundary infrastructure.',
    },
    {
      id: 'infrastructure',
      number: '05',
      name: 'Infrastructure',
      scope:
        'Internal site access roads, stormwater drainage culverts, and industrial compound works.',
      typicalWork:
        'Asphalt paving, reinforced concrete box culverts, retaining walls, and earth stabilization.',
    },
    {
      id: 'renovation',
      number: '06',
      name: 'Renovation & Remodelling',
      scope:
        'Structural strengthening, additional floor additions, and complete interior reconfiguration.',
      typicalWork:
        'Concrete jacket retrofitting, masonry opening modifications with propping, and roof re-decking.',
    },
    {
      id: 'interiors',
      number: '07',
      name: 'Interiors & Fit-out',
      scope: 'Drywall partitioning, architectural masonry enclosures, and MEP integration.',
      typicalWork:
        'Acoustic wall partitions, floor screeding and tiling, electrical conduits, and sanitary lines.',
    },
    {
      id: 'project-management',
      number: '08',
      name: 'Project Management & Turnkey Delivery',
      scope: 'Single-point execution responsibility from initial survey pegging to key handover.',
      typicalWork:
        'Statutory approval coordination, daily progress reporting, materials quality testing, and safety audits.',
    },
  ],
};
