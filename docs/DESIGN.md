# RC Constructions — Design System Law

This document defines the strict aesthetic and design standards for RC Constructions. It is authoritative law across all phases.

---

## 1. Brand Palette & Usage Rules

The palette evokes raw construction materials, physical drafting paper, structural concrete, and survey site tools.

| Token                     | Hex       | Role & Strict Usage Rules                                                                                                                                                                  |
| :------------------------ | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-concrete`        | `#C4C4BC` | Secondary body text, dimensional measurement callouts, blueprint gridlines.                                                                                                                |
| `--color-limewash`        | `#E9E7DF` | Primary text on dark backgrounds, drawing surface background when light inverted.                                                                                                          |
| `--color-formwork-dark`   | `#232622` | Core site background, dark timber formwork, solid structural foundations.                                                                                                                  |
| `--color-steel`           | `#7A7E78` | Muted captions, technical borders, secondary division lines, mechanical guides.                                                                                                            |
| `--color-work-lamp-amber` | `#E3B341` | **The Sole Accent**: Reserved exclusively for focal illumination, survey registration marks, and the single primary call to action. Never used as general decoration or background washes. |

### Strict Rule for Amber (`#E3B341`)

Work-lamp amber represents a focused construction work-lamp or laser theodolite. It must **never** be used for generic text, backgrounds, multi-color card borders, or decorative noise.

---

## 2. Typography

- **Headlines**: `Big Shoulders Display Variable` (via `@fontsource-variable/big-shoulders-display`).
  - Architectural, industrial, technical, impactful uppercase letterforms.
  - Used for Section Titles, Building Phases, Structural Identifiers.
- **Body & Editorial**: `Newsreader Variable` (via `@fontsource-variable/newsreader`).
  - Editorial, tactile serif providing high-craft human contrast to industrial headlines.
  - Used for project descriptions, technical notes, narrative copy.

### Type Scale

- Display: `7rem` (`--font-size-display`)
- 4XL: `5rem` (`--font-size-4xl`)
- 3XL: `3.75rem` (`--font-size-3xl`)
- 2XL: `2.75rem` (`--font-size-2xl`)
- XL: `2rem` (`--font-size-xl`)
- LG: `1.5rem` (`--font-size-lg`)
- MD: `1.125rem` (`--font-size-md`)
- Base: `1rem` (`--font-size-base`)
- SM: `0.875rem` (`--font-size-sm`)
- XS: `0.75rem` (`--font-size-xs`)

---

## 3. Motion & Animation Principles

- **Scroll-Driven Construction**: The user's scroll position acts as physical time. As the user descends, the architectural structure erects floor by floor, truss by truss.
- **Mechanical, Deliberate Easing**: Physics are grounded in physical steel and concrete mass (`cubic-bezier(0.2, 0, 0, 1)`). No bouncy cartoon easing.
- **Accessibility**: All animations must respect `prefers-reduced-motion: reduce`. When reduced motion is requested, transitions default to instant opacity or static layouts.

---

## 4. The Banned List

The following design clichés and defaults are **strictly forbidden** in this project:

- **Banned Palettes & Shading**:
  - Purple or blue palettes.
  - Color gradients, radiant fills, or gradient text.
  - Glassmorphism, backdrop blurs, or glowing neon orbs.
  - Cream + terracotta defaults.
  - Tinted near-black as a generic style substitute.
- **Banned Layout & Component Tropes**:
  - Monospace micro-labels above everything.
  - All-caps eyebrows floating above headings.
  - Arrows mechanically appended to button labels (`→`, `->`).
  - Identical rounded card grids with drop shadows.
  - Generic fade-up animations on every section entry.
  - Stock-looking hero patterns (e.g. giant generic number + gradient accent).
- **Banned Fonts**:
  - Space Grotesk, Inter, Archivo, Roboto, and default tech-bro typography picks.
