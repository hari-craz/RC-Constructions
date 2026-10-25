import { useId } from 'react';
import { letterPath, MARK } from './markGeometry';
import './Logo.css';

export interface LogoProps {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/** The mark in one colour (the colour of the text around it): the letters are cut out of their blocks. */
export function Logo({ className = '', onClick }: LogoProps) {
  const maskId = useId();
  const { roof, chimney, walls, tiles, tileSize, letterStroke } = MARK;
  return (
    <a
      href="#hero"
      className={`logo ${className}`.trim()}
      aria-label="RC Constructions - Home"
      onClick={onClick}
    >
      <svg
        className="logo-mark"
        viewBox={MARK.viewBox}
        width="40"
        height="40"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" />
          {tiles.map((t) =>
            t.letter ? (
              <path
                key={`${t.x}-${t.y}`}
                d={letterPath(t.letter, t.x, t.y)}
                fill="none"
                stroke="black"
                strokeWidth={letterStroke}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null,
          )}
        </mask>
        <path d={roof.d} fill="none" stroke="currentColor" strokeWidth={roof.strokeWidth} />
        <rect {...chimney} fill="currentColor" />
        {walls.map((w) => (
          <rect key={`${w.x}-${w.y}`} {...w} fill="currentColor" />
        ))}
        <g mask={`url(#${maskId})`}>
          {tiles.map((t) =>
            t.letter ? (
              <rect
                key={`${t.x}-${t.y}`}
                x={t.x}
                y={t.y}
                width={tileSize}
                height={tileSize}
                rx="2.6"
                fill="currentColor"
              />
            ) : null,
          )}
        </g>
        {tiles.map((t) =>
          t.letter ? null : (
            <rect
              key={`${t.x}-${t.y}`}
              x={t.x + 0.7}
              y={t.y + 0.7}
              width={tileSize - 1.4}
              height={tileSize - 1.4}
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          ),
        )}
      </svg>
      <span className="logo-wordmark">RC Constructions</span>
    </a>
  );
}
