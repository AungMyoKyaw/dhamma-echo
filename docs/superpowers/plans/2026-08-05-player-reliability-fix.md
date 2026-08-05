# Player Reliability Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make Dhamma Echo playback reliable in the Tauri webview, remove the oversized/overlapping player layout, and repair adjacent broken interactions without adding a heavy framework.

**Architecture:** Keep the existing framework-free TypeScript/Tauri architecture. Add a small media-source normalization layer to produce safe HTTPS host fallbacks, harden the audio state machine around metadata/resume/error events, and define the player columns in a static responsive CSS rule rather than a fragile arbitrary utility. Keep the remote host allowlist explicit in both frontend validation and Tauri CSP.

**Tech Stack:** Tauri 2.11, Rust 2024, strict TypeScript, native `HTMLAudioElement`, Tailwind CSS 4, Node test runner.

## Global Constraints

- Preserve the read-only bundled SQLite catalogue.
- Keep media output restricted to Dhamma Download HTTPS hosts; approved catalogue HTTP records may be upgraded before playback.
- Do not add a frontend framework or large player dependency.
- Use test-first changes and keep configured core coverage at 100% lines, branches, and functions.
- Keep the player keyboard-accessible and usable at the 860px minimum window width.
- Produce and validate an updated complete Git bundle.

---

### Task 1: Reproduce the media and layout failures

**Files:**
- Modify: `tests/utils.test.mjs`
- Modify: `tests/player.test.mjs`
- Modify: `tests/view.test.mjs`
- Modify: `scripts/smoke.mjs`

**Interfaces:**
- Consumes: current `AudioEngine`, `isPlayableUrl`, `renderApp`, and compiled CSS.
- Produces: failing regression tests for alternate HTTPS hosts, URL encoding, metadata-safe resume, fallback after media error, explicit player padding, and the compiled static player grid.

- [x] Add a failing URL-candidate test covering bare host, `www`, HTTP upgrade, Unicode/space encoding, unsupported formats, and foreign hosts.
- [x] Add a failing player test proving resume is applied only after `loadedmetadata` and the engine retries the alternate allowed hostname after a media error.
- [x] Add a failing player test proving the final error is emitted only after all candidates fail.
- [x] Add a failing view test for explicit bottom padding and loading/error playback affordances.
- [x] Add a failing build smoke assertion for the compiled three-column player grid rule.
- [x] Run the focused tests and build smoke check; confirm failures are caused by missing behavior.

### Task 2: Add safe media-source normalization and fallback

**Files:**
- Modify: `src/utils.ts`
- Modify: `src/player.ts`
- Modify: `src/types.ts`
- Modify: `src/app.ts`

**Interfaces:**
- Produces: `mediaUrlCandidates(value: string, format: string): string[]`.
- `AudioEngine.setTrack(track, resumeAt)` uses candidates, applies resume on metadata, retries once across approved hosts, and reports stable failure state.
- `DhammaApp.retryPlayback()` restarts the current track from the saved/current position.

- [x] Implement `mediaUrlCandidates` using the URL parser, HTTPS-only output, exact Dhamma Download host allowlist, MP3-only webview support, canonical `www` first, bare-host fallback second, and deduplication.
- [x] Update `isPlayableUrl` to delegate to the candidate resolver.
- [x] Extend `AudioLike` only with the metadata needed for safe resume and diagnostics.
- [x] Implement the smallest audio state-machine changes that pass the new tests.
- [x] Add app retry and progress/resume throttling so time updates do not cause duplicate full renders and storage writes.
- [x] Run player, app, and utility tests until green.

### Task 3: Repair player layout and adjacent interaction bugs

**Files:**
- Modify: `src/view.ts`
- Modify: `src/main.ts`
- Modify: `src/index.css`
- Modify: `scripts/smoke.mjs`

**Interfaces:**
- Consumes: player state and `retryPlayback()`.
- Produces: fixed three-column footer, explicit content clearance, visible loading/error states, retry action, and working teacher selection.

- [x] Replace dynamic Tailwind padding construction with complete static class alternatives.
- [x] Make the player footer fit the window, keep controls in one row, and provide an accessible loading indicator and retry button.
- [x] Fix teacher cards to emit the identifier field consumed by the event controller.
- [x] Update click routing for playback retry.
- [x] Define the player columns in a static `.player-grid` rule so production CSS does not depend on fragile arbitrary-class extraction.
- [x] Run view tests, build, and smoke checks until green.

### Task 4: Align backend classification and desktop security policy

**Files:**
- Modify: `src-tauri/src/db.rs`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `README.md`
- Modify: `docs/architecture/data-flow.md`
- Modify: `docs/ralph-loop.md`

**Interfaces:**
- Rust maps only MP3 records on the approved host to webview-playable and treats same-host HTTP as safely upgradeable by the frontend.
- CSP permits only the bare and `www` HTTPS media origins.

- [x] Add or update Rust unit tests for MP3, WMA, approved hosts, foreign hosts, and HTTP-upgradeable records.
- [x] Implement URL/format classification without widening the media trust boundary.
- [x] Add both approved HTTPS hosts to `media-src`.
- [x] Document fallback behavior, WMA limitation, and the repaired data flow.
- [x] Run every available Rust check; record unavailable toolchain blockers honestly.

### Task 5: Prove, harden, commit, and bundle

**Files:**
- Modify: `docs/verification/2026-08-05-player-repair.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: verified source state and `dhamma-echo-player-fixed.bundle`.

- [x] Run offline lint, strict typecheck, all TypeScript tests, configured 100% coverage, production build, and web smoke checks from a clean state.
- [x] Inspect generated CSS for the player grid and explicit bottom padding utilities.
- [x] Validate JSON, TOML, Markdown links, SVG safety, and SQLite catalogue counts.
- [x] Run standard formatter/linter/Rust/package checks when tools exist; record blockers otherwise.
- [x] Review the diff for secrets, local paths, generated junk, and accidental data changes.
- [ ] Commit meaningful changes.
- [ ] Create the bundle with `git bundle create ... --all`, verify inside a repository, clone it, and repeat the available web verification from the clone.
