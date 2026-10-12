import './Logo.css';

export interface LogoProps {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function Logo({ className = '', onClick }: LogoProps) {
  return (
    <a
      href="#hero"
      className={`logo ${className}`.trim()}
      aria-label="RC Constructions - Home"
      onClick={onClick}
    >
      <svg
        className="logo-mark"
        viewBox="0 0 64 64"
        width="32"
        height="32"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M4 4h56v56H4zM16 16h14c6.6 0 11 3.8 11 9.5 0 4.2-2.4 7.2-6.2 8.7L42 48h-8.2l-6.2-12H23v12h-7zm7 15h6.5c3 0 5-1.6 5-4.5s-2-4.5-5-4.5H23z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
      <span className="logo-wordmark">RC Constructions</span>
    </a>
  );
}
