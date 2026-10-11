# RC Constructions

[![CI](https://github.com/hari-craz/RC-Constructions/actions/workflows/ci.yml/badge.svg)](https://github.com/hari-craz/RC-Constructions/actions/workflows/ci.yml)
[![Security](https://github.com/hari-craz/RC-Constructions/actions/workflows/security.yml/badge.svg)](https://github.com/hari-craz/RC-Constructions/actions/workflows/security.yml)
[![License: UNLICENSED](https://img.shields.io/badge/license-UNLICENSED-grey.svg)](LICENSE)

A single-page scroll-driven portfolio for RC Constructions where a building structure is progressively assembled as the visitor scrolls.

## Tech Stack

- **Runtime**: Node >=22 (pinned `~5.8` TS), pnpm 10
- **Framework**: React 19, Vite, TypeScript (strict mode)
- **Styling**: Hand-crafted CSS with custom properties (`src/styles/tokens.css`) — No Tailwind
- **Typography**: `@fontsource-variable/big-shoulders-display` (headings) and `@fontsource-variable/newsreader` (body)
- **Animation**: GSAP ScrollTrigger coordinated by Lenis smooth scroll
- **Testing**: Vitest, React Testing Library, Playwright, Axe Core
- **Quality & DevOps**: ESLint (pinned `^9`), Prettier, Stylelint, Knip, Size-Limit, Docker, GHCR, Vercel

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0
- Docker & Docker Compose (optional, for containerization)

### Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` to view the application.

### Docker Development & Production

```bash
# Development with hot-reload inside container
pnpm docker:dev
# or: docker compose --profile dev up

# Build production unprivileged container (optionally pass --build-arg VITE_FORMSPREE_ID=your_id)
pnpm docker:build

# Run production container locally on port 8080
pnpm docker:run
# or: docker compose --profile prod up
```

Container healthcheck is available at `http://localhost:8080/healthz`.

## Available Scripts

| Script                 | Purpose                                                                                                      |
| :--------------------- | :----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Start the local Vite development server                                                                      |
| `pnpm build`           | Compile TypeScript and create production bundle in `dist/`                                                   |
| `pnpm preview`         | Locally preview the production build                                                                         |
| `pnpm typecheck`       | Run TypeScript compiler checks (`tsc -b`)                                                                    |
| `pnpm lint`            | Run ESLint checks                                                                                            |
| `pnpm lint:fix`        | Run ESLint autofix                                                                                           |
| `pnpm lint:css`        | Run Stylelint checks across CSS files                                                                        |
| `pnpm format`          | Format repository files using Prettier                                                                       |
| `pnpm format:check`    | Check code formatting without writing                                                                        |
| `pnpm test`            | Execute Vitest unit and DOM test suite                                                                       |
| `pnpm test:watch`      | Run Vitest in interactive watch mode                                                                         |
| `pnpm test:e2e`        | Run Playwright end-to-end tests and accessibility audits                                                     |
| `pnpm knip`            | Scan for unused files, exports, and dependencies                                                             |
| `pnpm size`            | Validate production bundle against 180 kB size limit                                                         |
| `pnpm check`           | Run all validation gates in order (`typecheck`, `lint`, `lint:css`, `format:check`, `test`, `knip`, `build`) |
| `pnpm docker:build`    | Build hardened multi-stage Docker container image                                                            |
| `pnpm docker:run`      | Run production container locally on port 8080                                                                |
| `pnpm docker:dev`      | Start containerized development server via Docker Compose                                                    |
| `pnpm compare:headers` | Verify security & cache header parity between `vercel.json` and `nginx.conf`                                 |

## Project Structure

```
RC Constructions/
├── .github/
│   ├── workflows/       # CI, Lighthouse, Docker, Security, Release-Please
│   ├── ISSUE_TEMPLATE/  # Bug report & feature request templates
│   ├── CODEOWNERS       # Default repository code ownership
│   └── pull_request_template.md
├── .husky/              # Git hooks (pre-commit, commit-msg)
├── docs/                # Architecture, design rules, deployment, phases
├── e2e/                 # Playwright end-to-end and axe a11y tests
├── public/              # Static public assets (favicon.svg)
├── scripts/             # Infrastructure scripts (compare-headers)
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
├── Dockerfile           # Multi-stage hardened unprivileged Docker build
├── docker-compose.yml   # Dev and prod profile orchestration
├── nginx.conf           # Unprivileged Nginx configuration on port 8080
├── vercel.json          # Vercel production hosting configuration
├── renovate.json        # Renovate dependency automation
└── playwright.config.ts # Playwright configuration
```

## Running Checks

Before submitting any code, verify all gates:

```bash
pnpm check
pnpm test:e2e
```

For detailed deployment instructions and branch protection checklist, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
