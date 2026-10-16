import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from 'react';
import './HeroPlot.css';

export interface HeroPlotHandle {
  svgElement: SVGSVGElement | null;
  boundaryPath: SVGPathElement | null;
  stakes: SVGGElement | null;
  setbackPath: SVGPathElement | null;
  footprintPath: SVGPathElement | null;
  gridGroup: SVGGElement | null;
  dimensionLines: SVGPathElement[];
  dimensionLabels: SVGGElement[];
}

export interface HeroPlotProps {
  className?: string;
}

export const HeroPlot = forwardRef<HeroPlotHandle, HeroPlotProps>(function HeroPlot(
  { className = '' },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boundaryRef = useRef<SVGPathElement | null>(null);
  const stakesRef = useRef<SVGGElement | null>(null);
  const setbackRef = useRef<SVGPathElement | null>(null);
  const footprintRef = useRef<SVGPathElement | null>(null);
  const gridRef = useRef<SVGGElement | null>(null);
  const dimLineRefs = useRef<(SVGPathElement | null)[]>([]);
  const dimLabelRefs = useRef<(SVGGElement | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      svgElement: svgRef.current,
      boundaryPath: boundaryRef.current,
      stakes: stakesRef.current,
      setbackPath: setbackRef.current,
      footprintPath: footprintRef.current,
      gridGroup: gridRef.current,
      dimensionLines: dimLineRefs.current.filter((el): el is SVGPathElement => el !== null),
      dimensionLabels: dimLabelRefs.current.filter((el): el is SVGGElement => el !== null),
    }),
    [],
  );

  // 3x4 column grid coordinates within footprint (x: 510..850, y: 200..580)
  const gridCols = [590, 680, 770];
  const gridRows = [275, 355, 435, 515];

  return (
    <div className={`hero-plot-container ${className}`.trim()} aria-hidden="true">
      <svg
        ref={svgRef}
        className="hero-plot-svg"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        focusable="false"
      >
        {/* Layer 1: Irregular Plot Boundary */}
        <path
          ref={boundaryRef}
          className="hero-plot-boundary"
          d="M 360 90 L 890 50 L 960 680 L 420 720 Z"
          pathLength="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Layer 2: Corner Survey Stakes */}
        <g ref={stakesRef} className="hero-plot-stakes">
          {[
            [360, 90],
            [890, 50],
            [960, 680],
            [420, 720],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx}, ${cy})`}>
              <rect x="-6" y="-6" width="12" height="12" className="hero-stake-rect" />
              <circle cx="0" cy="0" r="1.5" className="hero-stake-pip" />
            </g>
          ))}
        </g>

        {/* Layer 3: Dashed Setback Lines */}
        <path
          ref={setbackRef}
          className="hero-plot-setback"
          d="M 425 150 L 835 115 L 895 625 L 475 660 Z"
          pathLength="1"
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
        />

        {/* Layer 4: Building Footprint */}
        <path
          ref={footprintRef}
          className="hero-plot-footprint"
          d="M 510 200 L 850 200 L 850 580 L 510 580 Z"
          pathLength="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Layer 5: Column Grid Crosses */}
        <g ref={gridRef} className="hero-plot-grid">
          {gridCols.map((x) =>
            gridRows.map((y, r) => (
              <g
                key={`${x}-${y}`}
                className="hero-grid-cross"
                style={
                  { '--cross-index': gridCols.indexOf(x) * gridRows.length + r } as CSSProperties
                }
                transform={`translate(${x}, ${y})`}
              >
                <line x1="-8" y1="0" x2="8" y2="0" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="-8" x2="0" y2="8" vectorEffect="non-scaling-stroke" />
              </g>
            )),
          )}
        </g>

        {/* Layer 6: Dimensions & Extension Ticks (Amber) */}
        <g className="hero-plot-dimensions">
          {/* Primary Width Dimension (18.40 m) */}
          <path
            ref={(el) => {
              dimLineRefs.current[0] = el;
            }}
            className="hero-dim-line"
            d="M 510 615 L 850 615 M 510 590 L 510 635 M 850 590 L 850 635"
            pathLength="1"
            vectorEffect="non-scaling-stroke"
          />
          <g
            ref={(el) => {
              dimLabelRefs.current[0] = el;
            }}
            className="hero-dim-label-group"
            style={{ '--label-index': 0 } as CSSProperties}
            transform="translate(680, 615)"
          >
            <rect x="-44" y="-14" width="88" height="28" rx="2" className="hero-dim-badge" />
            <text x="0" y="5" textAnchor="middle" className="hero-dim-text">
              18.40 m
            </text>
          </g>

          {/* Lateral Depth Dimension (24.80 m) - Hidden on narrow mobile viewports */}
          <path
            ref={(el) => {
              dimLineRefs.current[1] = el;
            }}
            className="hero-dim-line hero-dim-lateral"
            d="M 885 200 L 885 580 M 860 200 L 905 200 M 860 580 L 905 580"
            pathLength="1"
            vectorEffect="non-scaling-stroke"
          />
          <g
            ref={(el) => {
              dimLabelRefs.current[1] = el;
            }}
            className="hero-dim-label-group hero-dim-lateral"
            style={{ '--label-index': 1 } as CSSProperties}
            transform="translate(885, 390)"
          >
            <rect x="-44" y="-14" width="88" height="28" rx="2" className="hero-dim-badge" />
            <text x="0" y="5" textAnchor="middle" className="hero-dim-text">
              24.80 m
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
});
