# Production UI Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Dhamma Echo's desktop UI/UX and release quality without changing product scope or adding production dependencies.

**Architecture:** Keep the existing Svelte/Tauri data and application layers intact. Make UI changes in the shell/components/views, keep reusable layout decisions token-driven, and harden scripts/CI independently of runtime behavior. Production verification remains evidence-based and reports blocked external toolchain gates rather than weakening them.

**Tech Stack:** Svelte 5.56.8, TypeScript 6.x lockfile range, Vite 8.1.5, Tailwind CSS 4.3.3, Tauri 2.11.5, Rust edition 2024, Bun 1.3.14 stable.

## Global Constraints

- Preserve Svelte 5 + Tauri 2 architecture and all existing user-visible product behavior not explicitly changed by this plan.
- Preserve Bun and `bun.lock`; do not migrate package managers.
- Add no production dependency.
- Preserve Tauri CSP/capability/asset scopes unless a verified defect makes a narrow change necessary.
- Minimum window remains 860×620.
- Required tests may not be skipped, disabled, quarantined, or focused-only.
- Measured line/branch/function coverage threshold must be 100%; do not retain the existing 99% branch exception.
- Do not claim separate statement/component coverage unless real instrumentation produces it.

---

### Task 1: Make toolchain and test policy reproducible

**Files:**
- Modify: `package.json`
- Modify: `scripts/test.mjs`
- Create: `scripts/check-tests.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/pages.yml`
- Test: `tests/site-links.test.mjs` only if documentation links change as part of the same commit

**Interfaces:**
- Consumes: existing Bun lockfile and Node test runner.
- Produces: `bun run test:policy` command; package manager metadata pinned to `bun@1.3.14`; 100% Node line/branch/function thresholds.

- [ ] Add `"packageManager": "bun@1.3.14"` and a `test:policy` script that runs `node scripts/check-tests.mjs`.
- [ ] Make `ci`/`verify:web` execute `test:policy` before tests.
- [ ] Implement `scripts/check-tests.mjs` to recursively scan required test files for explicit focused/skipped APIs (`.only(`, `.skip(`, `test.skip`, `test.only`, `describe.skip`, `describe.only`, `xdescribe`, `xit`) while avoiding false positives in ordinary prose/test names.
- [ ] Change `scripts/test.mjs` branch threshold from 99 to 100 and remove the comment that justifies weakening it.
- [ ] Pin all `oven-sh/setup-bun@v2` workflow invocations to `1.3.14`; replace workflow `latest`/`canary` Bun values.
- [ ] Run the test-policy script with Node and prove it returns exit 0 on current tests.
- [ ] Temporarily inject a forbidden marker into a temporary test fixture outside Git history, prove the policy command fails, then remove the fixture and rerun to exit 0.

### Task 2: Harden layout primitives and design tokens

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.svelte`
- Modify: `src/components/Header.svelte`
- Modify: `src/components/Sidebar.svelte`
- Modify: `src/ui.ts`
- Modify: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `routeLabel(route, totalAudio)` from `src/ui.ts`.
- Produces: route header metadata with `eyebrow`, `title`, and concise `detail`; shell data attributes/classes used for responsive layout.

- [ ] Extend route-label tests first to require route-specific supporting `detail` copy for all routes.
- [ ] Run the targeted UI helper test and confirm it fails before implementation.
- [ ] Extend `routeLabel` to return `{ eyebrow, title, detail }` for every route without changing route semantics.
- [ ] Add/adjust theme surface tokens using the Design.md color-role guidance while retaining existing brand seeds and no remote fonts.
- [ ] Make the main content wrapper a CSS container and introduce compact sidebar/main offsets around the current minimum-window range.
- [ ] Make header padding/type scale responsive to the usable pane; render `detail` as secondary copy.
- [ ] Refine sidebar compact spacing, active/focus states, and privacy card without changing destinations.
- [ ] Rerun targeted tests and available formatter/lint/type checks.

### Task 3: Make catalogue discovery surfaces adaptive

**Files:**
- Modify: `src/views/HomeView.svelte`
- Modify: `src/views/ExploreView.svelte`
- Modify: `src/views/TeachersView.svelte`
- Modify: `src/views/CollectionsView.svelte`
- Modify: `src/components/TeacherCard.svelte`
- Modify: `src/components/CollectionCard.svelte`
- Modify: `src/components/TextSearchField.svelte` only if compact control sizing requires it

**Interfaces:**
- Consumes: unchanged view state and app methods.
- Produces: adaptive grid/search layout only; no data API changes.

- [ ] Replace fixed teacher/home stat/card column assumptions with `auto-fit/minmax` or container-query-aware grids.
- [ ] Reflow Explore and Collections search forms at compact content widths while keeping all controls and labels.
- [ ] Refine teacher/collection card hierarchy, hover/focus behavior, metadata placement, and long/Myanmar text behavior.
- [ ] Preserve carousel behavior when Home has recent listening history.
- [ ] Run available Svelte type/lint/build checks and inspect output markup for semantic button/form use.

### Task 4: Refine track rows, async states, and persistent player

**Files:**
- Modify: `src/components/TrackRow.svelte`
- Modify: `src/components/AsyncState.svelte`
- Modify: `src/components/Player.svelte`
- Modify: `src/components/QueuePanel.svelte` only if the compact player/queue overlay conflicts
- Modify: `src/App.svelte` for player bottom-space reservation if needed

**Interfaces:**
- Consumes: unchanged `DhammaApp` playback, download, favorite, seek, rate, volume, and queue methods.
- Produces: responsive presentation only; no player state-machine change.

- [ ] Increase effective targets of critical row/player icon controls and keep accessible names intact.
- [ ] Improve current-track emphasis using shape/border/background plus existing text state, not color alone.
- [ ] Make async error styling theme-safe and loading motion reduced-motion-safe.
- [ ] Compose the player into normal three-zone and compact two-row layouts without removing speed, volume, queue, seek, retry, or progress controls.
- [ ] Ensure main content reserves enough bottom space for both player layouts.
- [ ] Verify error/loading live-region semantics remain intact by source inspection and runtime when available.
- [ ] Run available Svelte/type/lint/build checks.

### Task 5: Document the UI architecture and release workflow

**Files:**
- Create: `docs/architecture/ui-shell.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/ralph-loop.md` only if command names changed during implementation

**Interfaces:**
- Consumes: final shell and command names.
- Produces: contributor-facing Mermaid UI diagram and accurate release documentation.

- [ ] Add a Mermaid diagram for sidebar → header/content container → route views → persistent player/queue layers, including normal/compact layout behavior.
- [ ] Link the new diagram from README architecture section.
- [ ] Update README commands only to match commands that actually exist in `package.json`.
- [ ] Record production UI/tooling hardening in CHANGELOG without inventing a released version/date beyond this work date.
- [ ] Validate every README-local path and Mermaid fence by repository inspection/test scripts.

### Task 6: Run the full release Ralph Loop and create deliverables

**Files:**
- Generated: `coverage/**` when coverage can run
- Generated: `dist/**` when build can run
- Generated: Tauri bundle output when packaging can run
- Generated outside repo: `/mnt/data/dhamma-echo-production-ready.bundle`
- Generated outside repo: visual screenshots under `/mnt/data/dhamma-echo-visual-verification/` when runtime can run

**Interfaces:**
- Consumes: final repository.
- Produces: evidence for every final quality gate and a clone-tested Git bundle.

- [ ] Inspect final dependency/lockfile diff; confirm no unintended production dependency change.
- [ ] Run every available command in `docs/ralph-loop.md` from the final state, recording exact exit status/output.
- [ ] Inspect coverage output; distinguish measured line/branch/function coverage from unavailable statement/Svelte-component coverage.
- [ ] Measure `dist` total bytes and principal JS/CSS asset sizes if build succeeds; compare against baseline if one was obtainable.
- [ ] Start the web mock runtime and capture/inspect 1280×820, 860×620, and dark-theme states with Chromium/Playwright if dependencies are runnable.
- [ ] Run packaging and inspect package size if the host/toolchain supports it.
- [ ] Commit final changes with meaningful commits.
- [ ] Create `/mnt/data/dhamma-echo-production-ready.bundle` using `git bundle create ... --all`.
- [ ] Run `git bundle verify` and clone the bundle to a temporary directory.
- [ ] Inspect the clone's branch/history/files and rerun environment-independent policy/tests from the clone.
- [ ] Assign each final gate exactly `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE` based only on gathered evidence.
