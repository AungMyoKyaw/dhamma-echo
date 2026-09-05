# Dhamma Echo — Design System Audit and Tooling

Date: 2026-09-05
Status: Approved by direct implementation request

## Goal

Rewrite `DESIGN.md` as a proper `@google/design.md` source of truth, then
make the visual-identity contract enforceable so future drift is caught at PR
time.

## Background

The existing `DESIGN.md` was a thin policy summary that described the
warm rust/olive palette, the radius grammar, and the responsive shell, but it
lacked the canonical section order, the YAML token block, and the prose
density that a `design.md`-aware agent needs to generate UI that looks like the
app instead of the centre of the design space.

Three pieces of visual drift existed between the documented rules and the code:

1. `TrackRow.svelte` painted a colored shadow on the track row play disc when
   hovering or holding the current row, in addition to the documented lift on
   the player's primary play button. The new design rules say "no other button
   has a shadow".
2. `KeyboardCheatsheet.svelte` used `rounded-md` (Tailwind 6px) for the kbd
   keycap, breaking the 10/14/full radius grammar.
3. `VideoPlayer.svelte` used `rounded-t-card` (asymmetric) on the video stage
   because the bottom edge joins flush to a controls panel below. The
   exception is now documented as a "stage flush-joined to its panel"
   carve-out, since the bottom edge isn't a visible surface.

## Selected direction: rewrite `DESIGN.md` in the `@google/design.md` format

The new `DESIGN.md` follows the canonical section order — Overview, Colors,
Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts —
and pairs the prose with a YAML token block describing 25 color roles
(including dark variants), 1 typography scale, 3 rounding levels, 6 spacing
tokens, and 22 named components.

### Reference posture

A quiet editorial listening room. Warm parchment canvas, single rust accent
for the one action that matters, a single sans-serif voice that handles
English and Burmese without changing personality. The visual identity is
defined by negation more than by addition: no gradients, no glassmorphism, no
hero moment, no side-stripe accents, no decorative motion, no italic
typography, no second brand color.

### Token names

The semantic names in the frontmatter (`canvas`, `surface`, `primary`,
`on-primary`, etc.) map to the CSS implementation via a small alias table in
`src/designTokens.ts`. The CSS layer adds an `app-` prefix and uses raw
`--color-error` for the error roles; the alias table preserves the readable
frontmatter without forcing a rename.

Dark-mode variants live under `colors.*-dark` and are checked against the
`[data-theme="dark"]` block of `src/index.css`.

## Tooling

Three new scripts land alongside the rewrite. Each is reachable from
`bun run <name>` and is wired into `bun run verify:web`.

### `bun run design:lint`

Runs `@google/design.md lint DESIGN.md` and exits non-zero on any error or
warning. Treats lint warnings as failures so the design file is forced to
stay clean.

### `bun run design:check`

Parses `DESIGN.md` frontmatter and `src/index.css` `@theme` /
`[data-theme="dark"]` blocks, compares the color tokens, and exits non-zero
on drift (missing from CSS, value mismatch, or CSS-only tokens not declared
in the design). Reports the precise paths and values involved.

### `bun run design:export`

Parses `DESIGN.md` and prints the corresponding Tailwind v4 `@theme` block.
Useful for re-seeding `src/index.css` after a deliberate redesign.

### Shared module: `src/designTokens.ts`

A small focused module exposing `parseDesignFrontmatter`, `loadCssTokens`,
`compareTokens`, `formatTailwindTheme`, and `valuesEqual`. Covered by
`tests/designTokens.test.mjs` with full line and near-full branch coverage,
so any change to the comparison logic is enforced by tests.

The module is intentionally narrow — it does not try to be a general YAML
parser. It handles the subset the design file uses (two-level mapping with
optional quoting, token references like `{colors.primary}`, comments, blank
lines) and throws loudly on anything richer.

## Verification

| Change scope | Command |
| ------------ | ------- |
| Web only     | `bun run verify:web` |

`bun run verify:web` now runs (in order) the test policy check, ESLint with
`--max-warnings 0`, svelte-check, the full Node test suite with coverage,
`design:lint`, `design:check`, the production build, the web smoke check, the
icon geometry check, and the MSIX manifest check.

## Out of scope

- Migrating the existing codebase to consume the new `DESIGN.md` tokens at
  runtime. The existing CSS already encodes the same tokens; the script just
  enforces that the two stay in sync.
- Adding a design-tokens preview to the product site.
- Replacing `src/index.css` with the output of `design:export`. The two
  files currently agree, but `index.css` adds line-noise
  (`prefers-color-scheme`, focus styles, reduced-motion styles) that lives
  outside the design token model.