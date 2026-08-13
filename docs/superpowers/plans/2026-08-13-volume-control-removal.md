# Volume Control Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove application-managed volume and rely exclusively on system output volume.

**Architecture:** Delete volume as a vertical feature slice across UI, state, persistence, controller, and audio engine. Preserve backward compatibility by accepting settings records with extra legacy fields while saving only current settings.

**Tech Stack:** TypeScript, Svelte 5, Node test runner, Vite, Bun

---

### Task 1: Settings persistence and state model

**Files:**

- Modify: `tests/persistence.test.mjs`
- Modify: `tests/store.test.mjs`
- Modify: `src/types.ts`
- Modify: `src/persistence.ts`
- Modify: `src/store.ts`

- [x] **Step 1: Write failing persistence and state expectations**

Change expected settings objects to contain `playbackRate`, `browseLimit`, and `theme` only. Add a load case whose stored JSON contains `volume: 0.2` and assert the remaining fields load unchanged. Assert saved JSON has no own `volume` property. Remove dispatches and assertions for `set-volume`.

- [x] **Step 2: Run focused tests to verify failure**

Run: `bun run test -- tests/persistence.test.mjs tests/store.test.mjs`

Expected: FAIL because settings still expose and save `volume`.

- [x] **Step 3: Remove volume from the settings model**

Delete `SettingsState.volume`, the `set-volume` action and reducer branch, the default value, load validation/mapping, and save output. Keep version `1`; ignore extra legacy fields by reading only current keys.

- [x] **Step 4: Run focused tests to verify success**

Run: `bun run test -- tests/persistence.test.mjs tests/store.test.mjs`

Expected: PASS.

### Task 2: Controller and audio engine

**Files:**

- Modify: `tests/app.test.mjs`
- Modify: `tests/player.test.mjs`
- Modify: `src/app.ts`
- Modify: `src/player.ts`

- [x] **Step 1: Write failing API-removal expectations**

Remove calls to `app.setVolume` and `engine.setVolume` from behavior tests. Add source-contract assertions that `src/app.ts` contains neither `setVolume` nor `set-volume`, and `src/player.ts` contains no `setVolume` or assignment to `audio.volume`.

- [x] **Step 2: Run focused tests to verify failure**

Run: `bun run test -- tests/app.test.mjs tests/player.test.mjs`

Expected: FAIL because production volume APIs still exist.

- [x] **Step 3: Delete volume plumbing**

Remove `set-volume` from persisted settings actions; remove volume initialization from startup, play, and retry; delete `DhammaApp.setVolume`; remove `AudioLike.volume` and `AudioEngine.setVolume`.

- [x] **Step 4: Run focused tests to verify success**

Run: `bun run test -- tests/app.test.mjs tests/player.test.mjs`

Expected: PASS.

### Task 3: User interface

**Files:**

- Modify: `tests/site.test.mjs`
- Modify: `src/views/SettingsView.svelte`
- Modify: `src/components/Player.svelte`
- Modify: `src/components/Icon.svelte`

- [x] **Step 1: Add failing UI absence assertions**

Read the Svelte sources in `tests/site.test.mjs` and assert they do not contain `Default volume`, `aria-label="Volume"`, `setVolume`, or `name="volume"`.

- [x] **Step 2: Run UI test to verify failure**

Run: `bun run site:test`

Expected: FAIL because both volume sliders and the volume icon still exist.

- [x] **Step 3: Remove volume UI**

Delete the Settings volume label/range, the Player volume label/range/icon, the unused `volume` icon union member, and its SVG branch. Preserve speed, queue, transport, and responsive layout behavior.

- [x] **Step 4: Run UI test to verify success**

Run: `bun run site:test`

Expected: PASS.

### Task 4: Current documentation and complete verification

**Files:**

- Modify: `README.md`
- Modify: `docs/index.html`
- Modify: `docs/privacy/index.html`
- Modify: `docs/architecture/data-flow.md`
- Modify: `CHANGELOG.md`

- [x] **Step 1: Remove current-feature volume claims**

Rewrite current product descriptions to omit volume, remove volume from locally stored privacy data, and remove the volume-setting step from the playback sequence. Adjust only current capability wording in the changelog; leave historical specifications and verification records intact.

- [x] **Step 2: Scan active sources for leftover volume plumbing**

Run: `rg -n -i 'set-volume|setVolume|settings\.volume|audio\.volume|Default volume|aria-label="Volume"|name="volume"' src tests README.md docs/index.html docs/privacy/index.html docs/architecture CHANGELOG.md`

Expected: no matches.

- [x] **Step 3: Format changed files**

Run: `bun run format:web`

Expected: exit 0.

- [x] **Step 4: Run full verification**

Run: `bun run verify`

Expected: exit 0 with formatting, lint, type-check, test, build, site, audit, Clippy, Cargo test, and release build checks passing.

- [x] **Step 5: Commit the implementation**

```bash
git add src tests README.md docs/index.html docs/privacy/index.html docs/architecture/data-flow.md CHANGELOG.md docs/superpowers/plans/2026-08-13-volume-control-removal.md
git commit -m "refactor: remove application volume controls"
```
