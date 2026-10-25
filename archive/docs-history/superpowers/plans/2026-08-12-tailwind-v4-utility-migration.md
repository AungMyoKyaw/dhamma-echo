# Tailwind CSS v4 Utility Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Svelte/Tauri component CSS selectors with Tailwind CSS v4 utilities while preserving the current UI and retaining only approved global CSS.

**Architecture:** Keep Tailwind's official Vite integration and CSS-first theme tokens. Move each component selector into statically detectable utilities in its owning Svelte markup, using variants and arbitrary values for state, child, and responsive rules; retain only application-global and language-level rules in `src/index.css`.

**Tech Stack:** Svelte 5, Vite 8, Tailwind CSS 4.3.3, `@tailwindcss/vite` 4.3.3, Node test runner, Prettier, ESLint, `svelte-check`

---

### Task 1: Add migration guardrails

**Files:**

- Modify: `tests/site.test.mjs`
- Modify: `scripts/smoke.mjs`

- [ ] **Step 1: Replace selector-era assertions with source-policy tests**

Update the app styling tests to read all `src/**/*.svelte` files and assert that they contain neither `<style` nor `style=`, while `src/index.css` contains the Tailwind import and approved global rules. Add a forbidden-selector list covering every legacy component selector currently in `src/index.css` and assert that none remains.

- [ ] **Step 2: Preserve exact regression assertions in their new location**

Change optical-centering and clear-icon tests to inspect Tailwind class strings in the relevant Svelte sources, including `pt-0.5`, `min-h-10`, `size-6`, and `size-3`. Keep Myanmar typography assertions against the allowed global rule.

- [ ] **Step 3: Update the compiled CSS smoke contract**

In `scripts/smoke.mjs`, replace checks for `.search-form`, `.transport-button`, and `.player-controls` with checks for emitted Tailwind declarations and application theme tokens. Keep the local-assets and application-root checks.

- [ ] **Step 4: Run the guardrails and confirm they fail on legacy selectors**

Run: `bun run site:test && bun run build:web && bun run smoke:web`

Expected: the source-policy test fails because legacy component selectors remain in `src/index.css`.

### Task 2: Migrate application shell, icons, sidebar, and shared controls

**Files:**

- Modify: `src/App.svelte`
- Modify: `src/components/Icon.svelte`
- Modify: `src/components/Sidebar.svelte`
- Modify: `src/components/AsyncState.svelte`
- Modify: `src/components/ProgressiveControls.svelte`
- Modify: `src/index.css`

- [ ] **Step 1: Move shell and icon selectors into markup**

Replace `app-shell`, `app-content`, and `icon` with utilities for full viewport height, overflow, overscroll, stable scrollbar gutter, and full-size block SVG behavior. Use arbitrary properties where Tailwind has no core utility.

- [ ] **Step 2: Move sidebar navigation selectors into markup**

Replace `sidebar-nav-button` and `sidebar-nav-icon` with direct flex, size, alignment, transition, transform, and child-SVG utilities. Preserve the existing conditional active/inactive class strings.

- [ ] **Step 3: Move shared pill and primary-button styles to each control**

Add the exact inline-flex, vertical-centering, transition, hover, active, and disabled utilities to controls in `AsyncState.svelte` and `ProgressiveControls.svelte`. Remove `pill-button`, `primary-button`, and migrated shell/sidebar/icon selectors from `src/index.css`.

- [ ] **Step 4: Verify the first migration unit**

Run: `bunx prettier --write src/App.svelte src/components/Icon.svelte src/components/Sidebar.svelte src/components/AsyncState.svelte src/components/ProgressiveControls.svelte src/index.css && bun run typecheck && bun run site:test`

Expected: type checking passes; the residue test still fails only for selectors assigned to later tasks.

### Task 3: Migrate search, filters, and remaining view controls

**Files:**

- Modify: `src/views/ExploreView.svelte`
- Modify: `src/views/CollectionsView.svelte`
- Modify: `src/views/TeachersView.svelte`
- Modify: `src/views/TeacherDetailView.svelte`
- Modify: `src/views/CollectionDetailView.svelte`
- Modify: `src/views/SettingsView.svelte`
- Modify: `src/index.css`

- [ ] **Step 1: Convert the search grid and responsive rule**

Replace `search-form` with direct grid utilities and max-width arbitrary variants matching 760px, including the first-label full-row child selector.

- [ ] **Step 2: Convert filter pills and clear controls**

Replace `filter-pill`, `active-filter-pill`, and `filter-clear-button` with exact utilities. Preserve optical padding, 40px minimum height, transitions, mixed-color hover borders/backgrounds, and fixed icon sizing using arbitrary `color-mix()` values where needed.

- [ ] **Step 3: Convert every remaining pill and primary control in views**

Replace semantic styling classes in Collections, Teachers, detail views, and Settings with complete Tailwind utility strings, including hover/active/disabled variants.

- [ ] **Step 4: Remove the migrated selectors and verify**

Run: `bunx prettier --write src/views src/index.css && bun run typecheck && bun run site:test`

Expected: type checking passes; only card, track-row, queue, and player selectors remain reported.

### Task 4: Migrate cards, queue panel, and track rows

**Files:**

- Modify: `src/components/CollectionCard.svelte`
- Modify: `src/components/TeacherCard.svelte`
- Modify: `src/components/QueuePanel.svelte`
- Modify: `src/components/TrackRow.svelte`
- Modify: `src/index.css`

- [ ] **Step 1: Convert badges and scrollbar behavior**

Replace `badge-pill` with direct utilities in card and track markup. Replace `scrollbar-thin` using Tailwind arbitrary properties for scrollbar width and color.

- [ ] **Step 2: Convert track-row state and play-button interactions**

Use a Tailwind `group` on the row, direct conditional utility strings for playable/loading/current states, and `group-hover:` utilities for the play button. Preserve dimensions, inset/outer shadows, color mixes, transitions, disabled behavior, and play-icon translation.

- [ ] **Step 3: Convert row action, queue, and progress controls**

Move action-button, queue-button, and progress-track/bar declarations into markup. Keep the Svelte `style:width` directive for runtime download progress because it is a dynamic style directive, not an inline `style` attribute; update the guardrail to distinguish these forms explicitly.

- [ ] **Step 4: Remove migrated selectors and verify**

Run: `bunx prettier --write src/components/CollectionCard.svelte src/components/TeacherCard.svelte src/components/QueuePanel.svelte src/components/TrackRow.svelte src/index.css && bun run typecheck && bun run site:test`

Expected: type checking passes; only player selectors remain reported.

### Task 5: Migrate the audio player

**Files:**

- Modify: `src/components/Player.svelte`
- Modify: `src/index.css`

- [ ] **Step 1: Convert player shell and responsive grid**

Replace player shell/grid selectors with utilities and arbitrary max-width variants matching 1100px and 980px. Preserve column definitions, gaps, padding, minimum height, and shadow.

- [ ] **Step 2: Convert transport and timeline controls**

Move button, primary button, icon, control grouping, and timeline styles into markup. Preserve active scaling, hover shadows, tabular numbers, child sizing, range accent, and responsive dimensions.

- [ ] **Step 3: Convert session, status, retry, volume, rate, and queue controls**

Use direct utilities and attribute variants such as `aria-expanded:` for queue state. Preserve exact dimensions, mixed colors, truncation at 980px, and loading/disabled behavior.

- [ ] **Step 4: Reduce `src/index.css` to its approved boundary**

Remove every remaining component selector. Retain only the Tailwind import and theme, light/dark variables, document viewport rules, focus-visible behavior, reduced motion, and Myanmar typography. Move disabled cursor/opacity and range accent behavior into utilities so no global disabled or range selector remains.

- [ ] **Step 5: Run focused verification**

Run: `bunx prettier --write src/components/Player.svelte src/index.css && bun run typecheck && bun run site:test && bun run build:web && bun run smoke:web`

Expected: all commands pass and no forbidden selector remains.

### Task 6: Run the residue loop and full web verification

**Files:**

- Modify as failures identify: `src/**/*.svelte`, `src/index.css`, `tests/site.test.mjs`, `scripts/smoke.mjs`

- [ ] **Step 1: Scan authored Svelte styling residue**

Run: `rg -n '<style(?:\\s|>)|style=' src --glob '*.svelte'`

Expected: no matches. Separately confirm the intentional dynamic directive with `rg -n 'style:' src --glob '*.svelte'` and expect only the download progress width.

- [ ] **Step 2: Scan legacy semantic styling names**

Run: `rg -n 'app-shell|app-content|search-form|filter-pill|filter-clear-button|active-filter-pill|badge-pill|pill-button|primary-button|sidebar-nav-button|sidebar-nav-icon|track-play-button|track-play-icon|row-action-button|row-queue-button|download-progress|player-shell|player-grid|player-center|player-controls|transport-button|transport-primary-icon|player-timeline|player-session-controls|player-rate-control|player-volume-control|player-volume-icon|player-volume|queue-button|queue-count|player-status|player-retry-button|range-accent|scrollbar-thin' src`

Expected: no matches.

- [ ] **Step 3: Run complete web verification**

Run: `bun run format:web:check && bun run lint && bun run typecheck && bun run test:coverage && bun run build:web && bun run smoke:web && bun run icons:check`

Expected: every command exits successfully with zero lint warnings, zero Svelte warnings, passing coverage thresholds, and a valid production build.

- [ ] **Step 4: Prove excluded documentation styling was untouched**

Run: `git diff --exit-code HEAD -- docs/assets/site.css docs/index.html docs/privacy/index.html`

Expected: no diff.

- [ ] **Step 5: Review and commit the migration**

Run: `git diff --check && git status --short`

Expected: only the implementation plan and scoped application/test files are changed. Commit with `git commit -m "refactor: migrate app styling to Tailwind utilities"` after staging those files.
