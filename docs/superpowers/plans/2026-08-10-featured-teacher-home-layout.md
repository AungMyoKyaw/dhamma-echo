# Featured Teacher Home Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show complete featured-teacher names and use the empty Home state effectively with a six-card grid.

**Architecture:** Keep layout selection inside `renderHome`, derived from resolved `homeRecent` state. Reuse `renderTeacherCard` for carousel, grid, and Teachers-page contexts while allowing only carousel cards to require a minimum width.

**Tech Stack:** Strict TypeScript, Tailwind CSS utilities, Node test runner, Tauri/Rust verification.

---

### Task 1: Specify the empty and populated Home layouts

**Files:**

- Modify: `tests/view.test.mjs`

- [x] **Step 1: Add a failing stale-history layout test**

Create state with non-empty `library.history`, `homeRecent.status === "ready"`, and no resolved tracks. Assert that rendered HTML contains `data-featured-layout="grid"`, the `grid-cols-3` class, and the summary value `30,563`.

- [x] **Step 2: Add a failing populated-recent layout test**

Create `homeRecent.status === "ready"` with one track. Assert that rendered HTML contains `data-featured-layout="carousel"` and the Continue Listening heading.

- [x] **Step 3: Add a failing full-title test**

Render a curated teacher with a long Myanmar name. Assert its teacher card does not contain `line-clamp-2`, and that the Featured badge appears before the complete escaped name.

- [x] **Step 4: Verify RED**

Run `npm test`. Expected: the new layout-marker and unclamped-title assertions fail against the current carousel-only markup.

### Task 2: Implement conditional layout and complete teacher names

**Files:**

- Modify: `src/view.ts`

- [x] **Step 1: Derive usable recent-content state**

Add this state rule in `renderHome`:

```ts
const hasRecentContent =
  state.homeRecent.status === "loading" ||
  (state.homeRecent.status === "ready" && state.homeRecent.tracks.length > 0);
```

- [x] **Step 2: Render summary and featured layout from that state**

Use `hasRecentContent` to show summary statistics when recent content is absent. Render a carousel with `data-featured-layout="carousel"` when true and a `grid grid-cols-3 gap-4` container with `data-featured-layout="grid"` when false.

- [x] **Step 3: Let teacher names wrap completely**

Remove `line-clamp-2`, give the card a full-height flex-column structure, move the Featured badge above the name, and use `mt-auto` on Browse talks so cards align without truncating text.

- [x] **Step 4: Verify GREEN**

Run `npm test`. Expected: all view and mock tests pass.

### Task 3: Validate and publish

**Files:**

- Modify: `src/view.ts`
- Modify: `src/mock-data.ts`
- Modify: `tests/view.test.mjs`
- Modify: `tests/mock-data.test.mjs`
- Add: `docs/superpowers/specs/2026-08-10-featured-teacher-home-layout-design.md`
- Add: `docs/superpowers/plans/2026-08-10-featured-teacher-home-layout.md`

- [x] **Step 1: Run full verification**

Run `npm run verify` and require formatting, lint, typecheck, 100% web coverage, build, smoke checks, Clippy, and Rust tests to pass.

- [x] **Step 2: Validate rendered output**

Test `http://127.0.0.1:1420/` through the available Browser integration. Verify page identity, nonblank content, no error overlay, console health, six full teacher titles in the grid, and navigation interaction. If Browser remains unavailable, report that limitation and rely on automated rendering assertions.

- [ ] **Step 3: Commit and push**

Stage only the six implementation/test/design files, commit with `Fix featured teacher home layout`, push `master` to `origin`, and verify local and remote commit hashes match.
