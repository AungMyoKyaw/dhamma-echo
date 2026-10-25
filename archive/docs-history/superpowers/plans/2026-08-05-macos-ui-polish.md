# macOS UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the oversized macOS Dock icon and rebuild Dhamma Echo’s transport controls and responsive footer into a compact, coherent macOS-style player.

**Architecture:** Keep the existing vanilla TypeScript renderer and Tauri shell. Add explicit transport actions through the existing `DhammaApp`/`AudioEngine` boundary, use static CSS classes for responsive layout, and generate platform icon outputs from one corrected 1024px master PNG.

**Tech Stack:** Tauri 2.11, Rust 2024, strict TypeScript, native `HTMLAudioElement`, Tailwind CSS 4, Node test runner, Python Pillow/ImageMagick for deterministic icon generation.

## Global Constraints

- Preserve all existing catalogue, search, queue, favorites, resume, and playback behavior.
- Add no runtime dependency.
- Keep the 860×620 minimum window usable without horizontal overflow.
- Keep core TypeScript coverage at 100% lines, branches, and functions.
- Keep media trust restricted to the existing approved Dhamma Download hosts.
- Produce a verified complete Git bundle.

---

### Task 1: Lock the UI defects into regression tests

**Files:**

- Modify: `tests/view.test.mjs`
- Modify: `tests/app.test.mjs`
- Modify: `scripts/smoke.mjs`
- Create: `scripts/verify-icons.mjs`

**Interfaces:**

- Produces expected actions `seek-backward` and `seek-forward`.
- Produces required player classes `.transport-button`, `.transport-button-primary`, `.player-controls`, `.player-volume-control`.

- [ ] Add view assertions for a complete three-button transport group, accessible labels/titles, compact row play controls, and grouped volume/queue controls.
- [ ] Add app tests proving backward/forward controls move 15 seconds and use engine clamping.
- [ ] Add smoke assertions for explicit player classes and compact-width rules.
- [ ] Add an icon verifier for a 1024px master, transparent outer margin, required generated variants, and Tauri config references.
- [ ] Run focused tests and confirm they fail for the missing design and actions.

### Task 2: Implement transport behavior and event routing

**Files:**

- Modify: `src/app.ts`
- Modify: `src/main.ts`

**Interfaces:**

- `DhammaApp.seekBy(deltaSeconds: number): void` computes from current player time and delegates to `AudioEngine.seek`.
- Click actions `seek-backward` and `seek-forward` call `seekBy(-15)` and `seekBy(15)`.

- [ ] Implement the minimal `seekBy` method.
- [ ] Route the two new click actions.
- [ ] Run focused app tests until green.

### Task 3: Rebuild player and row controls

**Files:**

- Modify: `src/view.ts`
- Modify: `src/index.css`
- Modify: `tests/view.test.mjs`

**Interfaces:**

- Player markup exposes metadata, transport, timeline, speed, volume, and queue as distinct groups.
- Icon renderer supports optical alignment classes without changing icon semantics.

- [ ] Add backward-15, forward-15, and volume glyphs with consistent SVG weight.
- [ ] Replace the footer markup with the approved three-region structure.
- [ ] Reduce row play controls to 36px and add active/pressed states.
- [ ] Add explicit hover, active, focus, disabled, and compact-width CSS.
- [ ] Run view tests, build, and smoke checks until green.

### Task 4: Correct and regenerate the app icon

**Files:**

- Create: `scripts/generate-icons.py`
- Create: `src-tauri/icons/app-icon.png`
- Modify: `src-tauri/icons/32x32.png`
- Modify: `src-tauri/icons/128x128.png`
- Modify: `src-tauri/icons/128x128@2x.png`
- Modify: `src-tauri/icons/icon.icns`
- Modify: `src-tauri/icons/icon.ico`
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**

- One deterministic 1024px master produces all configured icon variants.

- [ ] Generate a padded warm tile and optically centered lotus mark from the existing original SVG geometry.
- [ ] Export PNG variants with high-quality downsampling.
- [ ] Produce `.ico` and `.icns` when local tools support them; otherwise preserve honest blocker evidence and do not claim native regeneration.
- [ ] Point Tauri configuration at the verified generated variants.
- [ ] Run icon verification.

### Task 5: Visual proof, documentation, and delivery

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/ralph-loop.md`
- Create: `docs/verification/2026-08-05-macos-ui-polish.md`
- Create: `docs/images/dhamma-echo-player-polished.png`
- Create: `docs/images/dhamma-echo-player-polished-compact.png`
- Modify: `docs/architecture/modules.md`

**Interfaces:**

- Produces final screenshots, verification evidence, and `dhamma-echo-macos-ui-polished.bundle`.

- [ ] Build static representative states and capture 1280×820 and 860×620 screenshots.
- [ ] Compare baseline and final screenshots for overflow, control balance, alignment, and hierarchy.
- [ ] Run all locally available formatting, lint, type, test, coverage, build, smoke, asset, and security checks.
- [ ] Record unavailable Bun/Rust/native macOS packaging checks as blockers.
- [ ] Commit meaningful changes.
- [ ] Create, verify, clone-test, and recheck the complete Git bundle.
