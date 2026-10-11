# RC Constructions

A single-page scroll-driven portfolio for RC Constructions where a building structure is progressively assembled as the visitor scrolls.

## Tech Stack

- **Runtime**: Node >=22, pnpm 10
- **Framework**: React 19, Vite, TypeScript (strict mode)
- **Styling**: Hand-crafted CSS with custom properties (`src/styles/tokens.css`) — No Tailwind
- **Typography**: `@fontsource-variable/big-shoulders-display` (headings) and `@fontsource-variable/newsreader` (body)
- **Animation**: GSAP ScrollTrigger coordinated by Lenis smooth scroll
- **Testing**: Vitest, React Testing Library, Playwright, Axe Core
- **Quality**: ESLint, Prettier, Stylelint, Knip, Size-Limit, Husky, Commitlint

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open `http://localhost:5173` to view the application.

## Available Scripts

| Script              | Purpose                                                                                                      |
| :------------------ | :----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the local Vite development server                                                                      |
| `pnpm build`        | Compile TypeScript and create production bundle in `dist/`                                                   |
| `pnpm preview`      | Locally preview the production build                                                                         |
| `pnpm typecheck`    | Run TypeScript compiler checks (`tsc -b`)                                                                    |
| `pnpm lint`         | Run ESLint checks                                                                                            |
| `pnpm lint:fix`     | Run ESLint autofix                                                                                           |
| `pnpm lint:css`     | Run Stylelint checks across CSS files                                                                        |
| `pnpm format`       | Format repository files using Prettier                                                                       |
| `pnpm format:check` | Check code formatting without writing                                                                        |
| `pnpm test`         | Execute Vitest unit and DOM test suite                                                                       |
| `pnpm test:watch`   | Run Vitest in interactive watch mode                                                                         |
| `pnpm test:e2e`     | Run Playwright end-to-end tests and accessibility audits                                                     |
| `pnpm knip`         | Scan for unused files, exports, and dependencies                                                             |
| `pnpm size`         | Validate production bundle against 180 kB size limit                                                         |
| `pnpm check`        | Run all validation gates in order (`typecheck`, `lint`, `lint:css`, `format:check`, `test`, `knip`, `build`) |

## Project Structure

```
rc-constructions/
├── .husky/              # Git hooks (pre-commit, commit-msg)
├── docs/                # Architecture, design rules, and phase trackers
├── e2e/                 # Playwright end-to-end and axe a11y tests
├── public/              # Static public assets (favicon.svg)
├── src/
│   ├── app/             # Application providers and scroll wrapper
│   ├── assets/          # Static icons, blueprint textures, diagrams
│   ├── components/      # Reusable UI primitives
│   ├── content/         # Typed content schemas and datasets
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Scroll physics, GSAP, and utility helpers
│   ├── sections/        # Main portfolio sections
│   ├── styles/          # Design tokens (tokens.css) and base reset (base.css)
│   ├── test/            # Test setup and test utilities
│   ├── App.tsx          # Root application component
│   └── main.tsx         # Application entry point
├── index.html           # HTML entry template
├── playwright.config.ts # Playwright configuration
├── tsconfig.json        # TypeScript configuration root
└── vite.config.ts       # Vite & Vitest configuration
```

## Running Checks

Before submitting any code, verify all gates:

```bash
pnpm check
pnpm test:e2e
```
