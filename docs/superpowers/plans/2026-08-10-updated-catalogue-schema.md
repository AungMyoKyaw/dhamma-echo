# Updated Catalogue Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the application, tests, and current documentation with the cleaned SQLite catalogue containing `teachers` and `media`.

**Architecture:** Keep the narrow Rust boundary over the two retained runtime tables. Make catalogue-size copy data-driven from `CatalogueSummary`, update the real-database regression coverage to the new counts, and refresh only current user-facing references; historical verification records remain historical.

**Tech Stack:** Rust, rusqlite, Tauri commands, strict TypeScript, Node test runner, SQLite, Git LFS.

---

### Task 1: Lock the new runtime behavior with failing tests

**Files:**

- Modify: `tests/view.test.mjs`
- Modify: `src-tauri/src/db.rs`

- [x] **Step 1: Change the view expectation to the current catalogue size**

Use `30,563` audio talks, `267` teachers, `30,098` Myanmar audio talks, and `465` English audio talks in the summary fixture and rendered-count assertion.

- [x] **Step 2: Replace the ignored real-database diagnostic**

Make the bundled-database test active and assert the current summary counts plus a 50-row blank search page. This verifies that the cleaned database still opens through the production query path.

- [x] **Step 3: Run the focused tests and verify RED**

Run `npm run build:web && node --test tests/view.test.mjs` and `cargo test --manifest-path src-tauri/Cargo.toml bundled_database_exposes_current_catalogue`.

Expected: the view test fails because the header still hardcodes `21,402`; the Rust test fails until its new test name/assertions are added.

### Task 2: Make the catalogue count data-driven and update Rust coverage

**Files:**

- Modify: `src/view.ts`
- Modify: `src-tauri/src/db.rs`

- [x] **Step 1: Render the Explore eyebrow from loaded summary data**

Change the `renderHeader` route label from a literal count to `${state.summary.data.totalAudio.toLocaleString("en-US")} audio talks`, preserving the existing route title and formatting.

- [x] **Step 2: Add the active bundled-database regression test**

Open `src-tauri/resources/dhamma.db` through `Database::open_read_only`, assert summary values `30563`, `267`, `30098`, and `465`, then assert a blank search returns `total == 30563` and 50 items.

- [x] **Step 3: Run focused tests and verify GREEN**

Run `npm run build:web && node --test tests/view.test.mjs` and `cargo test --manifest-path src-tauri/Cargo.toml bundled_database_exposes_current_catalogue`.

### Task 3: Refresh current fixtures and public catalogue references

**Files:**

- Modify: `src/mock-data.ts`
- Modify: `tests/app.test.mjs`
- Modify: `tests/view.test.mjs`
- Modify: `tests/site.test.mjs`
- Modify: `README.md`
- Modify: `docs/index.html`

- [x] **Step 1: Update mock and app/view summary fixtures**

Use the new four summary values so web tests model the bundled catalogue.

- [x] **Step 2: Update current public counts**

Replace current product copy showing `21,402` and `212` with `30,563` and `267` in the README and product site, including the site test assertion.

- [x] **Step 3: Run the complete verification suite**

Run `npm test`, `npm run typecheck`, `npm run build:web`, `cargo test --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

### Task 4: Verify the final SQLite/LFS state

**Files:**

- Modify: `src-tauri/resources/dhamma.db`

- [x] **Step 1: Confirm only runtime tables remain**

Run `sqlite3 src-tauri/resources/dhamma.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"` and verify `media`, `sqlite_sequence`, and `teachers` only.

- [x] **Step 2: Refresh the LFS pointer**

Run `git add src-tauri/resources/dhamma.db` and verify `git lfs ls-files --long` reports the current SHA-256 object.

- [x] **Step 3: Review status and diff summary**

Run `git status --short` and `git diff --cached --stat`; do not create a worktree or commit unless explicitly requested.
