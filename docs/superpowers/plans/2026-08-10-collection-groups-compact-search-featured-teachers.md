# Collection Groups, Compact Search, and Featured Teachers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group Collections by teacher in stable natural order, compact the desktop Explore search form, and curate the six featured teachers from the new database.

**Architecture:** Rust filters all matching audio collections, sorts summaries by normalized teacher and natural collection name, then slices the requested page so Load more boundaries remain globally stable. The TypeScript view groups the accumulated ordered summaries for presentation, uses responsive CSS for a compact search row, and identifies featured teachers by an exact hard-coded ID sequence.

**Tech Stack:** Rust, rusqlite, TypeScript 6, Tailwind CSS 4, DOM rendering, Bun verification.

---

### Task 1: Stable teacher-first collection pagination

**Files:**

- Modify: `src-tauri/src/db.rs`

- [ ] **Step 1: Write failing Rust tests**

Create an in-memory fixture containing two named teachers, one teacherless collection, naturally numbered names, and enough linked audio collections to cross a small page boundary. Assert the flattened order is teacher name ascending, collection natural-name ascending, and unknown teacher last. Assert concatenating two consecutive pages reproduces the corresponding prefix of the full sorted response.

- [ ] **Step 2: Verify RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml collection_search_groups_by_teacher_before_pagination`

Expected: FAIL because SQL currently orders collection names before teacher names and applies pagination before natural sorting.

- [ ] **Step 3: Implement sorting before slicing**

Query all filtered `CollectionSummary` rows without SQL `LIMIT/OFFSET`. Sort with a comparator that:

```rust
match (&left.teacher_id, &right.teacher_id) {
    (None, None) => natural_text_cmp(&left.name, &right.name).then_with(|| left.id.cmp(&right.id)),
    (None, Some(_)) => Ordering::Greater,
    (Some(_), None) => Ordering::Less,
    (Some(_), Some(_)) => natural_text_cmp(&left.teacher_name, &right.teacher_name)
        .then_with(|| natural_text_cmp(&left.name, &right.name))
        .then_with(|| left.id.cmp(&right.id)),
}
```

Set `total` from the full vector length, then return `skip(offset).take(limit)` while retaining validated limit and non-negative offset in the response.

- [ ] **Step 4: Verify GREEN**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --all-features`

Expected: all Rust tests PASS.

### Task 2: Group collection cards and compact Explore

**Files:**

- Modify: `src/view.ts`
- Modify: `src/index.css`
- Modify: `tests/view.test.mjs`

- [ ] **Step 1: Write failing view tests**

Load ordered collection summaries from two teachers plus `Unknown teacher`. Assert visible teacher headings, cards under the correct heading, unknown last, extension of an existing group after append, and no heading when `collectionSearch.teacherId` is selected. Assert the Explore form exposes the compact form hook and no rule forces a single column at ordinary desktop width.

- [ ] **Step 2: Verify RED**

Run: `bun run test`

Expected: FAIL because Collections renders one ungrouped grid and the current 980px rule collapses the search form too aggressively for the application viewport.

- [ ] **Step 3: Implement grouped rendering and responsive search CSS**

Build consecutive groups from the already ordered `page.items`, using teacher ID when available and a final unknown key otherwise. Render each named group as a heading plus its grid. Suppress the heading and outer group spacing when a teacher filter is active.

Keep the existing desktop grid declaration in `renderFilters`. Change responsive CSS so it uses two rows at medium application widths and one column only at the narrowest supported width, while retaining 44–48px control heights and the category-chip full row.

- [ ] **Step 4: Verify GREEN**

Run: `bun run test:coverage`

Expected: all frontend tests PASS at 100% line, branch, and function coverage.

### Task 3: Update curated featured-teacher IDs

**Files:**

- Modify: `src/view.ts`
- Modify: `tests/view.test.mjs`

- [ ] **Step 1: Update tests first and verify RED**

Replace old-schema featured fixtures with IDs `[16, 42, 40, 53, 61, 8]`. Assert Home exact order, Teachers-page pinning and one Featured badge per curated card, skipped missing IDs, regular-teacher order preservation, and search-result order preservation with badges.

Run: `bun run test`

Expected: FAIL because the view still hard-codes the old database IDs.

- [ ] **Step 2: Replace the hard-coded ID sequence**

```ts
const CURATED_FEATURED_TEACHER_IDS = [16, 42, 40, 53, 61, 8] as const;
```

Do not hard-code names or counts; continue reading those values from loaded teacher summaries.

- [ ] **Step 3: Verify GREEN**

Run: `bun run test:coverage`

Expected: all frontend tests PASS at 100% coverage.

### Task 4: Full verification and delivery

**Files:**

- Modify only intentional implementation and test files above.

- [ ] **Step 1: Format and verify**

Run: `bunx prettier --write src/view.ts src/index.css tests/view.test.mjs docs/superpowers/plans/2026-08-10-collection-groups-compact-search-featured-teachers.md`

Run: `cargo fmt --manifest-path src-tauri/Cargo.toml`

Run: `bun run verify`

Expected: formatting, linting, type checking, 100% frontend coverage, build, smoke checks, icons, Clippy, and all Rust tests PASS.

- [ ] **Step 2: Commit and inspect**

```bash
git add src/view.ts src/index.css src-tauri/src/db.rs tests/view.test.mjs docs/superpowers/plans/2026-08-10-collection-groups-compact-search-featured-teachers.md
git commit -m "feat: group collections by featured teachers"
git diff --check
git status --short
```

Expected: clean worktree.

- [ ] **Step 3: Push master**

Run: `git push origin master`

Expected: remote `master` advances to the verified local commit.
