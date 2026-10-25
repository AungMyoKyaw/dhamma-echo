# Tailwind CSS v4 Utility Migration Design

## Objective

Migrate all styling owned by the Svelte/Tauri application from component-oriented vanilla CSS selectors to Tailwind CSS v4 utilities while preserving the current interface and behavior. The standalone GitHub Pages site under `docs/` is outside this migration.

## Scope

The migration covers `src/index.css`, `src/App.svelte`, every file under `src/components/`, every file under `src/views/`, and tests or application smoke checks that assert the old selector-based implementation.

The application already uses Tailwind CSS 4.3.3 through `@tailwindcss/vite`. That integration remains in place. No Tailwind v3 configuration file or compatibility layer will be introduced.

## Styling Boundary

Component-specific styling will live directly in Svelte markup as Tailwind utilities. This includes layout, spacing, sizing, borders, colors, typography, interaction states, disabled states, responsive behavior, and parent/attribute-driven variants.

`src/index.css` may retain only:

- `@import "tailwindcss"`;
- Tailwind v4 `@theme` design tokens;
- light and dark theme variable definitions;
- document-wide font, background, viewport, and overflow behavior;
- shared keyboard focus-visible behavior;
- reduced-motion accessibility behavior;
- the language-level `.myanmar-text` typography rule.

It must not retain selectors for an application component, view, control, card, row, navigation item, player element, badge, or button pattern. Svelte files must not add `<style>` blocks or inline `style` attributes as an escape hatch.

## Migration Approach

Use direct utilities rather than `@apply` abstractions. Tailwind arbitrary values will preserve nonstandard dimensions and grid definitions. Tailwind state variants such as `hover:`, `active:`, `disabled:`, `focus-visible:`, `group-hover:`, and attribute variants will replace pseudo-class selectors. Complete conditional utility strings or Svelte class directives will replace semantic state classes such as `is-current`, `is-playable`, and `is-loading`.

Repeated utility groups may remain duplicated when they describe separate native controls. New wrapper components will be introduced only if they provide a behavioral or semantic boundary, not merely to shorten class attributes.

## Migration Loop

The work proceeds through the following loop until its exit conditions pass:

1. Inventory every component selector in `src/index.css` and identify each Svelte consumer.
2. Select one coherent component or view and translate its selector declarations to Tailwind utilities.
3. Preserve dynamic states, parent-child interactions, responsive breakpoints, exact dimensions, transitions, dark-theme token use, and accessibility behavior.
4. Remove the migrated selectors from `src/index.css`.
5. Format the changed files and run focused tests.
6. Run static residue scans for component selectors, `<style>` blocks, and inline `style` attributes.
7. Run lint, Svelte type checking, the complete web test suite with coverage, the production Vite build, and the web smoke test.
8. If any scan, test, or build fails, classify the remaining selector or regression, fix that unit, and repeat from step 2.

The loop ends only when all completion checks pass.

## Visual and Behavioral Fidelity

The migration is implementation-only. It must preserve:

- the fixed sidebar and scrollable application content;
- light and dark theme colors;
- cards, pills, controls, rows, player, queue, and search layout;
- hover, active, loading, selected, disabled, and expanded states;
- player layout changes at 1100px and 980px;
- search layout behavior at 760px;
- minimum application viewport constraints;
- Myanmar line height, line breaking, and vertical padding;
- visible keyboard focus and reduced-motion behavior.

No product redesign or unrelated refactor belongs in this change.

## Tests and Completion Criteria

Existing tests that require obsolete semantic class names or compiled selector names will be rewritten to assert the new contract. The tests must verify that Tailwind v4 remains imported, theme tokens remain defined, allowed global rules remain present, forbidden component selectors are absent from `src/index.css`, and Svelte source files do not contain `<style>` blocks or inline style attributes.

The production smoke test will continue to require a compiled CSS asset and design tokens, but it will stop requiring selectors intentionally removed by the migration. Functional application tests remain unchanged unless their implementation-specific class assertions require updating.

The migration is complete only when:

- no component-specific selector remains in `src/index.css`;
- no Svelte file contains a `<style>` block or inline `style` attribute;
- no obsolete semantic styling class remains in Svelte markup;
- formatting, linting, type checking, tests, coverage, build, and smoke checks pass;
- `docs/assets/site.css` and the GitHub Pages implementation are unchanged.

## Risks and Controls

Tailwind source detection requires complete class names in source, so runtime-generated fragments are prohibited. Parent-driven styles must use statically detectable group or arbitrary variants. Arbitrary values will be used when converting exact legacy values to avoid accidental visual drift. Verification will happen after each coherent migration unit so a regression is localized rather than discovered after a bulk rewrite.
