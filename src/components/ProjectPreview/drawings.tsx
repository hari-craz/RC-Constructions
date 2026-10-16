import type { ReactNode } from 'react';
import './ProjectPreview.css';

/*
 * Six original monochrome drawings, one per sample project, in the same three-weight line system
 * as the building (heavy cut, medium line, hairline). Shared frame: viewBox 1000 x 800, ground
 * line at y = 640, drawn far beyond the frame so it always runs the full window width.
 */
const GROUND = 640;

function Ground({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect className="pv-soil" x={-4000} y={GROUND} width={9000} height={4000} />
      {children}
      <line className="pv-ground" x1={-4000} y1={GROUND} x2={5000} y2={GROUND} />
    </>
  );
}

/** Caption sits top left of every drawing, in the empty sky, so it is never cropped. */
function Label({ children }: { children: ReactNode }) {
  return (
    <text className="pv-label" x={0} y={60}>
      {children}
    </text>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** 01 Residential: four-storey block on pilotis with bored piles. */
function Residential() {
  const slabs = [530, 416, 302, 188]; // top of each slab; the wall of the storey stands on it
  const wall = 100;
  const FIRST_SLAB = 530;
  const TOP_SLAB = 188;
  const pilotis = [200, 380, 560, 740];
  return (
    <>
      <Ground>
        {pilotis.map((x) => (
          <g key={x}>
            <line className="pv-line" x1={x + 8} y1={GROUND} x2={x + 8} y2={GROUND + 120} />
            <line className="pv-line" x1={x + 40} y1={GROUND} x2={x + 40} y2={GROUND + 120} />
            <rect className="pv-cut" x={x - 8} y={GROUND + 14} width={64} height={22} />
          </g>
        ))}
      </Ground>
      {pilotis.map((x) => (
        <rect
          key={x}
          className="pv-member"
          x={x + 12}
          y={FIRST_SLAB + 14}
          width={24}
          height={GROUND - FIRST_SLAB - 14}
        />
      ))}
      {slabs.map((y) => (
        <g key={y}>
          <rect className="pv-cut" x={170} y={y} width={640} height={14} />
          <rect className="pv-wall" x={190} y={y - wall} width={600} height={wall} />
          {range(4).map((w) => (
            <g key={w}>
              <rect className="pv-open" x={222 + w * 150} y={y - 78} width={86} height={52} />
              <rect className="pv-glass" x={227 + w * 150} y={y - 73} width={76} height={42} />
              <path
                className="pv-hair"
                d={`M${214 + w * 150} ${y - 44}V${y}M${316 + w * 150} ${y - 44}V${y}`}
              />
            </g>
          ))}
        </g>
      ))}
      <rect className="pv-cut" x={160} y={TOP_SLAB - wall - 14} width={660} height={14} />
      <Label>Section through the piled frame</Label>
    </>
  );
}

/** 02 Commercial: five-storey glazed office over a shored basement with a live main alongside. */
function Commercial() {
  const floors = range(6).map((i) => 604 - i * 100);
  return (
    <>
      <Ground>
        <rect className="pv-void" x={230} y={GROUND} width={500} height={110} />
        {range(11).map((i) => (
          <rect key={i} className="pv-member" x={218 + i * 50} y={GROUND} width={10} height={130} />
        ))}
        <circle className="pv-pipe" cx={800} cy={GROUND + 60} r={22} />
        <circle className="pv-pipe" cx={800} cy={GROUND + 60} r={9} />
        <rect className="pv-cut" x={230} y={GROUND + 100} width={500} height={14} />
      </Ground>
      {floors.map((y) => (
        <rect key={y} className="pv-cut" x={250} y={y} width={460} height={12} />
      ))}
      {range(9).map((i) => (
        <line key={i} className="pv-line" x1={290 + i * 45} y1={104} x2={290 + i * 45} y2={604} />
      ))}
      {floors.slice(0, 5).map((y) => (
        <path key={y} className="pv-hair" d={`M262 ${y - 50}H698`} />
      ))}
      <rect className="pv-cut" x={700} y={104} width={60} height={536} />
      <rect className="pv-open" x={712} y={150} width={36} height={420} />
      <Label>Basement shoring beside the water main</Label>
    </>
  );
}

/** 03 Industrial: steel portal frames with Warren roof trusses, cladding, dock doors and floor slab. */
function Industrial() {
  const xs = [140, 380, 620, 860];
  const BAY = 240;
  const EAVE = 330;
  const RISE = 80;
  // Height of the top chord above the eaves at distance u along a bay
  const top = (u: number) => EAVE - (RISE * Math.min(u, BAY - u)) / (BAY / 2);
  const nodes = range(7).map((i) => i * 40);
  return (
    <>
      <Ground>
        <rect className="pv-cut" x={100} y={GROUND} width={820} height={16} />
      </Ground>
      {xs.map((x) => (
        <rect key={x} className="pv-member" x={x} y={EAVE} width={14} height={310} />
      ))}
      {xs.slice(0, 3).map((x) => {
        const o = x + 7;
        return (
          <g key={x}>
            <path
              className="pv-edge"
              d={`M${o} ${EAVE}L${o + BAY / 2} ${EAVE - RISE}L${o + BAY} ${EAVE}`}
            />
            <path className="pv-line" d={`M${o} ${EAVE}H${o + BAY}`} />
            <path
              className="pv-hair"
              d={nodes
                .slice(1, -1)
                .map((u) => `M${o + u} ${EAVE}V${top(u)}`)
                .join('')}
            />
            <path
              className="pv-hair"
              d={nodes
                .slice(0, -1)
                .map((u) =>
                  u < BAY / 2
                    ? `M${o + u} ${EAVE}L${o + u + 40} ${top(u + 40)}`
                    : `M${o + u} ${top(u)}L${o + u + 40} ${EAVE}`,
                )
                .join('')}
            />
            <rect className="pv-wall" x={x + 14} y={420} width={226} height={220} />
            <rect className="pv-open" x={x + 60} y={500} width={130} height={140} />
            <path
              className="pv-hair"
              d={`M${x + 60} 530H${x + 190}M${x + 60} 560H${x + 190}M${x + 60} 590H${x + 190}M${x + 60} 620H${x + 190}`}
            />
          </g>
        );
      })}
      <Label>Portal frames, roof trusses and the floor slab</Label>
    </>
  );
}

/** 04 Institutional: three-storey school block with a cantilevered verandah and louvres. */
function Institutional() {
  const floors = [584, 436, 288];
  return (
    <>
      <Ground>
        <rect className="pv-cut" x={150} y={GROUND} width={700} height={14} />
      </Ground>
      {floors.map((y) => (
        <g key={y}>
          <rect className="pv-cut" x={150} y={y} width={700} height={14} />
          <rect className="pv-cut" x={104} y={y - 20} width={80} height={10} />
          <rect className="pv-wall" x={184} y={y - 124} width={666} height={124} />
          {range(5).map((w) => (
            <g key={w}>
              <rect className="pv-open" x={210 + w * 130} y={y - 96} width={96} height={64} />
              {range(6).map((f) => (
                <line
                  key={f}
                  className="pv-hair"
                  x1={218 + w * 130 + f * 15}
                  y1={y - 94}
                  x2={218 + w * 130 + f * 15}
                  y2={y - 34}
                />
              ))}
            </g>
          ))}
          <line className="pv-line" x1={104} y1={y - 20} x2={104} y2={y - 76} />
          <line className="pv-hair" x1={104} y1={y - 70} x2={184} y2={y - 70} />
        </g>
      ))}
      <rect className="pv-cut" x={140} y={256} width={720} height={22} />
      {[110, 240, 700].map((x) => (
        <rect key={x} className="pv-member" x={x} y={GROUND - 60} width={14} height={60} />
      ))}
      <path className="pv-line" d="M20 640V580M20 600H100M60 640V580M60 600H100" />
      <Label>Block with a cantilevered verandah and fixed louvres</Label>
    </>
  );
}

/** 05 Infrastructure: road pavement layers over a twin-cell box culvert, in section. */
function Infrastructure() {
  const lamp = (x: number) => (
    <g key={x}>
      <line className="pv-line" x1={x} y1={GROUND - 24} x2={x} y2={300} />
      <path className="pv-line" d={`M${x} 300H${x + 70}`} />
      <rect className="pv-cut" x={x + 60} y={296} width={26} height={8} />
    </g>
  );
  return (
    <>
      <Ground>
        {/* pavement layers: wearing course, base, sub-base */}
        <rect className="pv-cut" x={60} y={GROUND} width={880} height={8} />
        <rect className="pv-member" x={60} y={GROUND + 8} width={880} height={18} />
        <rect className="pv-wall" x={60} y={GROUND + 26} width={880} height={24} />
        {/* twin-cell box culvert: roof slab, two cells, centre wall, base slab */}
        <rect className="pv-void" x={300} y={GROUND + 64} width={190} height={60} />
        <rect className="pv-void" x={530} y={GROUND + 64} width={190} height={60} />
        <rect className="pv-cut" x={280} y={GROUND + 50} width={460} height={14} />
        <rect className="pv-cut" x={280} y={GROUND + 124} width={460} height={14} />
        <rect className="pv-member" x={280} y={GROUND + 64} width={20} height={60} />
        <rect className="pv-member" x={490} y={GROUND + 64} width={40} height={60} />
        <rect className="pv-member" x={720} y={GROUND + 64} width={20} height={60} />
        <path className="pv-hair" d={`M310 ${GROUND + 94}H480M540 ${GROUND + 94}H710`} />
      </Ground>
      {/* kerbs, centre line and street lights above the carriageway */}
      <rect className="pv-cut" x={40} y={GROUND - 28} width={34} height={28} />
      <rect className="pv-cut" x={926} y={GROUND - 28} width={34} height={28} />
      <path
        className="pv-hair"
        d={`M110 ${GROUND - 2}H190M250 ${GROUND - 2}H330M390 ${GROUND - 2}H470M530 ${GROUND - 2}H610M670 ${GROUND - 2}H750M810 ${GROUND - 2}H890`}
      />
      {lamp(120)}
      {lamp(780)}
      <Label>Road layers over a twin box culvert</Label>
    </>
  );
}

/** 06 Heritage: arched brick facade with pilasters, needle beams and raking props. */
function Heritage() {
  return (
    <>
      <Ground />
      <rect className="pv-wall" x={220} y={190} width={560} height={450} />
      <rect className="pv-cut" x={200} y={170} width={600} height={26} />
      <path className="pv-edge" d="M200 170H800" />
      {[220, 764].map((x) => (
        <rect key={x} className="pv-member" x={x} y={196} width={16} height={444} />
      ))}
      {range(3).map((i) =>
        range(2).map((j) => (
          <path
            key={`${i}-${j}`}
            className="pv-open"
            d={`M${300 + i * 150} ${300 + j * 170}V${240 + j * 170}A33 33 0 0 1 ${366 + i * 150} ${240 + j * 170}V${300 + j * 170}Z`}
          />
        )),
      )}
      <path className="pv-open" d="M450 640V520A50 50 0 0 1 550 520V640Z" />
      <path className="pv-hair" d="M220 360H780M220 530H780" />
      {/* needle beam through the wall, carried on a dead shore at each end */}
      <rect className="pv-cut" x={90} y={336} width={820} height={16} />
      {[100, 884].map((x) => (
        <g key={x}>
          <rect className="pv-member" x={x} y={352} width={16} height={GROUND - 352} />
          <rect className="pv-cut" x={x - 16} y={GROUND - 12} width={48} height={12} />
          <path className="pv-hair" d={`M${x + 8} 366L${x + 8 + (x < 500 ? 60 : -60)} 352`} />
        </g>
      ))}
      <Label>Facade held on needle beams while the frame is strengthened</Label>
    </>
  );
}

/** Slug to drawing, keyed by project slug (src/content/projects.ts). */
const DRAWINGS: Record<string, () => ReactNode> = {
  'residential-enclave': Residential,
  'commercial-tower': Commercial,
  'industrial-warehouse': Industrial,
  'institutional-campus': Institutional,
  'infrastructure-culvert': Infrastructure,
  'heritage-renovation': Heritage,
};

export default function ProjectDrawing({ slug }: { slug: string }) {
  const Drawing = DRAWINGS[slug];
  if (!Drawing) return null;
  return (
    <svg
      className="pv-svg"
      viewBox="-20 0 1040 800"
      preserveAspectRatio="xMidYMax meet"
      role="presentation"
      focusable="false"
      data-drawing={slug}
    >
      <Drawing />
    </svg>
  );
}
