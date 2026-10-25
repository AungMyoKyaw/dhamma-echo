# Light-Only Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dark/system theming and make the existing light palette the sole application appearance.

**Architecture:** Delete theme state and event plumbing instead of retaining dead compatibility code. Preserve old settings records by ignoring their `theme` field while validating and migrating playback speed and volume.

**Tech Stack:** Strict TypeScript, Tailwind CSS v4, localStorage, Node test runner.

---

### Task 1: Specify settings migration and light-only rendering

**Files:**

- Modify: `tests/persistence.test.mjs`
- Modify: `tests/app.test.mjs`
- Modify: `tests/store.test.mjs`
- Modify: `tests/view.test.mjs`

- [x] **Step 1: Change persistence expectations**

Assert defaults equal `{ playbackRate: 1, volume: 0.8 }`; old records containing `theme: "dark"` preserve valid playback and volume; unknown themes are ignored; saved JSON does not contain `theme`.

- [x] **Step 2: Remove theme-hook expectations**

Delete `applyTheme` dependencies from app fixtures and assert settings persistence only for rate and volume.

- [x] **Step 3: Remove theme actions and controls from tests**

Delete `set-theme` reducer cases from tests and assert rendered Home/Settings HTML contains neither `cycle-theme` nor `data-setting="theme"`.

- [x] **Step 4: Run `npm test` and verify RED**

Expected failures: production types/defaults still expose `theme`, dependency fixtures still require `applyTheme`, and renderer still emits controls.

### Task 2: Remove runtime theme plumbing

**Files:**

- Modify: `src/types.ts`
- Modify: `src/persistence.ts`
- Modify: `src/store.ts`
- Modify: `src/app.ts`
- Modify: `src/main.ts`
- Modify: `src/view.ts`

- [x] **Step 1: Remove theme from models and persistence**

Delete `Theme` and `SettingsState.theme`. Make defaults return playback rate and volume only; load valid version/rate/volume regardless of an extra legacy theme; save explicit version/rate/volume fields.

- [x] **Step 2: Remove theme actions and dependencies**

Delete `set-theme`, `applyTheme`, `nextTheme`, system media-query handling, and theme input/click handlers.

- [x] **Step 3: Remove theme UI**

Delete the header appearance button and Settings Appearance card, leaving Playback and Data & privacy sections.

- [x] **Step 4: Run `npm test` and verify GREEN**

Expected: all behavior tests pass with light-only settings.

### Task 3: Remove dark CSS and update current copy

**Files:**

- Modify: `src/index.css`
- Modify: `README.md`
- Modify: `docs/index.html`

- [x] **Step 1: Remove dark CSS**

Delete `@custom-variant dark`, `:root.dark`, dark tokens, and the `dark:bg-red-950/20` utility.

- [x] **Step 2: Update current documentation**

Replace current light/dark claims with light-only interface wording. Do not alter historical plans/specifications/verification records.

- [x] **Step 3: Verify no active runtime theme references**

Run `rg -n 'Theme|set-theme|cycle-theme|applyTheme|prefers-color-scheme|:root.dark|dark:' src tests README.md docs/index.html` and require no matches.

### Task 4: Verify and publish

**Files:** all files listed above plus this plan and its design spec.

- [x] **Step 1: Run `npm run verify`**

Require formatting, lint, typecheck, 100% web coverage, build/smoke/icon checks, Clippy, and Rust tests to pass.

- [ ] **Step 2: Commit and push when requested**

Stage only light-only migration files, commit `Remove dark theme support`, push tracked `master`, and verify local/remote hashes match.
